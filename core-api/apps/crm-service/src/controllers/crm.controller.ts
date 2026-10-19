import {
  Controller,
  Post,
  Get,
  Body,
  Param,
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
import { CrmService } from '../services/crm.service';
import {
  CreateDealDto,
  CreateClientOrganizationDto,
  CreateCustomerProfileDto,
} from '../dto/deal.dto';
import { PortalInvoiceViewDto } from '../dto/invoice-view.dto';
import {
  JwtAuthGuard,
  RolesGuard,
  RequireRoles,
  UserTypeGuard,
  RequireUserType,
  CurrentUser,
  JwtPayload,
} from '@common';

@ApiTags('crm')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireRoles('ADMIN', 'CRM_MANAGER')
@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  // ─── Organizations (internal) ─────────────────────────────────────────────

  @Get('organizations')
  @RequireRoles('ADMIN', 'CRM_MANAGER', 'AUDITOR')
  @UseGuards(UserTypeGuard)
  @RequireUserType('INTERNAL')
  @ApiOperation({ summary: '[INTERNAL] List all client organizations' })
  @ApiResponse({ status: 200 })
  getAllOrganizations() {
    return this.crmService.getAllOrganizations();
  }

  @Post('organizations')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(UserTypeGuard)
  @RequireUserType('INTERNAL')
  @ApiOperation({ summary: '[INTERNAL] Create a client organization' })
  @ApiResponse({ status: 201 })
  createOrganization(@Body() dto: CreateClientOrganizationDto) {
    return this.crmService.createOrganization(dto);
  }

  // ─── Customer Profiles (internal) ────────────────────────────────────────

  @Post('customers')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(UserTypeGuard)
  @RequireUserType('INTERNAL')
  @ApiOperation({ summary: '[INTERNAL] Register an external customer profile' })
  @ApiResponse({ status: 201 })
  createCustomer(@Body() dto: CreateCustomerProfileDto) {
    return this.crmService.createCustomerProfile(dto);
  }

  // ─── Deals (internal) ─────────────────────────────────────────────────────

  @Get('deals')
  @RequireRoles('ADMIN', 'CRM_MANAGER', 'AUDITOR')
  @UseGuards(UserTypeGuard)
  @RequireUserType('INTERNAL')
  @ApiOperation({ summary: '[INTERNAL] List all deals with organizations' })
  @ApiResponse({ status: 200 })
  getAllDeals() {
    return this.crmService.getAllDeals();
  }

  @Post('deals')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(UserTypeGuard)
  @RequireUserType('INTERNAL')
  @ApiOperation({ summary: '[INTERNAL] Create a new deal' })
  @ApiResponse({ status: 201 })
  createDeal(
    @Body() dto: CreateDealDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.crmService.createDeal(dto, user);
  }

  @Get('deals/:id')
  @RequireRoles('ADMIN', 'CRM_MANAGER', 'AUDITOR')
  @UseGuards(UserTypeGuard)
  @RequireUserType('INTERNAL')
  @ApiOperation({ summary: '[INTERNAL] Get a deal by ID' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  getDeal(@Param('id', ParseUUIDPipe) id: string) {
    return this.crmService.getDealById(id);
  }

  /**
   * Core cross-domain trigger: marks a deal WON and enqueues a billing job.
   * The AC module consumer picks this up and creates the invoice.
   */
  @Post('deals/:id/won')
  @HttpCode(HttpStatus.OK)
  @UseGuards(UserTypeGuard)
  @RequireUserType('INTERNAL')
  @ApiOperation({
    summary: '[INTERNAL] Mark deal as WON — publishes deal.ready_for_billing event',
  })
  @ApiResponse({ status: 200, description: 'Deal updated and billing job enqueued' })
  @ApiResponse({ status: 400, description: 'Deal already WON or LOST' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  markDealWon(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.crmService.markDealWon(id, user);
  }

  // ─── Customer Portal (external) ───────────────────────────────────────────

  /**
   * External customer-facing endpoint.
   * Row-level security enforced inside CrmService.getPortalInvoice().
   * Only ISSUED or PAID invoices belonging to the user's org are returned.
   */
  @Get('portal/invoices/:id')
  @RequireRoles()
  @UseGuards(UserTypeGuard)
  @RequireUserType('EXTERNAL')
  @ApiOperation({
    summary: '[EXTERNAL] Retrieve a single issued invoice from the customer portal',
  })
  @ApiResponse({ status: 200, type: PortalInvoiceViewDto })
  @ApiResponse({ status: 403, description: 'Invoice does not belong to your organization' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  getPortalInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<PortalInvoiceViewDto> {
    return this.crmService.getPortalInvoice(id, user);
  }
}
