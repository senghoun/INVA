import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Receipt,
  FileCheck,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  RefreshCw,
  X,
  FileText,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import {
  accountingService,
  Invoice,
  InvoiceItem,
  GeneralLedgerEntry,
} from '../../services/accounting.service';
import { crmService, Deal, ClientOrganization } from '../../services/crm.service';
import { DatalistSelect } from '../common/DatalistSelect';
import { ModalPortal } from '../common/ModalPortal';
import { DatePicker, Label } from '../common';

export const AccountingManager: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [orgs, setOrgs] = useState<ClientOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'ISSUED' | 'PAID'>('ALL');
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Modals
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);

  // Create invoice form
  const [newInvForm, setNewInvForm] = useState({
    dealId: '',
    clientOrgId: '',
    currency: 'USD',
    dueDate: '',
    description: 'Professional Enterprise Services & Implementation',
    quantity: '1',
    unitPrice: '15000',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [invList, dealList, orgList] = await Promise.all([
        accountingService.getInvoices().catch(() => []),
        crmService.getDeals().catch(() => []),
        crmService.getOrganizations().catch(() => []),
      ]);
      setInvoices(invList);
      setDeals(dealList);
      setOrgs(orgList);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (invoiceId: string) => {
    setApprovingId(invoiceId);
    setErrorMsg(null);
    setSuccessNotice(null);
    try {
      const approved = await accountingService.approveInvoice(
        invoiceId,
        'Approved by Finance Manager via Super-App'
      );
      setSuccessNotice(
        `✓ Invoice ${approved.invoiceNumber} approved! Status is now ISSUED. Balanced GL ledger records posted (DEBIT 1200 / CREDIT 4000).`
      );
      await loadData();
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        const refreshed = await accountingService.getInvoiceById(invoiceId);
        setSelectedInvoice(refreshed);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to approve invoice');
    } finally {
      setApprovingId(null);
    }
  };

  const handleOpenDetails = async (inv: Invoice) => {
    try {
      const full = await accountingService.getInvoiceById(inv.id);
      setSelectedInvoice(full);
    } catch {
      setSelectedInvoice(inv);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await accountingService.createInvoice({
        dealId: newInvForm.dealId,
        clientOrgId: newInvForm.clientOrgId,
        currency: newInvForm.currency,
        dueDate: newInvForm.dueDate || undefined,
        items: [
          {
            description: newInvForm.description,
            quantity: parseFloat(newInvForm.quantity) || 1,
            unitPrice: parseFloat(newInvForm.unitPrice) || 0,
          },
        ],
      });
      setShowCreateInvoice(false);
      setSuccessNotice('New draft invoice created successfully!');
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const totalBilled = invoices.reduce((acc, inv) => acc + (parseFloat(inv.totalAmount) || 0), 0);
  const draftCount = invoices.filter((i) => i.status === 'DRAFT').length;
  const issuedCount = invoices.filter((i) => i.status === 'ISSUED' || i.status === 'PAID').length;

  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      inv.invoiceNumber?.toLowerCase().includes(q) ||
      inv.clientOrgId?.toLowerCase().includes(q) ||
      inv.dealId?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel rounded-2xl p-5 border border-dark-border">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
                <span>Accounting & Financial Ledger</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  Port :3004
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Double-entry General Ledger bookkeeping, invoice issuance, and finance approval controls
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-dark-card border border-dark-border text-slate-300 hover:text-white transition"
            title="Refresh Invoices"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <button
            onClick={() => setShowCreateInvoice(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 flex items-center space-x-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Draft Invoice</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-4 border border-dark-border flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Receivables Billed</p>
            <p className="text-2xl font-black text-slate-100 mt-1">
              ${totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-dark-border flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Draft Pending Approval</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{draftCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-dark-border flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Issued / Posted to GL</p>
            <p className="text-2xl font-black text-teal-400 mt-1">{issuedCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <span>{successNotice}</span>
          <button onClick={() => setSuccessNotice(null)} className="text-emerald-400 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-border pb-3">
        <div className="flex space-x-2">
          {(['ALL', 'DRAFT', 'ISSUED', 'PAID'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                statusFilter === status
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-dark-surface/40 border border-transparent'
              }`}
            >
              {status} ({status === 'ALL' ? invoices.length : invoices.filter((i) => i.status === status).length})
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoice number or org..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-dark-bg/80 border border-dark-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="glass-panel rounded-2xl border border-dark-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
            <span>Loading invoices & ledger...</span>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No invoices found. When deals are marked WON in CRM, draft invoices appear here automatically!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-dark-surface/80 border-b border-dark-border text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Client Org</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Finance Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {filteredInvoices.map((inv) => {
                  const isDraft = inv.status === 'DRAFT';
                  const isIssued = inv.status === 'ISSUED';
                  const isPaid = inv.status === 'PAID';
                  const clientOrg = orgs.find((o) => o.id === inv.clientOrgId);

                  return (
                    <tr key={inv.id} className="hover:bg-dark-surface/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-mono font-bold text-slate-100">{inv.invoiceNumber}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            isDraft
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : isIssued
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-teal-500/15 text-teal-300 border-teal-500/30'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-100 font-bold font-mono">
                          ${parseFloat(inv.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}{' '}
                          <span className="text-[10px] text-slate-400">{inv.currency}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {clientOrg ? (
                          <span className="font-medium text-slate-200">{clientOrg.name}</span>
                        ) : (
                          <span className="font-mono text-slate-500 text-[11px]">
                            {inv.clientOrgId ? `${inv.clientOrgId.substring(0, 8)}...` : 'N/A'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px] font-mono">
                        {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenDetails(inv)}
                          className="px-2.5 py-1 rounded-lg bg-dark-card border border-dark-border text-slate-300 hover:text-white transition text-[11px]"
                        >
                          Details & GL
                        </button>

                        {isDraft && (
                          <button
                            onClick={() => handleApprove(inv.id)}
                            disabled={approvingId === inv.id}
                            className="px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-[11px] transition shadow-sm disabled:opacity-50 inline-flex items-center space-x-1"
                          >
                            {approvingId === inv.id ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>Posting...</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-3 h-3" />
                                <span>Approve & Post</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Details & GL Modal */}
      {selectedInvoice && (
        <ModalPortal onClose={() => setSelectedInvoice(null)}>
          <div
            className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto modal-backdrop-animate"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedInvoice(null);
            }}
          >
            <div className="glass-panel rounded-2xl max-w-2xl w-full p-6 border border-dark-border space-y-5 max-h-[85vh] overflow-y-auto my-8 modal-dialog-animate">
              <div className="flex items-center justify-between border-b border-dark-border pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <span>Invoice {selectedInvoice.invoiceNumber}</span>
                    <span
                      className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        selectedInvoice.status === 'DRAFT'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {selectedInvoice.status}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ID: <span className="font-mono">{selectedInvoice.id}</span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1 rounded-lg hover:bg-dark-surface text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Invoice Line Items */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Invoice Line Items
                </h4>
                <div className="rounded-xl border border-dark-border overflow-hidden bg-dark-bg/60">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-dark-surface/60 border-b border-dark-border text-slate-400 font-semibold text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Item Description</th>
                        <th className="py-2.5 px-3 text-right">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border">
                      {(selectedInvoice.items && selectedInvoice.items.length > 0) ? (
                        selectedInvoice.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-2.5 px-3">{item.description}</td>
                            <td className="py-2.5 px-3 text-right font-mono">{parseFloat(String(item.quantity))}</td>
                            <td className="py-2.5 px-3 text-right font-mono">
                              ${parseFloat(String(item.unitPrice)).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-100 font-mono">
                              ${parseFloat(String(item.lineTotal)).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      ) : (
                      <tr>
                        <td colSpan={4} className="py-3 px-3 text-center text-slate-500 italic">
                          Standard contract line item ($
                          {parseFloat(selectedInvoice.totalAmount).toFixed(2)})
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-dark-surface/40 font-bold text-slate-100">
                      <td colSpan={3} className="py-2.5 px-3 text-right uppercase text-[10px]">
                        Total Amount Due:
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-400 text-sm">
                        ${parseFloat(selectedInvoice.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}{' '}
                        <span className="text-xs font-normal">{selectedInvoice.currency}</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* General Ledger Entries (if issued) */}
            <div className="space-y-2 pt-2 border-t border-dark-border">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-teal-400" />
                  <span>Double-Entry General Ledger Records</span>
                </h4>
                {selectedInvoice.status === 'ISSUED' && (
                  <span className="text-[10px] text-teal-400 font-mono bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                    BALANCED ACID POSTING
                  </span>
                )}
              </div>

              {selectedInvoice.status === 'DRAFT' ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                  This invoice is currently in <strong>DRAFT</strong> status. General Ledger entries (DEBIT 1200 Accounts Receivable / CREDIT 4000 Revenue) will be atomically generated when approved by Finance.
                </div>
              ) : (selectedInvoice.ledgerEntries && selectedInvoice.ledgerEntries.length > 0) ? (
                <div className="rounded-xl border border-dark-border overflow-hidden bg-dark-bg/60">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-dark-surface/60 border-b border-dark-border text-slate-400 font-semibold text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Account Code</th>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border">
                      {selectedInvoice.ledgerEntries.map((entry) => (
                        <tr key={entry.id}>
                          <td className="py-2 px-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                                entry.entryType === 'DEBIT'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {entry.entryType}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-200">
                            {entry.accountCode}
                          </td>
                          <td className="py-2 px-3 text-slate-300">{entry.description}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-100">
                            ${parseFloat(entry.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-dark-surface border border-dark-border text-xs text-slate-400">
                  Standard double-entry GL records: DEBIT 1200 AR (${parseFloat(selectedInvoice.totalAmount).toFixed(2)}) / CREDIT 4000 Revenue (${parseFloat(selectedInvoice.totalAmount).toFixed(2)}).
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-dark-border">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-xl bg-dark-surface text-slate-300 hover:text-white text-xs"
              >
                Close
              </button>
              {selectedInvoice.status === 'DRAFT' && (
                <button
                  onClick={() => handleApprove(selectedInvoice.id)}
                  disabled={approvingId === selectedInvoice.id}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {approvingId === selectedInvoice.id ? 'Approving...' : 'Approve & Post to GL'}
                </button>
              )}
            </div>
          </div>
        </div>
      </ModalPortal>
      )}

      {/* Create Draft Invoice Modal */}
      {showCreateInvoice && (
        <ModalPortal onClose={() => setShowCreateInvoice(false)}>
          <div
            className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto modal-backdrop-animate"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowCreateInvoice(false);
            }}
          >
            <div className="glass-panel rounded-2xl max-w-md w-full p-6 border border-dark-border space-y-4 my-8 modal-dialog-animate">
              <div className="flex items-center justify-between border-b border-dark-border pb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  <span>Create Draft Invoice</span>
                </h3>
                <button
                  onClick={() => setShowCreateInvoice(false)}
                  className="p-1 rounded-lg hover:bg-dark-surface text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">CRM Deal *</label>
                  <DatalistSelect
                    required
                    value={newInvForm.dealId}
                    onChange={(selectedDealId) => {
                      const deal = deals.find((d) => d.id === selectedDealId);
                      setNewInvForm({
                        ...newInvForm,
                        dealId: selectedDealId,
                        clientOrgId: deal ? deal.clientOrgId : newInvForm.clientOrgId,
                        unitPrice: deal ? deal.amount : newInvForm.unitPrice,
                      });
                    }}
                    options={deals.map((deal) => {
                      const org = orgs.find((o) => o.id === deal.clientOrgId);
                      return {
                        id: deal.id,
                        label: `${deal.title} (${org?.name || 'Client'})`,
                        sublabel: `$${parseFloat(deal.amount).toLocaleString()} ${deal.currency}`,
                      };
                    })}
                    placeholder="Search closed deal..."
                    accentColor="emerald"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Line Item Description *</label>
                  <input
                    required
                    type="text"
                    value={newInvForm.description}
                    onChange={(e) => setNewInvForm({ ...newInvForm, description: e.target.value })}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <Label htmlFor="invoice-due-date">Due date (optional)</Label>
                  <DatePicker id="invoice-due-date" value={newInvForm.dueDate} onChange={value => setNewInvForm(previous => ({ ...previous, dueDate: value }))} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Unit Price ($) *</label>
                    <input
                      required
                      type="number"
                      min="1"
                      step="0.01"
                      value={newInvForm.unitPrice}
                      onChange={(e) => setNewInvForm({ ...newInvForm, unitPrice: e.target.value })}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Quantity</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={newInvForm.quantity}
                      onChange={(e) => setNewInvForm({ ...newInvForm, quantity: e.target.value })}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-dark-border">
                  <button
                    type="button"
                    onClick={() => setShowCreateInvoice(false)}
                    className="px-4 py-2 rounded-xl bg-dark-surface text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create Draft Invoice'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};
