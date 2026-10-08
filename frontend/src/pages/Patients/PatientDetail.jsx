import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, PaymentBadge } from '../../components/common/Badge';
import { Modal, LoadingSpinner } from '../../components/common/Modal';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Droplet,
  Calendar,
  FileText,
  Receipt,
  UploadCloud,
  Stethoscope,
  Pill,
  Heart,
  Clock,
  Plus,
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  Printer,
} from 'lucide-react';

export function PatientDetail() {
  const { id } = useParams();
  const { user, isDoctor, isAdmin, isReceptionist } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [docType, setDocType] = useState('Blood Test Report');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const loadPatientData = async () => {
    try {
      setLoading(true);
      const res = await api.patients.getById(id);
      setData(res);
    } catch (err) {
      console.error('Failed to load patient:', err);
      setError(err.message || 'Failed to load patient profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatientData();
  }, [id]);

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('patient_id', id);
      formData.append('document_type', docType);
      formData.append('file', uploadFile);

      await api.documents.upload(formData);
      setUploadModalOpen(false);
      setUploadFile(null);
      loadPatientData();
    } catch (err) {
      setUploadError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading patient medical records..." />;

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-rose-600 font-semibold mb-3">Error: {error || 'Patient not found'}</p>
        <Link
          to="/patients"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Patients
        </Link>
      </div>
    );
  }

  const { patient, appointments = [], visits = [], prescriptions = [], bills = [], documents = [] } = data;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/patients"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Patient Directory
        </Link>
      </div>

      {/* Patient Central Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-teal-600/20 shrink-0">
              {patient.first_name[0]}
              {patient.last_name[0]}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold text-slate-900">
                  {patient.first_name} {patient.last_name}
                </h1>
                <span className="font-mono text-xs px-2.5 py-1 bg-teal-50 text-teal-800 font-bold rounded-lg border border-teal-200">
                  Patient ID: {patient.patient_code}
                </span>
                {patient.blood_group && (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
                    <Droplet className="w-3 h-3 text-rose-500" /> {patient.blood_group}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 mt-2">
                <span>
                  <strong>Gender:</strong> {patient.gender || 'N/A'}
                </span>
                <span>•</span>
                <span>
                  <strong>DOB:</strong>{' '}
                  {patient.date_of_birth
                    ? new Date(patient.date_of_birth).toLocaleDateString()
                    : 'N/A'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> {patient.phone}
                </span>
                {patient.email && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" /> {patient.email}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Link
              to={`/appointments?patient_id=${patient.id}`}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold text-xs rounded-xl transition border border-teal-200 flex-1 sm:flex-initial"
            >
              <Calendar className="w-3.5 h-3.5" /> Book Appointment
            </Link>

            <Link
              to={`/billing?patient_id=${patient.id}`}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition border border-slate-200 flex-1 sm:flex-initial"
            >
              <Receipt className="w-3.5 h-3.5" /> New Invoice
            </Link>

            <button
              onClick={() => setUploadModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition border border-slate-200 shadow-2xs cursor-pointer w-full sm:w-auto"
            >
              <UploadCloud className="w-3.5 h-3.5 text-teal-600" /> Upload Document
            </button>
          </div>
        </div>

        {/* Quick Contact & Emergency Strip */}
        <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-slate-600">
          <div>
            <span className="text-slate-400 font-medium">Residential Address:</span>{' '}
            <span className="text-slate-700 font-medium">{patient.address || 'Not provided'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Emergency Contact:</span>{' '}
            <span className="text-slate-700 font-medium">
              {patient.emergency_contact_name || 'N/A'}{' '}
              {patient.emergency_contact_phone && `(${patient.emergency_contact_phone})`}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Registered Since:</span>{' '}
            <span className="text-slate-700 font-medium">
              {new Date(patient.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation - Smooth horizontal swipe on mobile */}
      <div className="flex border-b border-slate-200 gap-1 sm:gap-2 overflow-x-auto no-scrollbar pb-px">
        {[
          { key: 'overview', label: 'Overview', icon: Heart, count: null },
          { key: 'appointments', label: 'Appointments', icon: Calendar, count: appointments.length },
          { key: 'visits', label: 'Visits', icon: Stethoscope, count: visits.length },
          { key: 'prescriptions', label: 'Prescriptions', icon: Pill, count: prescriptions.length },
          { key: 'documents', label: 'Documents', icon: FileText, count: documents.length },
          { key: 'bills', label: 'Invoices', icon: Receipt, count: bills.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-bold rounded-t-xl transition border-b-2 cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? 'border-teal-600 text-teal-700 bg-teal-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-teal-200/80 text-teal-900' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Visits Column */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>Recent Clinical Consultations</span>
              <button
                onClick={() => setActiveTab('visits')}
                className="text-xs text-teal-600 hover:text-teal-700 capitalize font-medium cursor-pointer"
              >
                View all ({visits.length})
              </button>
            </h3>

            {visits.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No past consultations recorded for this patient.
              </p>
            ) : (
              <div className="space-y-3">
                {visits.slice(0, 3).map((v) => (
                  <div
                    key={v.id}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-teal-800">
                        {v.doctor_name} ({v.doctor_specialization})
                      </span>
                      <span className="text-slate-400">
                        {new Date(v.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-800 font-semibold">
                      Diagnosis:{' '}
                      <span className="font-normal text-slate-700">{v.diagnosis}</span>
                    </div>

                    <div className="text-xs text-slate-600">
                      Chief Complaint: {v.chief_complaint}
                    </div>

                    {(v.blood_pressure || v.temperature || v.weight) && (
                      <div className="flex gap-4 pt-1 text-[11px] text-slate-500 font-mono">
                        {v.blood_pressure && <span>BP: {v.blood_pressure}</span>}
                        {v.temperature && <span>Temp: {v.temperature}</span>}
                        {v.weight && <span>Weight: {v.weight}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Metrics & Pending Bills */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
                Active Medical Summary
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Total Appointments</span>
                  <span className="font-bold text-slate-800">{appointments.length}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Completed Visits</span>
                  <span className="font-bold text-slate-800">{visits.length}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Prescriptions Issued</span>
                  <span className="font-bold text-slate-800">{prescriptions.length}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Uploaded Documents</span>
                  <span className="font-bold text-slate-800">{documents.length}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Billing Status</span>
                <button
                  onClick={() => setActiveTab('bills')}
                  className="text-xs text-teal-600 hover:text-teal-700 capitalize font-medium cursor-pointer"
                >
                  View Invoices
                </button>
              </h3>
              {bills.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No bills generated</p>
              ) : (
                <div className="space-y-2">
                  {bills.slice(0, 3).map((b) => (
                    <div
                      key={b.id}
                      className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-mono font-bold text-slate-700">{b.bill_number}</div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(b.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">₹{b.total_amount}</div>
                        <PaymentBadge status={b.payment_status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Appointment Records</h3>
            <Link
              to={`/appointments?patient_id=${patient.id}`}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Book New Appointment
            </Link>
          </div>

          {appointments.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No appointments found for this patient.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {appointments.map((a) => (
                <div
                  key={a.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex flex-col items-center justify-center shrink-0 border border-teal-100">
                      <Clock className="w-4 h-4" />
                      <span className="text-[9px] font-bold">{a.start_time}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">
                          {new Date(a.appointment_date).toLocaleDateString()}
                        </span>
                        <StatusBadge status={a.status} />
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        <span className="font-medium text-slate-700">Doctor:</span> {a.doctor_name} (
                        {a.specialization})
                      </div>
                      <div className="text-xs text-slate-500 italic mt-0.5">
                        Reason: {a.reason || 'General Consultation'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {(isDoctor || isAdmin) &&
                      (a.status === 'CHECKED_IN' || a.status === 'IN_PROGRESS' || a.status === 'CONFIRMED') && (
                        <Link
                          to={`/consultation/${a.id}`}
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1"
                        >
                          <Stethoscope className="w-3.5 h-3.5" /> Consult
                        </Link>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: VISIT HISTORY */}
      {activeTab === 'visits' && (
        <div className="space-y-4">
          {visits.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              No clinical visits recorded yet.
            </div>
          ) : (
            visits.map((v) => (
              <div
                key={v.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-teal-500" />
                    <span className="text-sm font-extrabold text-slate-800">
                      Consultation Date: {new Date(v.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-teal-700">
                    Attending: {v.doctor_name} ({v.specialization})
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                      Chief Complaint
                    </div>
                    <div className="text-slate-800 font-medium">{v.chief_complaint}</div>
                  </div>

                  <div className="bg-teal-50/50 border border-teal-100 p-3 rounded-xl">
                    <div className="font-bold text-teal-700 uppercase tracking-wider text-[10px] mb-1">
                      Clinical Diagnosis
                    </div>
                    <div className="text-teal-950 font-bold">{v.diagnosis}</div>
                  </div>
                </div>

                {v.associated_complaints && (
                  <div className="bg-slate-50 p-3 rounded-xl text-xs">
                    <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                      Associated Complaints
                    </div>
                    <div className="text-slate-800 font-medium">{v.associated_complaints}</div>
                  </div>
                )}

                {(v.mental_symptoms || v.totality_of_symptoms) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {v.mental_symptoms && (
                      <div className="bg-purple-50/60 border border-purple-200/60 p-3 rounded-xl">
                        <div className="font-bold text-purple-900 uppercase tracking-wider text-[10px] mb-1">
                          Mental Symptoms & Mind Rubrics
                        </div>
                        <div className="text-purple-950 font-medium whitespace-pre-line">{v.mental_symptoms}</div>
                      </div>
                    )}
                    {v.totality_of_symptoms && (
                      <div className="bg-teal-50/60 border border-teal-200/60 p-3 rounded-xl">
                        <div className="font-bold text-teal-900 uppercase tracking-wider text-[10px] mb-1">
                          Totality of Symptoms
                        </div>
                        <div className="text-teal-950 font-medium whitespace-pre-line">{v.totality_of_symptoms}</div>
                      </div>
                    )}
                  </div>
                )}

                {(v.past_history || v.family_history) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {v.past_history && (
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                          Past History
                        </div>
                        <div className="text-slate-700">{v.past_history}</div>
                      </div>
                    )}
                    {v.family_history && (
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                          Family History
                        </div>
                        <div className="text-slate-700">{v.family_history}</div>
                      </div>
                    )}
                  </div>
                )}

                {(v.appetite || v.thirst || v.thermal_state || v.desire || v.aversion) && (
                  <div className="p-3 bg-amber-50/40 border border-amber-200/60 rounded-xl text-xs space-y-1 text-slate-700">
                    <div className="font-bold text-amber-900 uppercase tracking-wider text-[10px] mb-1">
                      Personal History (Physical Generals)
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      {v.thermal_state && <span className="bg-white px-2 py-0.5 rounded border border-amber-200">Thermal: <strong>{v.thermal_state}</strong></span>}
                      {v.appetite && <span className="bg-white px-2 py-0.5 rounded border border-amber-200">Appetite: <strong>{v.appetite}</strong></span>}
                      {v.thirst && <span className="bg-white px-2 py-0.5 rounded border border-amber-200">Thirst: <strong>{v.thirst}</strong></span>}
                      {v.desire && <span className="bg-white px-2 py-0.5 rounded border border-amber-200">Desire: <strong>{v.desire}</strong></span>}
                      {v.aversion && <span className="bg-white px-2 py-0.5 rounded border border-amber-200">Aversion: <strong>{v.aversion}</strong></span>}
                      {v.disagree && <span className="bg-white px-2 py-0.5 rounded border border-amber-200">Disagree: <strong>{v.disagree}</strong></span>}
                    </div>
                  </div>
                )}

                {v.treatment_dose && (
                  <div className="bg-teal-50/40 border border-teal-200/60 p-3 rounded-xl text-xs">
                    <div className="font-bold text-teal-800 uppercase tracking-wider text-[10px] mb-1">
                      Homeopathic Treatment & Posology
                    </div>
                    <div className="text-teal-950 whitespace-pre-line">{v.treatment_dose}</div>
                  </div>
                )}

                {v.doctor_notes && (
                  <div className="text-xs bg-slate-50 p-3 rounded-xl">
                    <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                      Doctor Clinical Notes & Observations
                    </div>
                    <p className="text-slate-700 whitespace-pre-line">{v.doctor_notes}</p>
                  </div>
                )}

                {/* Vitals Strip */}
                {(v.blood_pressure || v.temperature || v.weight || v.follow_up_date) && (
                  <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100 text-xs font-mono text-slate-600">
                    {v.blood_pressure && (
                      <span className="bg-slate-100 px-2.5 py-1 rounded-md">
                        BP: <strong>{v.blood_pressure}</strong>
                      </span>
                    )}
                    {v.temperature && (
                      <span className="bg-slate-100 px-2.5 py-1 rounded-md">
                        Temp: <strong>{v.temperature}</strong>
                      </span>
                    )}
                    {v.weight && (
                      <span className="bg-slate-100 px-2.5 py-1 rounded-md">
                        Weight: <strong>{v.weight}</strong>
                      </span>
                    )}
                    {v.follow_up_date && (
                      <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-md">
                        Follow-Up: <strong>{new Date(v.follow_up_date).toLocaleDateString()}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: PRESCRIPTIONS */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-6">
          {prescriptions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              No prescriptions issued for this patient yet.
            </div>
          ) : (
            prescriptions.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
              >
                <div className="p-4 bg-teal-50/50 border-b border-teal-100/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-bold text-teal-900">
                      Prescription Date: {new Date(p.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-slate-500 hidden sm:inline">•</span>
                    <span className="text-xs font-medium text-slate-600">
                      Prescribed by: <strong className="text-slate-800">{p.doctor_name}</strong>
                    </span>
                  </div>

                  <Link
                    to={`/prescriptions/${p.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition shrink-0"
                  >
                    <Printer className="w-3.5 h-3.5" /> View & Print Rx Receipt
                  </Link>
                </div>

                {p.notes && (
                  <div className="px-6 py-3 bg-amber-50/50 border-b border-amber-100 text-xs text-amber-900 italic">
                    Physician's Instructions: {p.notes}
                  </div>
                )}

                <div className="p-4 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px]">
                      <tr>
                        <th className="p-3">Medicine Name</th>
                        <th className="p-3">Dosage</th>
                        <th className="p-3">Frequency</th>
                        <th className="p-3">Duration</th>
                        <th className="p-3">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {p.items && p.items.length > 0 ? (
                        p.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-3 font-bold text-slate-800">{item.medicine_name}</td>
                            <td className="p-3 text-slate-600">{item.dosage}</td>
                            <td className="p-3 text-slate-700 font-mono bg-slate-50/80 rounded">
                              {item.frequency}
                            </td>
                            <td className="p-3 text-slate-600">{item.duration}</td>
                            <td className="p-3 text-slate-500 italic">
                              {item.instructions || '—'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-3 text-center text-slate-400">
                            No items recorded
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 5: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Electronic Medical Documents</h3>
              <p className="text-xs text-slate-400">Lab reports, diagnostic scans, and clinical PDFs</p>
            </div>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" /> Upload Document
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              No medical documents uploaded yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between hover:shadow-xs transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{doc.document_type}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">
                        {doc.original_filename}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Uploaded by: {doc.uploaded_by_name || 'Staff'} on{' '}
                        {new Date(doc.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition"
                    title="View file"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: BILLS & INVOICES */}
      {activeTab === 'bills' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Billing History & Invoices</h3>
            {(isAdmin || isReceptionist) && (
              <Link
                to={`/billing?patient_id=${patient.id}`}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Generate New Bill
              </Link>
            )}
          </div>

          {bills.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No bills found for this patient.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="p-3.5">Invoice #</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Subtotal</th>
                    <th className="p-3.5">Discount</th>
                    <th className="p-3.5">Tax</th>
                    <th className="p-3.5">Total Amount</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bills.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50">
                      <td className="p-3.5 font-mono font-bold text-teal-700">{b.bill_number}</td>
                      <td className="p-3.5 text-slate-500">
                        {new Date(b.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 text-slate-700">₹{b.subtotal}</td>
                      <td className="p-3.5 text-slate-500">₹{b.discount}</td>
                      <td className="p-3.5 text-slate-500">₹{b.tax}</td>
                      <td className="p-3.5 font-bold text-slate-900">₹{b.total_amount}</td>
                      <td className="p-3.5">
                        <PaymentBadge status={b.payment_status} />
                      </td>
                      <td className="p-3.5 text-right">
                        <Link
                          to={`/billing/${b.id}`}
                          className="px-2.5 py-1 text-teal-600 hover:bg-teal-50 font-semibold rounded-md transition"
                        >
                          View Invoice
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Upload Document Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Medical Document / Lab Report"
      >
        <form onSubmit={handleUploadDocument} className="space-y-4">
          {uploadError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {uploadError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Document Category / Type
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="Blood Test Report">Blood Test Report / CBC</option>
              <option value="ECG / Echo Report">ECG / Echo Report</option>
              <option value="X-Ray / MRI Scan">X-Ray / MRI / CT Scan</option>
              <option value="Pathology Report">Pathology / Biopsy Report</option>
              <option value="Discharge Summary">Discharge Summary / Transfer</option>
              <option value="Other Medical Record">Other Medical Record</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select File (PDF, Image, Scan)
            </label>
            <input
              type="file"
              required
              onChange={(e) => setUploadFile(e.target.files[0])}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setUploadModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {uploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
