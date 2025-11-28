/**
 * Merchant Data Type
 * Matches the structure returned from getUserAccountData action
 */
export interface MerchantData {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  storeName?: string;
  storeImageUrl: string | null;
  emailVerified: Date | boolean | null;
  createdAt: Date;
  updatedAt: Date;
}
