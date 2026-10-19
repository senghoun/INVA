import { request } from './api';
import { API_ROUTES } from '../config/api';

export interface ClientOrganization {
  id: string;
  name: string;
  industry?: string | null;
  website?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DealStatus = 'OPEN' | 'WON' | 'LOST';

export interface Deal {
  id: string;
  title: string;
  clientOrgId: string;
  ownerId: string;
  status: DealStatus;
  amount: string;
  currency: string;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  organization?: ClientOrganization;
}

export interface CreateDealDto {
  title: string;
  amount: number;
  currency?: string;
  clientOrgId: string;
}

export interface CreateClientOrganizationDto {
  name: string;
  industry?: string;
  website?: string;
}

export class CrmService {
  async getOrganizations(): Promise<ClientOrganization[]> {
    return request<ClientOrganization[]>(`${API_ROUTES.CRM}/organizations`);
  }

  async createOrganization(dto: CreateClientOrganizationDto): Promise<ClientOrganization> {
    return request<ClientOrganization>(`${API_ROUTES.CRM}/organizations`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async getDeals(): Promise<Deal[]> {
    return request<Deal[]>(`${API_ROUTES.CRM}/deals`);
  }

  async getDealById(id: string): Promise<Deal> {
    return request<Deal>(`${API_ROUTES.CRM}/deals/${id}`);
  }

  async createDeal(dto: CreateDealDto): Promise<Deal> {
    return request<Deal>(`${API_ROUTES.CRM}/deals`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async markDealWon(id: string): Promise<Deal> {
    return request<Deal>(`${API_ROUTES.CRM}/deals/${id}/won`, {
      method: 'POST',
    });
  }
}

export const crmService = new CrmService();
