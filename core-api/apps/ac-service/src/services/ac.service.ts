import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Decimal } from '@prisma/client/runtime/library';
import { AcRepository, InvoiceWithItems, InvoiceWithLedger } from '../repositories/ac.repository';
import { ApproveInvoiceDto } from '../dto/approve-invoice.dto';
import { JwtPayload } from '@common';
import { Invoice, Prisma } from '@prisma/client-ac';

const ACCOUNT_CODES = {
  ACCOUNTS_RECEIVABLE: '1200',
  REVENUE: '4000',
} as const;

@Injectable()
export class AcService {
  private readonly logger = new Logger(AcService.name);

  constructor(
    private readonly acRepository: AcRepository,
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
  ) {}

  async getAllInvoices(): Promise<Invoice[]> {
    return this.acRepository.findAllInvoices();
  }

  async getInvoiceById(id: string): Promise<InvoiceWithItems> {
    const invoice = await this.acRepository.findInvoiceById(id);
    if (!invoice) throw new NotFoundException(`Invoice "${id}" not found.`);
    return invoice;
  }

  async createInvoice(dto: any): Promise<InvoiceWithItems> {
    const invoiceNumber = await this.acRepository.generateInvoiceNumber();
    let totalAmount = new Decimal(0);
    const items = (dto.items || []).map((item: any, idx: number) => {
      const q = new Decimal(item.quantity || 1);
      const u = new Decimal(item.unitPrice || 0);
      const lineTotal = q.mul(u);
      totalAmount = totalAmount.add(lineTotal);
      return {
        description: item.description,
        quantity: q,
        unitPrice: u,
        lineTotal,
        sortOrder: idx,
      };
    });

    return this.acRepository.createInvoiceWithItems(
      {
        invoiceNumber,
        dealId: dto.dealId,
        clientOrgId: dto.clientOrgId,
        status: 'DRAFT',
        totalAmount,
        currency: dto.currency || 'USD',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : this.calculateDueDate(30),
      },
      items,
    );
  }

  /**
   * Approves an invoice — role-gated to finance_manager.
   * Atomically: status → ISSUED + double-entry GL entries.
   * Then publishes invoice.issued event.
   */
  async approveInvoice(
    invoiceId: string,
    dto: ApproveInvoiceDto,
    actor: JwtPayload,
  ): Promise<InvoiceWithLedger> {
    const isAuthorized =
      actor.roles.includes('finance_manager') ||
      actor.roles.includes('ACCOUNTANT') ||
      actor.roles.includes('ADMIN');

    if (!isAuthorized) {
      throw new ForbiddenException(
        'Only users with the "finance_manager", "ACCOUNTANT", or "ADMIN" role can approve invoices.',
      );
    }

    const invoice = await this.acRepository.findInvoiceWithLedger(invoiceId);
    if (!invoice) {
      throw new NotFoundException(`Invoice "${invoiceId}" not found.`);
    }
    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException(
        `Invoice "${invoiceId}" is in "${invoice.status}" status and cannot be approved.`,
      );
    }

    const notesSuffix = dto.notes ? ` — ${dto.notes}` : '';
    const now = new Date();

    /**
     * Double-entry bookkeeping:
     *   DEBIT  1200 Accounts Receivable  (asset ↑)
     *   CREDIT 4000 Revenue              (revenue ↑)
     */
    const ledgerEntries: Prisma.GeneralLedgerEntryCreateManyInput[] = [
      {
        invoiceId: invoice.id,
        entryType: 'DEBIT',
        accountCode: ACCOUNT_CODES.ACCOUNTS_RECEIVABLE,
        amount: invoice.totalAmount,
        description: `AR — Invoice ${invoice.invoiceNumber}${notesSuffix}`,
        recordedAt: now,
        recordedBy: actor.sub,
      },
      {
        invoiceId: invoice.id,
        entryType: 'CREDIT',
        accountCode: ACCOUNT_CODES.REVENUE,
        amount: invoice.totalAmount,
        description: `Revenue — Invoice ${invoice.invoiceNumber}${notesSuffix}`,
        recordedAt: now,
        recordedBy: actor.sub,
      },
    ];

    const approved = await this.acRepository.approveInvoice(invoiceId, ledgerEntries);

    try {
      const enqueuePromise = this.notificationsQueue.add(
        'invoice.issued',
        {
          invoiceId: approved.id,
          invoiceNumber: approved.invoiceNumber,
          clientOrgId: approved.clientOrgId,
          totalAmount: approved.totalAmount.toString(),
          currency: approved.currency,
          issuedAt: approved.issuedAt,
          dueDate: approved.dueDate,
        },
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 3000 },
          removeOnComplete: 200,
          removeOnFail: 100,
        },
      );
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis enqueue timed out after 2000ms')), 2000),
      );
      await Promise.race([enqueuePromise, timeoutPromise]);
    } catch (err: any) {
      this.logger.warn(
        `Could not enqueue invoice.issued notification to Redis: ${err.message}. Invoice ${approved.invoiceNumber} remains approved.`,
      );
    }

    this.logger.log(
      `Invoice ${invoice.invoiceNumber} approved by ${actor.email}. GL entries written.`,
    );

    return approved;
  }

  /**
   * Called by DealBillingConsumer — creates a DRAFT invoice from deal data.
   */
  async createDraftInvoiceFromDeal(payload: {
    dealId: string;
    clientOrgId: string;
    amount: string;
    currency: string;
  }): Promise<InvoiceWithItems> {
    const totalAmount = new Decimal(payload.amount);
    const invoiceNumber = await this.acRepository.generateInvoiceNumber();

    const invoice = await this.acRepository.createInvoiceWithItems(
      {
        invoiceNumber,
        dealId: payload.dealId,
        clientOrgId: payload.clientOrgId,
        status: 'DRAFT',
        totalAmount,
        currency: payload.currency,
        dueDate: this.calculateDueDate(30),
      },
      [
        {
          description: `Services per Deal ${payload.dealId}`,
          quantity: new Decimal(1),
          unitPrice: totalAmount,
          lineTotal: totalAmount,
          sortOrder: 0,
        },
      ],
    );

    this.logger.log(
      `Draft invoice ${invoiceNumber} created from deal ${payload.dealId}.`,
    );

    return invoice;
  }

  private calculateDueDate(netDays: number): Date {
    const due = new Date();
    due.setDate(due.getDate() + netDays);
    return due;
  }
}
