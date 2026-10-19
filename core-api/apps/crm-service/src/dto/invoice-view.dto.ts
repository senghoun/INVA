import { ApiProperty } from '@nestjs/swagger';

/**
 * Projected view of an Invoice for external customer portal consumption.
 * Deliberately omits internal fields (ledger entries, notes, etc.).
 */
export class PortalInvoiceViewDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'INV-20241001-001' })
  invoiceNumber!: string;

  @ApiProperty({ example: 'ISSUED' })
  status!: string;

  @ApiProperty({ example: 45000.0 })
  totalAmount!: string;

  @ApiProperty({ example: 'USD' })
  currency!: string;

  @ApiProperty({ example: '2024-10-01T00:00:00.000Z', nullable: true })
  issuedAt!: Date | null;

  @ApiProperty({ example: '2024-10-31', nullable: true })
  dueDate!: Date | null;

  @ApiProperty({ description: 'Line items on the invoice' })
  items!: Array<{
    description: string;
    quantity: string;
    unitPrice: string;
    lineTotal: string;
  }>;
}
