import { request } from './api';
import { API_ROUTES } from '../config/api';

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED';

export interface InvoiceItem {
  id?: string;
  invoiceId?: string;
  description: string;
  quantity: string | number;
  unitPrice: string | number;
  lineTotal: string | number;
  sortOrder?: number;
}

export interface GeneralLedgerEntry {
  id: string;
  invoiceId: string;
  entryType: 'DEBIT' | 'CREDIT';
  accountCode: string;
  amount: string;
  description: string;
  recordedAt: string;
  recordedBy: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  dealId?: string | null;
  clientOrgId: string;
  status: InvoiceStatus;
  totalAmount: string;
  currency: string;
  issuedAt?: string | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: InvoiceItem[];
  ledgerEntries?: GeneralLedgerEntry[];
}

export interface CreateInvoiceDto {
  dealId: string;
  clientOrgId: string;
  currency?: string;
  dueDate?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface ApproveInvoiceDto {
  notes?: string;
}

export class AccountingService {
  async getInvoices(): Promise<Invoice[]> {
    return request<Invoice[]>(`${API_ROUTES.AC}/invoices`);
  }

  async getInvoiceById(id: string): Promise<Invoice> {
    return request<Invoice>(`${API_ROUTES.AC}/invoices/${id}`);
  }

  async createInvoice(dto: CreateInvoiceDto): Promise<Invoice> {
    return request<Invoice>(`${API_ROUTES.AC}/invoices`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async approveInvoice(id: string, notes?: string): Promise<Invoice> {
    return request<Invoice>(`${API_ROUTES.AC}/invoices/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes: notes || 'Approved via Super-App Finance Console' }),
    });
  }
}

export const accountingService = new AccountingService();
