import { Request, Response, NextFunction } from 'express';

interface RolePermissions {
  [role: string]: {
    [resource: string]: string[];
  };
}

const permissions: RolePermissions = {
  admin: {
    user: ['create', 'read', 'update', 'delete'],
    contact: ['create', 'read', 'update', 'delete'],
    product: ['create', 'read', 'update', 'delete'],
    category: ['create', 'read', 'update', 'delete'],
    analytical: ['create', 'read', 'update', 'delete'],
    coa: ['create', 'read', 'update', 'delete'],
    journal: ['create', 'read', 'update', 'delete'],
    journalEntry: ['create', 'read', 'update', 'post'],
    salesOrder: ['create', 'read', 'update', 'confirm', 'cancel'],
    customerInvoice: ['create', 'read', 'update', 'confirm', 'pay', 'cancel'],
    purchaseOrder: ['create', 'read', 'update', 'confirm', 'cancel'],
    vendorBill: ['create', 'read', 'update', 'confirm', 'pay', 'cancel'],
    budget: ['create', 'read', 'update', 'delete', 'confirm', 'revise', 'cancel'],
    payment: ['create', 'read', 'update', 'confirm', 'cancel'],
    report: ['read'],
    dashboard: ['read'],
  },
  accountant: {
    contact: ['create', 'read', 'update', 'delete'],
    product: ['create', 'read', 'update', 'delete'],
    category: ['create', 'read', 'update', 'delete'],
    analytical: ['create', 'read', 'update', 'delete'],
    coa: ['create', 'read', 'update', 'delete'],
    journal: ['create', 'read', 'update', 'delete'],
    journalEntry: ['create', 'read', 'update', 'post'],
    salesOrder: ['create', 'read', 'update', 'confirm'],
    customerInvoice: ['create', 'read', 'update', 'confirm', 'pay', 'cancel'],
    purchaseOrder: ['create', 'read', 'update', 'confirm'],
    vendorBill: ['create', 'read', 'update', 'confirm', 'pay', 'cancel'],
    budget: ['create', 'read', 'update', 'confirm', 'revise'],
    payment: ['create', 'read', 'update', 'confirm'],
    report: ['read'],
    dashboard: ['read'],
  },
user: {
    customerInvoice: ['read', 'pay', 'print', 'send'],
    payment: ['read'],
  },
};

export function authorizeResource(resource: string, action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required', field: null, details: {} },
      });
    }

    const rolePerms = permissions[req.user.role];
    if (!rolePerms || !rolePerms[resource] || !rolePerms[resource].includes(action)) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions', field: null, details: {} },
      });
    }

    next();
  };
}

export { permissions };
