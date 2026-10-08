import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { PaymentBadge } from '../../components/common/Badge';
import { Modal, LoadingSpinner } from '../../components/common/Modal';
import {
  Receipt,
  Plus,
  Search,
  IndianRupee,
  CreditCard,
  CheckCircle,
  Clock,
  Printer,
  ArrowRight,
  Stethoscope,
  RefreshCw,
  AlertCircle,
  User,
} from 'lucide-react';

export function BillingList() {
  const [searchParams] = useSearchParams();
  const { user, isAdmin, isReceptionist } = useAuth();

  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  // Create Bill Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [billError, setBillError] = useState('');

  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [feeAnalysis, setFeeAnalysis] = useState(null);
  const [calculatingFee, setCalculatingFee] = useState(false);

  const [formData, setFormData] = useState({
    patient_id: searchParams.get('patient_id') || '',
    appointment_id: '',
    subtotal: 0,
    discount: 0,
    tax: 0,
    notes: 'Doctor Consultation Fee',
    initial_payment_amount: 0,
    payment_method: 'CASH',
    transaction_reference: '',
  });

  // Add Payment Modal for existing bill
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('UPI');
  const [payRef, setPayRef] = useState('');
  const [recordingPay, setRecordingPay] = useState(false);

  const loadBills = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append('payment_status', filterStatus);
      if (search) params.append('search', search);

      const res = await api.billing.getAll(params.toString());
      setBills(res.bills || []);
    } catch (err) {
      console.error('Failed to load bills:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMeta = async () => {
    try {
      const [patsRes, docsRes, appsRes] = await Promise.all([
        api.patients.getAll('limit=100'),
        api.doctors.getAll('activeOnly=true'),
        api.appointments.getAll(),
      ]);
      setPatients(patsRes.patients || []);
      setDoctors(docsRes.doctors || []);
      setAppointments(appsRes.appointments || []);

      const initialPatId = searchParams.get('patient_id') || (patsRes.patients?.[0]?.id || '');
      const initialDocId = docsRes.doctors?.[0]?.id || '';

      setFormData((prev) => ({
        ...prev,
        patient_id: initialPatId,
      }));
      setSelectedDoctorId(initialDocId);

      if (initialPatId && initialDocId) {
        checkFee(initialPatId, initialDocId);
      }
    } catch (err) {
      console.error('Failed to load metadata for billing:', err);
    }
  };

  const checkFee = async (patientId, doctorId, appointmentId = '') => {
    if (!patientId || !doctorId) return;
    try {
      setCalculatingFee(true);
      const queryStr = `patient_id=${patientId}&doctor_id=${doctorId}${
        appointmentId ? `&appointment_id=${appointmentId}` : ''
      }`;
      const res = await api.billing.calculateFee(queryStr);
      setFeeAnalysis(res);

      setFormData((prev) => ({
        ...prev,
        patient_id: patientId,
        appointment_id: appointmentId || '',
        subtotal: res.recommended_fee,
        discount: 0,
        tax: 0,
        initial_payment_amount: res.recommended_fee,
        notes: res.notes,
      }));
    } catch (err) {
      console.error('Failed to calculate fee:', err);
    } finally {
      setCalculatingFee(false);
    }
  };

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    loadBills();
  }, [filterStatus, search]);

  const subtotal = parseFloat(formData.subtotal) || 0;
  const discount = parseFloat(formData.discount) || 0;
  const tax = parseFloat(formData.tax) || 0;
  const computedTotal = Math.max(0, subtotal - discount + tax);

  const handlePatientChange = (patientId) => {
    setFormData((prev) => ({ ...prev, patient_id: patientId }));
    checkFee(patientId, selectedDoctorId, selectedAppointmentId);
  };

  const handleDoctorChange = (doctorId) => {
    setSelectedDoctorId(doctorId);
    checkFee(formData.patient_id, doctorId, selectedAppointmentId);
  };

  const handleAppointmentChange = (appId) => {
    setSelectedAppointmentId(appId);
    if (!appId) {
      checkFee(formData.patient_id, selectedDoctorId, '');
      return;
    }
    const app = appointments.find((a) => String(a.id) === String(appId));
    if (app) {
      setFormData((prev) => ({ ...prev, patient_id: app.patient_id, appointment_id: app.id }));
      setSelectedDoctorId(app.doctor_id);
      checkFee(app.patient_id, app.doctor_id, app.id);
    }
  };

  const handleCreateBill = async (e) => {
    e.preventDefault();
    setBillError('');
    setSubmitting(true);
    try {
      await api.billing.create({
        ...formData,
        subtotal,
        discount,
        tax,
        initial_payment_amount: subtotal === 0 ? 0 : formData.initial_payment_amount,
      });
      setIsModalOpen(false);
      loadBills();
    } catch (err) {
      setBillError(err.message || 'Failed to generate bill');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPayment = (bill) => {
    setSelectedBill(bill);
    setPayAmount(bill.balance_due || bill.total_amount);
    setPayMethod('UPI');
    setPayRef('');
    setPayModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedBill) return;
    setRecordingPay(true);
    try {
      await api.billing.addPayment(selectedBill.id, {
        amount: parseFloat(payAmount),
        payment_method: payMethod,
        transaction_reference: payRef,
      });
      setPayModalOpen(false);
      loadBills();
    } catch (err) {
      alert(err.message || 'Failed to record payment');
    } finally {
      setRecordingPay(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Billing & OPD Invoices</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-calculates doctor fees. Fresh consultations charge doctor fees; follow-up revisits
            are free.
          </p>
        </div>

        {(isAdmin || isReceptionist) && (
          <button
            onClick={() => {
              if (formData.patient_id && selectedDoctorId) {
                checkFee(formData.patient_id, selectedDoctorId);
              }
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-teal-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create New Bill
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number, patient name, or code..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          >
            <option value="">All Payment Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PARTIAL">Partially Paid</option>
            <option value="UNPAID">Unpaid</option>
          </select>
        </div>
      </div>

      {/* Bills Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading financial records..." />
        ) : bills.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-slate-700">No invoices found</p>
          </div>
        ) : (
          <>
            {/* MOBILE INVOICE CARDS (< md screens) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {bills.map((b) => {
                const isZeroRevisit = parseFloat(b.total_amount) === 0;
                return (
                  <div key={b.id} className="p-4 space-y-3 hover:bg-slate-50/60 transition">
                    {/* Top row: Invoice # & Payment status */}
                    <div className="flex items-center justify-between">
                      <Link
                        to={`/billing/${b.id}`}
                        className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 hover:underline"
                      >
                        {b.bill_number}
                      </Link>
                      <div>
                        {isZeroRevisit ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800 border border-teal-200">
                            FREE REVISIT
                          </span>
                        ) : (
                          <PaymentBadge status={b.payment_status} />
                        )}
                      </div>
                    </div>

                    {/* Patient & Date */}
                    <div className="flex items-start justify-between">
                      <div>
                        <Link
                          to={`/patients/${b.patient_id}`}
                          className="font-bold text-slate-900 text-base hover:text-teal-700 transition"
                        >
                          {b.first_name} {b.last_name}
                        </Link>
                        <div className="text-xs text-slate-400 font-mono">
                          ID: {b.patient_code}
                        </div>
                      </div>
                      <div className="text-right text-xs text-slate-400">
                        {new Date(b.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Doctor & Service */}
                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-700">{b.doctor_name || 'Homeopath'}:</span>{' '}
                        <span className="text-slate-500">{b.notes || 'Consultation'}</span>
                      </div>
                    </div>

                    {/* Financial Summary Strip */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 text-center">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Total Fee</div>
                        <div className="text-xs sm:text-sm font-extrabold text-slate-900">
                          {isZeroRevisit ? '₹0.00' : `₹${b.total_amount}`}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Paid</div>
                        <div className="text-xs sm:text-sm font-extrabold text-emerald-700">
                          ₹{b.total_paid || 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Balance</div>
                        <div className="text-xs sm:text-sm font-extrabold text-slate-900">
                          {parseFloat(b.balance_due) > 0 ? (
                            <span className="text-rose-600">₹{b.balance_due}</span>
                          ) : (
                            <span className="text-emerald-600">₹0.00</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                      {b.payment_status !== 'PAID' && !isZeroRevisit && (
                        <button
                          onClick={() => handleOpenPayment(b)}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer text-center"
                        >
                          + Record Payment
                        </button>
                      )}
                      <Link
                        to={`/billing/${b.id}`}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition text-center"
                      >
                        Receipt ↗
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP TABLE VIEW (hidden on mobile, visible on md+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200/70">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Bill #</th>
                    <th className="py-3.5 px-4 font-semibold">Patient</th>
                    <th className="py-3.5 px-4 font-semibold">Doctor & Service</th>
                    <th className="py-3.5 px-4 font-semibold">Consultation Fee</th>
                    <th className="py-3.5 px-4 font-semibold">Paid</th>
                    <th className="py-3.5 px-4 font-semibold">Balance Due</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bills.map((b) => {
                    const isZeroRevisit = parseFloat(b.total_amount) === 0;
                    return (
                      <tr key={b.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4">
                          <Link
                            to={`/billing/${b.id}`}
                            className="font-mono font-bold text-teal-700 hover:underline"
                          >
                            {b.bill_number}
                          </Link>
                          <div className="text-[11px] text-slate-400">
                            {new Date(b.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <Link
                            to={`/patients/${b.patient_id}`}
                            className="font-bold text-slate-800 hover:text-teal-600"
                          >
                            {b.first_name} {b.last_name}
                          </Link>
                          <div className="text-xs text-slate-400 font-mono">{b.patient_code}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-semibold text-slate-800">
                            {b.doctor_name || 'Attending Physician'}
                          </div>
                          <div className="text-slate-400 line-clamp-1">{b.notes}</div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {isZeroRevisit ? (
                            <span className="text-teal-700 font-bold">₹0.00 (Free Revisit)</span>
                          ) : (
                            <span>₹{b.total_amount}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-emerald-700 font-semibold">
                          ₹{b.total_paid || 0}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {parseFloat(b.balance_due) > 0 ? (
                            <span className="text-rose-600">₹{b.balance_due}</span>
                          ) : (
                            <span className="text-emerald-600">₹0.00</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {isZeroRevisit ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800 border border-teal-200">
                              FREE REVISIT
                            </span>
                          ) : (
                            <PaymentBadge status={b.payment_status} />
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {b.payment_status !== 'PAID' && !isZeroRevisit && (
                              <button
                                onClick={() => handleOpenPayment(b)}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-lg transition cursor-pointer"
                              >
                                + Record Payment
                              </button>
                            )}
                            <Link
                              to={`/billing/${b.id}`}
                              className="px-2.5 py-1 text-teal-600 hover:bg-teal-50 font-semibold text-xs rounded-lg transition"
                            >
                              Invoice & Receipt
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Create Bill Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate Clinical Consultation Invoice"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateBill} className="space-y-4">
          {billError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {billError}
            </div>
          )}

          {/* Link to appointment (optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Link to Recent Appointment (Optional)
            </label>
            <select
              value={selectedAppointmentId}
              onChange={(e) => handleAppointmentChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
            >
              <option value="">-- Direct Patient Consultation (No appointment link) --</option>
              {appointments.slice(0, 20).map((a) => (
                <option key={a.id} value={a.id}>
                  #{a.id} - {a.patient_first_name} {a.patient_last_name} with {a.doctor_name} (
                  {new Date(a.appointment_date).toLocaleDateString()} @ {a.start_time}) [{a.status}]
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Select Patient *
              </label>
              <select
                required
                value={formData.patient_id}
                onChange={(e) => handlePatientChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">-- Choose Patient --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.patient_code} - {p.first_name} {p.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Attending Doctor *
              </label>
              <select
                required
                value={selectedDoctorId}
                onChange={(e) => handleDoctorChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">-- Choose Doctor --</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name} ({d.specialization}) - Standard Fee: ₹{d.consultation_fee}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Automatic Revisit vs Fresh Consultation Status Callout */}
          {calculatingFee ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
              Checking patient visit history & consultation fee policy...
            </div>
          ) : feeAnalysis ? (
            feeAnalysis.is_revisit ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Revisit Detected — Free Follow-up Consultation</span>
                </div>
                <p className="text-xs text-emerald-700">{feeAnalysis.revisit_reason}</p>
                <div className="text-xs text-emerald-900 font-bold pt-1">
                  Doctor Fee is automatically set to <strong>₹0.00</strong> (No fee added for
                  revisit).
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
                  <Stethoscope className="w-4 h-4 text-blue-600" />
                  <span>Fresh Consultation (First Visit with Specialist)</span>
                </div>
                <p className="text-xs text-blue-700">
                  Only the Doctor's Consultation Fee is added:
                  <strong className="text-blue-900 font-bold ml-1">
                    ₹{feeAnalysis.standard_doctor_fee}
                  </strong>{' '}
                  ({feeAnalysis.doctor_name}, {feeAnalysis.specialization}).
                </p>
              </div>
            )
          ) : null}

          {/* Line item: Strictly Doctor Fees */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Doctor Consultation Fee
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Service Description
                </label>
                <input
                  type="text"
                  required
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Doctor Fee (₹)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="50"
                  value={formData.subtotal}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      subtotal: e.target.value,
                      initial_payment_amount: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Total Invoice Amount:</span>
              <span className="text-base font-extrabold text-teal-800">
                ₹{computedTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Immediate Payment Option (Only applicable if fee > 0) */}
          {computedTotal > 0 ? (
            <div className="pt-2 space-y-3">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Immediate Counter Payment
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Amount Received (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={computedTotal}
                    value={formData.initial_payment_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, initial_payment_amount: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) =>
                      setFormData({ ...formData, payment_method: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="CARD">Debit / Credit Card</option>
                    <option value="ONLINE">Bank Transfer</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-teal-50 text-teal-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-teal-600" />
              <span>
                Total is <strong>₹0.00</strong>. This invoice will be marked as fully completed
                without requiring counter payment.
              </span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Generating...' : 'Confirm & Generate Invoice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Payment Modal */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title={`Record Payment for ${selectedBill?.bill_number}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>Patient:</span>
              <strong className="text-slate-800">
                {selectedBill?.first_name} {selectedBill?.last_name}
              </strong>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Current Outstanding:</span>
              <strong className="text-rose-600 font-bold">₹{selectedBill?.balance_due}</strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Payment Amount (₹) *
            </label>
            <input
              type="number"
              required
              min="1"
              max={selectedBill?.balance_due}
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
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recordingPay}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {recordingPay ? 'Processing...' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
