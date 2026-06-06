import "express-session";

declare module "express-session" {
  interface SessionData {
    user?: {
      id: string;
      tenantId: string;
      branchId: string | null;
      email?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      role: string;
      isSuperAdmin?: boolean | null;
      isTeacher?: boolean | null;
    };
  }
}
