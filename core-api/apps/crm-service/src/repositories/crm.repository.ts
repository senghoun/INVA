import { Injectable } from '@nestjs/common';
import { CrmPrismaService } from '../database/crm-prisma.service';
import {
  Deal,
  ClientOrganization,
  CustomerProfile,
  Prisma,
} from '@prisma/client-crm';

@Injectable()
export class CrmRepository {
  constructor(private readonly prisma: CrmPrismaService) {}

  // ─── Deals ────────────────────────────────────────────────────────────────

  async findDealById(id: string): Promise<Deal | null> {
    return this.prisma.deal.findUnique({
      where: { id },
      include: { organization: true },
    });
  }

  async findAllDeals(): Promise<Deal[]> {
    return this.prisma.deal.findMany({
      include: { organization: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDeal(data: Prisma.DealCreateInput): Promise<Deal> {
    return this.prisma.deal.create({ data });
  }

  async updateDeal(id: string, data: Prisma.DealUpdateInput): Promise<Deal> {
    return this.prisma.deal.update({ where: { id }, data });
  }

  // ─── Client Organizations ─────────────────────────────────────────────────

  async findOrgById(id: string): Promise<ClientOrganization | null> {
    return this.prisma.clientOrganization.findUnique({ where: { id } });
  }

  async findAllOrgs(): Promise<ClientOrganization[]> {
    return this.prisma.clientOrganization.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createOrg(
    data: Prisma.ClientOrganizationCreateInput,
  ): Promise<ClientOrganization> {
    return this.prisma.clientOrganization.create({ data });
  }

  // ─── Customer Profiles ────────────────────────────────────────────────────

  async findCustomerByAuthUserId(
    authUserId: string,
  ): Promise<CustomerProfile | null> {
    return this.prisma.customerProfile.findUnique({ where: { authUserId } });
  }

  async createCustomer(
    data: Prisma.CustomerProfileCreateInput,
  ): Promise<CustomerProfile> {
    return this.prisma.customerProfile.create({ data });
  }
}
