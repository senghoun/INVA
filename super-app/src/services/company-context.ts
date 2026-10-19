let revision = 0;
export function companyRevision() { return revision; }
const KEY = 'inva_active_company';
export function getActiveCompany(): string | null { return sessionStorage.getItem(KEY); }
export function setActiveCompany(companyId: string | null) {
  ++revision;
  if (companyId) sessionStorage.setItem(KEY, companyId); else sessionStorage.removeItem(KEY);
  window.dispatchEvent(new Event('inva:company-changed'));
}
