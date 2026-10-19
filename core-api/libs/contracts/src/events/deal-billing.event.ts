export interface DealReadyForBillingPayload {
  dealId: string;
  clientOrgId: string;
  amount: string | number;
  currency: string;
  ownerId?: string;
}

export interface InvoiceIssuedPayload {
  invoiceId: string;
  invoiceNumber: string;
  clientOrgId: string;
  totalAmount: string | number;
}
