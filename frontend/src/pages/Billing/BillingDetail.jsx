import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useClinic } from '../../context/ClinicContext';
import { PaymentBadge } from '../../components/common/Badge';
import { Modal, LoadingSpinner } from '../../components/common/Modal';
import {
  Printer,
  ArrowLeft,
  HeartPulse,
  CreditCard,
  CheckCircle,
  Receipt,
  User,
  Calendar,
} from 'lucide-react';

export function BillingDetail() {
  const { billId } = useParams();
  const { isAdmin, isReceptionist } = useAuth();
  const { clinic } = useClinic();
  const [billData, setBillData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Payment modal state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('UPI');
  const [payRef, setPayRef] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadBill = async () => {
    try {
      setLoading(true);
      const res = await api.billing.getById(billId);
      setBillData(res.bill);
      setPayAmount(res.bill.balance_due || '');
    } catch (err) {
      console.error('Failed to load bill:', err);
      setError(err.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBill();
  }, [billId]);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await api.billing.addPayment(billId, {
        amount: parseFloat(payAmount),
        payment_method: payMethod,
        transaction_reference: payRef,
      });
      setPayModalOpen(false);
      loadBill();
    } catch (err) {
      alert(err.message || 'Failed to record payment');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <LoadingSpinner text="Rendering clinic invoice & receipt..." />;

  if (error || !billData) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-rose-600 font-semibold mb-3">{error || 'Invoice not found'}</p>
        <Link
          to="/billing"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </Link>
      </div>
    );
  }

  const bill = billData;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      {/* Action buttons (hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <Link
          to="/billing"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Billing
        </Link>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {bill.balance_due > 0 && (isAdmin || isReceptionist) && (
            <button
              onClick={() => {
                setPayAmount(bill.balance_due);
                setPayModalOpen(true);
              }}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" /> Record Payment
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print Invoice
          </button>
        </div>
      </div>

      {/* Invoice Card (Print-friendly) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-12 border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
        {/* Clinic Invoice Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-8 border-b-2 border-slate-100">
          <div className="flex items-center gap-3.5">
            {clinic?.logo_url ? (
              <img
                src={clinic.logo_url}
                alt={clinic.clinic_name}
                className="w-12 h-12 object-contain rounded-xl bg-slate-50 p-1 border border-slate-200 shrink-0 shadow-2xs"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shrink-0">
                <HeartPulse className="w-7 h-7" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-black text-slate-900">
                {clinic?.clinic_name || 'AuraCare Clinic'}
              </h1>
              <p className="text-xs text-slate-500">
                {clinic?.address || '108 Healthcare Blvd, Central Medical District, Pune'}
              </p>
              <p className="text-[11px] text-slate-400">
                Phone: {clinic?.phone || '+91 98000 00000'} • GST / Tax ID:{' '}
                {clinic?.tax_id || '27AABCA1234F1Z5'}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tax Invoice / Receipt
            </span>
            <div className="font-mono text-lg font-black text-teal-700 mt-0.5">
              {bill.bill_number}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Date: {new Date(bill.created_at).toLocaleDateString()}
            </div>
            <div className="mt-2">
              <PaymentBadge
                status={parseFloat(bill.total_amount) === 0 ? 'FREE_REVISIT' : bill.payment_status}
              />
            </div>
          </div>
        </div>

        {/* Billed To / Patient Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-100 text-xs">
          <div>
            <div className="font-bold text-slate-400 uppercase tracking-wider mb-2 text-[10px]">
              Patient Details (Billed To)
            </div>
            <div className="text-sm font-bold text-slate-900">
              {bill.first_name} {bill.last_name}
            </div>
            <div className="font-mono text-slate-500 mt-0.5">Patient ID: {bill.patient_code}</div>
            <div className="text-slate-600 mt-1">Phone: {bill.patient_phone}</div>
            {bill.patient_address && (
              <div className="text-slate-500 mt-0.5">Address: {bill.patient_address}</div>
            )}
          </div>

          <div className="sm:text-right">
            <div className="font-bold text-slate-400 uppercase tracking-wider mb-2 text-[10px]">
              Consultation Service Reference
            </div>
            <div className="text-sm font-bold text-slate-800">
              Attending: {bill.doctor_name || 'Clinic Physician'}
            </div>
            <div className="text-slate-500 mt-0.5">
              Specialization: {bill.doctor_specialization || 'Clinical OPD'}
            </div>
            {bill.appointment_date && (
              <div className="text-slate-500 mt-1">
                Appointment: {new Date(bill.appointment_date).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Itemized Fee Breakdown */}
        <div className="py-6">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Consultation Service Description</th>
                <th className="p-3 text-right">Doctor Fee (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-3 font-mono text-slate-400">1</td>
                <td className="p-3">
                  <div className="font-semibold text-slate-800">
                    {bill.notes || 'Doctor Outpatient Consultation Fee'}
                  </div>
                  {parseFloat(bill.total_amount) === 0 && (
                    <div className="text-[11px] text-teal-700 font-medium mt-0.5">
                      ✓ Follow-up / Revisit within validity window — Doctor consultation fee waived
                    </div>
                  )}
                </td>
                <td className="p-3 text-right font-mono font-bold text-slate-800">
                  {parseFloat(bill.subtotal) === 0 ? (
                    <span className="text-teal-700">₹0.00 (FREE)</span>
                  ) : (
                    `₹${Number(bill.subtotal).toFixed(2)}`
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Calculation Summary */}
        <div className="flex justify-end pt-2 pb-6 border-b border-slate-100">
          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono">₹{Number(bill.subtotal).toFixed(2)}</span>
            </div>
            {parseFloat(bill.discount) > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount Applied:</span>
                <span className="font-mono">-₹{Number(bill.discount).toFixed(2)}</span>
              </div>
            )}
            {parseFloat(bill.tax) > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>GST / Tax:</span>
                <span className="font-mono">+₹{Number(bill.tax).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
              <span>Total Net Payable:</span>
              <span className="font-mono text-teal-800">
                ₹{Number(bill.total_amount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment History & Receipts */}
        <div className="py-6">
          <div className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">
            Payment Receipts & Transactions
          </div>

          {bill.payments && bill.payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Date & Time</th>
                    <th className="p-2.5">Method</th>
                    <th className="p-2.5">Transaction Ref</th>
                    <th className="p-2.5">Received By</th>
                    <th className="p-2.5 text-right">Amount Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bill.payments.map((p) => (
                    <tr key={p.id}>
                      <td className="p-2.5 text-slate-600">
                        {new Date(p.payment_date).toLocaleString()}
                      </td>
                      <td className="p-2.5 font-semibold text-slate-800">{p.payment_method}</td>
                      <td className="p-2.5 font-mono text-slate-500">
                        {p.transaction_reference || 'COUNTER_CASH'}
                      </td>
                      <td className="p-2.5 text-slate-500">{p.received_by_name || 'Reception'}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                        ₹{Number(p.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-3">No payments recorded against this invoice.</p>
          )}

          {/* Balance summary */}
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500">Total Paid:</span>{' '}
              <strong className="text-emerald-700 font-mono">
                ₹{Number(bill.total_paid).toFixed(2)}
              </strong>
            </div>
            <div>
              <span className="text-slate-500">Outstanding Balance:</span>{' '}
              <strong
                className={`font-mono font-bold text-sm ${
                  bill.balance_due > 0 ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                ₹{Number(bill.balance_due).toFixed(2)}
              </strong>
            </div>
          </div>
        </div>

        {/* Invoice Footer */}
        <div className="pt-8 border-t border-slate-100 text-center text-[11px] text-slate-400 space-y-1">
          {clinic?.receipt_footer_note ? (
            <p className="text-slate-600 font-medium italic">"{clinic.receipt_footer_note}"</p>
          ) : (
            <p>Thank you for choosing {clinic?.clinic_name || 'AuraCare Clinic'} for your healthcare needs.</p>
          )}
          <p className="mt-0.5">Computer-generated official clinical tax invoice. Valid for accounting and insurance reimbursement.</p>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title="Record Payment"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Payment Amount (₹) *
            </label>
            <input
              type="number"
              required
              min="1"
              max={bill.balance_due}
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-teal-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Payment Method *
            </label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            >
              <option value="UPI">UPI / GPay / PhonePe</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Credit / Debit Card</option>
              <option value="ONLINE">Bank Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Reference / Transaction ID
            </label>
            <input
              type="text"
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              placeholder="e.g. UPI-TXN-1294827"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setPayModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md transition disabled:opacity-50"
            >
              {processing ? 'Processing...' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
