// Summarizes the domain guards. Custom role names have no automatic domain access.
export const accessDomains = ['Administration', 'HR', 'CRM', 'Accounting', 'IT'] as const;
export type AccessLevel = 'Manage' | 'Read' | '—';
export function roleAccess(name: string): AccessLevel[] {
  switch (name.toUpperCase()) {
    case 'ADMIN': return ['Manage', 'Manage', 'Manage', 'Manage', 'Manage'];
    case 'HR_ADMIN': return ['—', 'Manage', '—', '—', '—'];
    case 'CRM_MANAGER': return ['—', '—', 'Manage', '—', '—'];
    case 'ACCOUNTANT': case 'FINANCE_MANAGER': return ['—', '—', '—', 'Manage', '—'];
    case 'IT_ADMIN': return ['—', '—', '—', '—', 'Manage'];
    case 'AUDITOR': return ['—', 'Read', 'Read', 'Read', 'Read'];
    default: return ['—', '—', '—', '—', '—'];
  }
}
export function accessSummary(name: string): string {
  const access = roleAccess(name);
  return access.map((level, index) => level === '—' ? '' : `${accessDomains[index]}: ${level.toLowerCase()}`).filter(Boolean).join(' · ') || 'Custom role · no automatic service access';
}
