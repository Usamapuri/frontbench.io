import type { Request, Response, NextFunction } from 'express';
import { runWithTenant } from './db';

/**
 * Pins a tenant-scoped DB connection (RLS role + app.tenant_id) for the lifetime of the
 * request, exposed transparently via the `db` proxy in ./db.
 *
 * Carve-outs (run on the shared superuser pool, RLS bypassed — by design):
 *  - Unauthenticated requests (no session user yet, e.g. login).
 *  - Platform super-admin (role === 'super_admin') who needs cross-tenant access.
 *    NOTE: tenant admins are role 'management' with isSuperAdmin=true — they are NOT
 *    a carve-out and MUST stay tenant-scoped.
 *
 * Must be registered AFTER session + tenantContextMiddleware and BEFORE tenant routes.
 */
export function tenantDbMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = (req.session as any)?.user;

  if (!user?.tenantId || user.role === 'super_admin') {
    return next();
  }

  runWithTenant(user.tenantId, user.branchId ?? null, () =>
    new Promise<void>((resolve) => {
      let settled = false;
      const done = () => {
        if (!settled) {
          settled = true;
          resolve(); // releases the pinned connection in runWithTenant's finally
        }
      };
      res.on('finish', done);
      res.on('close', done);
      next();
    }),
  ).catch((err) => {
    console.error('tenantDbMiddleware error:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to establish tenant database context' });
    }
  });
}
