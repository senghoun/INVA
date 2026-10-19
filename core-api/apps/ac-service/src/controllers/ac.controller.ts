import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AcService } from '../services/ac.service';
import { ApproveInvoiceDto } from '../dto/approve-invoice.dto';
import { CreateInvoiceDto } from '../dto/invoice.dto';
import {
  JwtAuthGuard,
  RolesGuard,
  RequireRoles,
  UserTypeGuard,
  RequireUserType,
  CurrentUser,
  JwtPayload,
} from '@common';

@ApiTags('ac')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, UserTypeGuard, RolesGuard)
@RequireRoles('ADMIN', 'ACCOUNTANT', 'finance_manager')
@RequireUserType('INTERNAL')
@Controller('ac')
export class AcController {
  constructor(private readonly acService: AcService) {}

  @Get('invoices')
  @RequireRoles('ADMIN', 'ACCOUNTANT', 'finance_manager', 'AUDITOR')
  @ApiOperation({ summary: '[INTERNAL] List all invoices' })
  @ApiResponse({ status: 200, description: 'Array of invoices' })
  getAllInvoices() {
    return this.acService.getAllInvoices();
  }

  @Post('invoices')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[INTERNAL] Create a new draft invoice' })
  @ApiResponse({ status: 201, description: 'Created draft invoice' })
  createInvoice(@Body() dto: CreateInvoiceDto) {
    return this.acService.createInvoice(dto);
  }

  @Get('invoices/:id')
  @RequireRoles('ADMIN', 'ACCOUNTANT', 'finance_manager', 'AUDITOR')
  @ApiOperation({ summary: '[INTERNAL] Get invoice with line items' })
  @ApiResponse({ status: 200, description: 'Invoice with items' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  getInvoice(@Param('id', ParseUUIDPipe) id: string) {
    return this.acService.getInvoiceById(id);
  }

  /**
   * The finance approval endpoint.
   *
   * Guards:
   *   - JwtAuthGuard: valid JWT required
   *   - UserTypeGuard + @RequireUserType('INTERNAL'): blocks external users at the HTTP layer
   *   - Role check 'finance_manager': enforced inside AcService.approveInvoice()
   *
   * On success:
   *   - Invoice status → ISSUED
   *   - Balanced GL entries written atomically
   *   - invoice.issued event published to notifications queue
   */
  @Post('invoices/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[INTERNAL — finance_manager] Approve a DRAFT invoice',
    description:
      'Sets invoice status to ISSUED, writes double-entry GL records, and publishes invoice.issued event.',
  })
  @ApiResponse({ status: 200, description: 'Invoice approved with GL entries' })
  @ApiResponse({ status: 400, description: 'Invoice is not in DRAFT status' })
  @ApiResponse({ status: 403, description: 'Not an internal user or missing finance_manager role' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  approveInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveInvoiceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.acService.approveInvoice(id, dto, user);
  }
}
