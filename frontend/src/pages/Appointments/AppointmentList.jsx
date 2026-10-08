import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/Badge';
import { Modal, LoadingSpinner } from '../../components/common/Modal';
import {
  Calendar,
  Clock,
  Plus,
  Filter,
  CheckCircle,
  Stethoscope,
  XCircle,
  UserCheck,
  Receipt,
  User,
  Activity,
  Heart,
} from 'lucide-react';

export function AppointmentList() {
  const [searchParams] = useSearchParams();
  const { user, isDoctor, isAdmin, isReceptionist } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterDate, setFilterDate] = useState('');
  const [filterDoctor, setFilterDoctor] = useState(isDoctor ? user?.doctor_id || '' : '');
  const [filterStatus, setFilterStatus] = useState('');

  // Booking Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Check-In & Triage Vitals Modal
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [checkInApp, setCheckInApp] = useState(null);
  const [triageVitals, setTriageVitals] = useState({
    blood_pressure: '',
    temperature: '',
    weight: '',
  });
  const [checkingIn, setCheckingIn] = useState(false);

  const [formData, setFormData] = useState({
    patient_id: searchParams.get('patient_id') || '',
    doctor_id: isDoctor ? user?.doctor_id || '' : '',
    appointment_date: new Date().toISOString().split('T')[0],
    start_time: '10:00',
    end_time: '10:30',
    reason: '',
    status: 'CONFIRMED',
  });

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterDate) params.append('date', filterDate);
      if (filterDoctor) params.append('doctor_id', filterDoctor);
      if (filterStatus) params.append('status', filterStatus);

      const res = await api.appointments.getAll(params.toString());
      setAppointments(res.appointments || []);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMeta = async () => {
    try {
      const [docsRes, patsRes] = await Promise.all([
        api.doctors.getAll('activeOnly=true'),
        api.patients.getAll('limit=100'),
      ]);
      setDoctors(docsRes.doctors || []);
      setPatients(patsRes.patients || []);

      if (docsRes.doctors?.length > 0 && !formData.doctor_id) {
        setFormData((prev) => ({ ...prev, doctor_id: docsRes.doctors[0].id }));
      }
      if (patsRes.patients?.length > 0 && !formData.patient_id) {
        setFormData((prev) => ({ ...prev, patient_id: patsRes.patients[0].id }));
      }
    } catch (err) {
      console.error('Failed to load meta:', err);
    }
  };

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [filterDate, filterDoctor, filterStatus]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.appointments.updateStatus(id, newStatus);
      loadAppointments();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleOpenCheckInModal = (app) => {
    setCheckInApp(app);
    setTriageVitals({
      blood_pressure: app.blood_pressure || '',
      temperature: app.temperature || '',
      weight: app.weight || '',
    });
    setCheckInModalOpen(true);
  };

  const handleConfirmCheckIn = async (e) => {
    e.preventDefault();
    if (!checkInApp) return;
    setCheckingIn(true);
    try {
      await api.appointments.updateStatus(checkInApp.id, {
        status: 'CHECKED_IN',
        blood_pressure: triageVitals.blood_pressure || null,
        temperature: triageVitals.temperature || null,
        weight: triageVitals.weight || null,
      });
      setCheckInModalOpen(false);
      loadAppointments();
    } catch (err) {
      alert(err.message || 'Failed to check in appointment');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setBookingError('');
    setSubmitting(true);
    try {
      await api.appointments.create(formData);
      setIsModalOpen(false);
      loadAppointments();
    } catch (err) {
      setBookingError(err.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isDoctor ? 'My Patient Appointments' : 'Appointments Schedule'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage consultations, patient triage arrivals, and clinical queue
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-teal-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Book Appointment
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
        <div>
          <label className="block font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Filter by Date
          </label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Doctor
          </label>
          <select
            value={filterDoctor}
            onChange={(e) => setFilterDoctor(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm"
          >
            <option value="">All Doctors</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.full_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm"
          >
            <option value="">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setFilterDate('');
              setFilterDoctor('');
              setFilterStatus('');
            }}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl transition cursor-pointer text-xs sm:text-sm"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Appointments List Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading appointment bookings..." />
        ) : appointments.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-slate-700">No appointments found</p>
            <p className="text-xs text-slate-400 mt-1">Try relaxing filters or book an appointment</p>
          </div>
        ) : (
          <>
            {/* MOBILE CARD VIEW (< md screens) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {appointments.map((a) => (
                <div key={a.id} className="p-4 space-y-3 hover:bg-slate-50/60 transition">
                  {/* Top line: Time badge + Status badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200/60">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      <span>{new Date(a.appointment_date).toLocaleDateString()} @ {a.start_time}</span>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>

                  {/* Patient Info */}
                  <div>
                    <Link
                      to={`/patients/${a.patient_id}`}
                      className="font-bold text-slate-900 text-base hover:text-teal-700 transition"
                    >
                      {a.patient_first_name} {a.patient_last_name}
                    </Link>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 font-mono">
                      <span>{a.patient_code}</span>
                      <span>•</span>
                      <span>{a.patient_phone}</span>
                    </div>
                  </div>

                  {/* Reason & Doctor */}
                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div><span className="font-semibold text-slate-700">Reason:</span> {a.reason || 'General Homeopathic OPD Consultation'}</div>
                    <div className="text-slate-500 mt-0.5"><span className="font-semibold text-slate-700">Doctor:</span> {a.doctor_name}</div>
                  </div>

                  {/* Recorded Vitals (if any) */}
                  {(a.blood_pressure || a.temperature || a.weight) && (
                    <div className="text-[11px] text-teal-800 bg-teal-50/70 px-2.5 py-1 rounded-lg border border-teal-200 font-mono flex flex-wrap gap-2">
                      {a.blood_pressure && <span>BP: {a.blood_pressure}</span>}
                      {a.temperature && <span>Temp: {a.temperature}</span>}
                      {a.weight && <span>Weight: {a.weight}</span>}
                    </div>
                  )}

                  {/* Mobile Touch-Friendly Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                    {a.status === 'SCHEDULED' && (
                      <button
                        onClick={() => handleUpdateStatus(a.id, 'CONFIRMED')}
                        className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition cursor-pointer text-center"
                      >
                        Confirm
                      </button>
                    )}

                    {(a.status === 'CONFIRMED' || a.status === 'SCHEDULED') && (
                      <button
                        onClick={() => handleOpenCheckInModal(a)}
                        className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Activity className="w-3.5 h-3.5" /> Check In
                      </button>
                    )}

                    {(a.status === 'CHECKED_IN' || a.status === 'IN_PROGRESS' || a.status === 'CONFIRMED') && (
                      <Link
                        to={`/consultation/${a.id}`}
                        className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition text-center"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Consult</span>
                      </Link>
                    )}

                    {a.status === 'COMPLETED' && (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 py-2 px-3">
                        <CheckCircle className="w-4 h-4" /> Completed
                      </span>
                    )}

                    {a.status !== 'COMPLETED' && a.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleUpdateStatus(a.id, 'CANCELLED')}
                        className="py-2 px-3 text-slate-400 hover:text-rose-600 text-xs rounded-xl transition cursor-pointer border border-slate-200"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP TABLE VIEW (hidden on mobile, visible on md+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200/70">
                  <tr>
                    <th className="py-3.5 px-4">Date & Slot</th>
                    <th className="py-3.5 px-4">Patient</th>
                    <th className="py-3.5 px-4">Doctor</th>
                    <th className="py-3.5 px-4">Chief Complaint / Reason</th>
                    <th className="py-3.5 px-4">Status & Triage Vitals</th>
                    <th className="py-3.5 px-4 text-right">Workflow Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">
                          {new Date(a.appointment_date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>
                            {a.start_time} - {a.end_time || '30m'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/patients/${a.patient_id}`}
                          className="font-bold text-teal-700 hover:text-teal-800 hover:underline"
                        >
                          {a.patient_first_name} {a.patient_last_name}
                        </Link>
                        <div className="text-xs text-slate-400 font-mono">
                          ID: {a.patient_code} • {a.patient_phone}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="font-semibold text-slate-800">{a.doctor_name}</div>
                        <div className="text-xs text-slate-400">{a.doctor_specialization}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs">
                        <div className="truncate">{a.reason || 'Routine OPD consultation'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div>
                          <StatusBadge status={a.status} />
                          {(a.blood_pressure || a.temperature || a.weight) && (
                            <div className="text-[10px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 mt-1 font-mono">
                              {a.blood_pressure && <span>BP: {a.blood_pressure} </span>}
                              {a.temperature && <span>• {a.temperature} </span>}
                              {a.weight && <span>• {a.weight}</span>}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* SCHEDULED -> CONFIRM */}
                          {a.status === 'SCHEDULED' && (
                            <button
                              onClick={() => handleUpdateStatus(a.id, 'CONFIRMED')}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                            >
                              Confirm
                            </button>
                          )}

                          {/* CONFIRMED / SCHEDULED -> CHECK IN WITH OPTIONAL VITALS */}
                          {(a.status === 'CONFIRMED' || a.status === 'SCHEDULED') && (
                            <button
                              onClick={() => handleOpenCheckInModal(a)}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer flex items-center gap-1"
                            >
                              <Activity className="w-3 h-3" /> Check In
                            </button>
                          )}

                          {/* CHECKED_IN / IN_PROGRESS -> DOCTOR CONSULTATION ROOM */}
                          {(a.status === 'CHECKED_IN' ||
                            a.status === 'IN_PROGRESS' ||
                            a.status === 'CONFIRMED') && (
                            <Link
                              to={`/consultation/${a.id}`}
                              className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1 transition"
                            >
                              <Stethoscope className="w-3 h-3" />
                              <span>Consult</span>
                            </Link>
                          )}

                          {/* COMPLETED STATUS */}
                          {a.status === 'COMPLETED' && (
                            <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Done
                            </span>
                          )}

                          {/* CANCEL */}
                          {a.status !== 'COMPLETED' && a.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleUpdateStatus(a.id, 'CANCELLED')}
                              className="px-2 py-1 text-slate-400 hover:text-rose-600 text-xs rounded-lg transition cursor-pointer"
                              title="Cancel appointment"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Patient Triage & Check-in Modal */}
      <Modal
        isOpen={checkInModalOpen}
        onClose={() => setCheckInModalOpen(false)}
        title={`Check-In Patient: ${checkInApp?.patient_first_name} ${checkInApp?.patient_last_name}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleConfirmCheckIn} className="space-y-4">
          <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 text-xs text-amber-900">
            Marking patient as <strong>CHECKED IN</strong> places them directly in the Doctor's active
            OPD queue. You can optionally record Physical Vitals now at front desk triage.
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Activity className="w-4 h-4 text-teal-600" />
              <span>Physical Vitals (Optional Triage Measurement)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Blood Pressure
                </label>
                <input
                  type="text"
                  value={triageVitals.blood_pressure}
                  onChange={(e) =>
                    setTriageVitals({ ...triageVitals, blood_pressure: e.target.value })
                  }
                  placeholder="e.g. 120/80"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Temperature
                </label>
                <input
                  type="text"
                  value={triageVitals.temperature}
                  onChange={(e) =>
                    setTriageVitals({ ...triageVitals, temperature: e.target.value })
                  }
                  placeholder="e.g. 98.6 F"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Weight</label>
                <input
                  type="text"
                  value={triageVitals.weight}
                  onChange={(e) => setTriageVitals({ ...triageVitals, weight: e.target.value })}
                  placeholder="e.g. 72 kg"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              * Vitals recorded here will automatically pre-fill on the Doctor's consultation desk. If
              left blank, the Doctor can record them during consultation.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCheckInModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={checkingIn}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {checkingIn ? 'Checking In...' : 'Confirm Patient Check-In'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Book Appointment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Book Doctor Appointment"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleBookAppointment} className="space-y-4">
          {bookingError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {bookingError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Patient *
            </label>
            <select
              required
              value={formData.patient_id}
              onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">-- Choose Patient --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.patient_code} - {p.first_name} {p.last_name} ({p.phone})
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
              value={formData.doctor_id}
              onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">-- Choose Doctor --</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name} ({d.specialization}) - Fee: ₹{d.consultation_fee} [
                  {d.available_from}-{d.available_to}]
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Appointment Date *
              </label>
              <input
                type="date"
                required
                value={formData.appointment_date}
                onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Start Time *
              </label>
              <input
                type="text"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                placeholder="10:00"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                End Time
              </label>
              <input
                type="text"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                placeholder="10:30"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Reason for Visit / Symptoms
            </label>
            <textarea
              rows={2}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g. Mild chest pain, seasonal cough and fever..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
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
              {submitting ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
