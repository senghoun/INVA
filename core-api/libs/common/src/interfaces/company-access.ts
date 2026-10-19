export const COMPANY_PERMISSIONS = [
  'hr.employee.view', 'hr.employee.private.view', 'hr.employee.manage', 'hr.employee.delete', 'hr.employee.access.manage',
  'hr.attendance.view', 'hr.attendance.clock', 'hr.attendance.manage', 'hr.leave.view', 'hr.leave.request', 'hr.leave.manage', 'hr.leave.approve',
  'hr.payroll.view', 'hr.payroll.manage', 'hr.payroll.approve',
  'finance.invoice.view', 'finance.invoice.issue', 'finance.ledger.view',
  'crm.customer.view', 'crm.customer.manage', 'crm.deal.view', 'crm.deal.manage',
  'platform.organization.view', 'platform.organization.manage', 'platform.documents.view', 'platform.documents.manage',
] as const;
