export interface SubscriptionMetadata {
  walletAddress: string;
  tier: "basic" | "pro" | "enterprise";
  startDate: string; // ISO date
  nextBilling: string; // ISO date
  status: "active" | "cancelled" | "grace" | "expired";
  approvalId?: string;
}

export interface WalletInfoResponse {
  address: string;
  credentialId: string;
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}
