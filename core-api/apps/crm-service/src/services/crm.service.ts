import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CrmRepository } from '../repositories/crm.repository';
import {
  CreateDealDto,
  CreateClientOrganizationDto,
  CreateCustomerProfileDto,
} from '../dto/deal.dto';
import { PortalInvoiceViewDto } from '../dto/invoice-view.dto';
import { JwtPayload } from '@common';
import { DealReadyForBillingPayload } from '@contracts';
import { Deal, ClientOrganization, CustomerProfile } from '@prisma/client-crm';

export { DealReadyForBillingPayload };

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);

  constructor(
    private readonly crmRepository: CrmRepository,
    @InjectQueue('billing') private readonly billingQueue: Queue,
  ) {}

  // ─── Deals ────────────────────────────────────────────────────────────────

  async getAllDeals(): Promise<Deal[]> {
    return this.crmRepository.findAllDeals();
  }

  async getDealById(id: string): Promise<Deal> {
    const deal = await this.crmRepository.findDealById(id);
    if (!deal) throw new NotFoundException(`Deal "${id}" not found.`);
    return deal;
  }

  async createDeal(dto: CreateDealDto, actor: JwtPayload): Promise<Deal> {
    const org = await this.crmRepository.findOrgById(dto.clientOrgId);
    if (!org) {
      throw new NotFoundException(
        `ClientOrganization "${dto.clientOrgId}" not found.`,
      );
    }
    return this.crmRepository.createDeal({
      title: dto.title,
      amount: dto.amount,
      currency: dto.currency ?? 'USD',
      ownerId: actor.sub,
      organization: { connect: { id: dto.clientOrgId } },
    });
  }

  /**
   * Marks a deal WON and enqueues a deal.ready_for_billing job.
   * The AC consumer picks this up and creates a DRAFT invoice in its own DB.
   */
  async markDealWon(dealId: string, actor: JwtPayload): Promise<Deal> {
    const deal = await this.getDealById(dealId);

    if (deal.status === 'WON') {
      throw new BadRequestException(`Deal "${dealId}" is already marked as WON.`);
    }
    if (deal.status === 'LOST') {
      throw new BadRequestException(`Cannot re-open a LOST deal.`);
    }

    const updatedDeal = await this.crmRepository.updateDeal(dealId, {
      status: 'WON',
      closedAt: new Date(),
    });

    const jobPayload: DealReadyForBillingPayload = {
      dealId: deal.id,
      clientOrgId: deal.clientOrgId,
      amount: deal.amount.toString(),
      currency: deal.currency,
      ownerId: deal.ownerId,
    };

    try {
      const enqueuePromise = this.billingQueue.add('deal.ready_for_billing', jobPayload, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis enqueue timed out after 2000ms')), 2000),
      );
      await Promise.race([enqueuePromise, timeoutPromise]);
      this.logger.log(
        `Deal ${dealId} marked WON by ${actor.email}. Billing job enqueued.`,
      );
    } catch (err: any) {
      this.logger.warn(
        `Could not enqueue billing job to Redis: ${err.message}. Verify Redis connection.`,
      );
    }

    return updatedDeal;
  }

  // ─── Organizations & Customers ────────────────────────────────────────────

  async getAllOrganizations(): Promise<ClientOrganization[]> {
    return this.crmRepository.findAllOrgs();
  }

  async createOrganization(
    dto: CreateClientOrganizationDto,
  ): Promise<ClientOrganization> {
    return this.crmRepository.createOrg({
      name: dto.name,
      industry: dto.industry,
      website: dto.website,
    });
  }

  async createCustomerProfile(
    dto: CreateCustomerProfileDto,
  ): Promise<CustomerProfile> {
    return this.crmRepository.createCustomer({
      authUserId: dto.authUserId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      organization: { connect: { id: dto.clientOrgId } },
    });
  }

  // ─── External Customer Portal ─────────────────────────────────────────────

  /**
   * Row-level secure portal read. Reads from inva_ac_db via injected AcRepository.
   * The external user's JWT must contain orgId — checked against invoice.clientOrgId.
   */
  async getPortalInvoice(
    invoiceId: string,
    actor: JwtPayload,
  ): Promise<PortalInvoiceViewDto> {
    if (!actor.orgId) {
      throw new ForbiddenException(
        'External users must have an orgId claim to access portal invoices.',
      );
    }

    const acBaseUrl = process.env.AC_SERVICE_URL || 'http://127.0.0.1:3004';
    let invoice: any;
    try {
      const response = await fetch(`${acBaseUrl}/api/v1/ac/invoices/${invoiceId}`, {
        signal: AbortSignal.timeout(3000),
      });
      if (response.status === 404) {
        throw new NotFoundException(`Invoice "${invoiceId}" not found.`);
      }
      if (!response.ok) {
        throw new BadRequestException('Failed to retrieve invoice from Accounting Service.');
      }
      invoice = await response.json();
    } catch (err: any) {
      if (
        err instanceof NotFoundException ||
        err instanceof BadRequestException ||
        err instanceof ForbiddenException
      ) {
        throw err;
      }
      this.logger.error(
        `Error querying AC service at ${acBaseUrl}: ${err.message}`,
      );
      throw new BadRequestException('Accounting Service is currently unreachable.');
    }

    // Row-level security: invoice must belong to caller's organisation
    if (invoice.clientOrgId !== actor.orgId) {
      throw new ForbiddenException(
        'You are not authorized to view this invoice.',
      );
    }

    if (invoice.status !== 'ISSUED' && invoice.status !== 'PAID') {
      throw new ForbiddenException(
        'This invoice is not yet available in the portal.',
      );
    }

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      totalAmount: invoice.totalAmount.toString(),
      currency: invoice.currency,
      issuedAt: invoice.issuedAt ? new Date(invoice.issuedAt) : null,
      dueDate: invoice.dueDate ? new Date(invoice.dueDate) : null,
      items: (invoice.items || [])
        .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
        .map((item: any) => ({
          description: item.description,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          lineTotal: item.lineTotal.toString(),
        })),
    };
  }
}
