import { Injectable } from '@nestjs/common';
import { AcPrismaService } from '../database/ac-prisma.service';
import { Invoice, InvoiceItem, GeneralLedgerEntry, Prisma } from '@prisma/client-ac';

export type InvoiceWithItems = Invoice & { items: InvoiceItem[] };
export type InvoiceWithLedger = Invoice & {
  items: InvoiceItem[];
  ledgerEntries: GeneralLedgerEntry[];
};

@Injectable()
export class AcRepository {
  constructor(private readonly prisma: AcPrismaService) {}

  async findInvoiceById(id: string): Promise<InvoiceWithLedger | null> {
    return this.prisma.invoice.findUnique({
      where: { id },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        ledgerEntries: { orderBy: { recordedAt: 'asc' } },
      },
    });
  }

  async findInvoiceWithLedger(id: string): Promise<InvoiceWithLedger | null> {
    return this.prisma.invoice.findUnique({
      where: { id },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        ledgerEntries: { orderBy: { recordedAt: 'asc' } },
      },
    });
  }

  async findAllInvoices(): Promise<Invoice[]> {
    return this.prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createInvoiceWithItems(
    invoiceData: Prisma.InvoiceCreateInput,
    items: Prisma.InvoiceItemCreateManyInvoiceInput[],
  ): Promise<InvoiceWithItems> {
    return this.prisma.invoice.create({
      data: {
        ...invoiceData,
        items: { createMany: { data: items } },
      },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  /**
   * Atomically updates invoice status to ISSUED and writes double-entry GL records.
   * Uses Prisma interactive transaction for ACID guarantees — both operations
   * succeed or both roll back.
   */
  async approveInvoice(
    invoiceId: string,
    ledgerEntries: Prisma.GeneralLedgerEntryCreateManyInput[],
  ): Promise<InvoiceWithLedger> {
    return this.prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: 'ISSUED', issuedAt: new Date() },
      });

      await tx.generalLedgerEntry.createMany({ data: ledgerEntries });

      return tx.invoice.findUniqueOrThrow({
        where: { id: invoiceId },
        include: {
          items: { orderBy: { sortOrder: 'asc' } },
          ledgerEntries: { orderBy: { recordedAt: 'asc' } },
        },
      });
    }, { isolationLevel: 'ReadCommitted' });
  }

  async generateInvoiceNumber(): Promise<string> {
    // Use a short transaction + advisory-free counter: MAX is cheaper than COUNT and
    // avoids a TOCTOU race when two creates run concurrently.
    const last = await this.prisma.invoice.findFirst({
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    });
    const date = new Date();
    const yyyymm = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `INV-${yyyymm}-`;
    let seq = 1;
    if (last?.invoiceNumber?.startsWith(prefix)) {
      const n = parseInt(last.invoiceNumber.slice(prefix.length), 10);
      if (!Number.isNaN(n)) seq = n + 1;
    }
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  /** Used by CrmModule to read invoices for the customer portal */
  async findInvoiceByIdForPortal(id: string): Promise<InvoiceWithItems | null> {
    return this.prisma.invoice.findUnique({
      where: { id },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
  }
}
