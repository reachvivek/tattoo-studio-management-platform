export interface Lead {
  id?: number;
  name: string;
  email: string;
  whatsappCountryCode: string;
  whatsappNumber: string;
  tattooDescription: string;
  referenceImages?: string[];
  discountPercentage?: number;
  status?: string;
  createdAt?: Date;
}

export interface CreateLeadRequest {
  name: string;
  email: string;
  whatsappCountryCode: string;
  whatsappNumber: string;
  tattooDescription: string;
  referenceImages?: string[];
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface LeadResponse {
  success: boolean;
  message?: string;
  data?: Lead;
  error?: string;
}

export interface CampaignStats {
  total_leads: number;
  daily_leads: number;
  remaining_slots: number;
}

export interface StatsResponse {
  success: boolean;
  data?: CampaignStats;
  error?: string;
}
