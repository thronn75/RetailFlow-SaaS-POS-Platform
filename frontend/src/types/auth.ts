export type UserRole = "OWNER" | "ADMIN" | "MANAGER" | "CASHIER";

export interface AuthUser {
  userId: string;
  tenantId: string;
  fullName: string;
  email: string;
  role: UserRole;
  token: string;
  message: string;
}
