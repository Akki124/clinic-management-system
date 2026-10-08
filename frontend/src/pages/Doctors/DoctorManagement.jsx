import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Modal, LoadingSpinner } from '../../components/common/Modal';
import {
  Stethoscope,
  Plus,
  Mail,
  Phone,
  Clock,
  IndianRupee,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Award,
} from 'lucide-react';

export function DoctorManagement() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    specialization: '',
    qualification: '',
    registration_number: '',
    consultation_fee: 500,
    available_from: '09:00',
    available_to: '17:00',
  });

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const res = await api.doctors.getAll();
      setDoctors(res.doctors || []);
    } catch (err) {
      console.error('Failed to load doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.doctors.create(formData);
      setIsModalOpen(false);
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        specialization: '',
        qualification: '',
        registration_number: '',
        consultation_fee: 500,
        available_from: '09:00',
        available_to: '17:00',
      });
      loadDoctors();
    } catch (err) {
      setFormError(err.message || 'Failed to create doctor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (doctor) => {
    try {
      await api.doctors.update(doctor.id, { is_active: !doctor.is_active });
      loadDoctors();
    } catch (err) {
      alert(err.message || 'Failed to update doctor status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200 mb-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Admin Only Access
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Doctor Directory & Credentials</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create and maintain practicing doctor accounts, consultation fees, and OPD schedules
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-teal-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add New Doctor
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading doctors..." />
        ) : doctors.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Stethoscope className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-slate-700">No doctors added yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200/70">
                <tr>
                  <th className="py-3.5 px-4">Doctor</th>
                  <th className="py-3.5 px-4">Specialization</th>
                  <th className="py-3.5 px-4">Qualification / Reg #</th>
                  <th className="py-3.5 px-4">Consultation Fee</th>
                  <th className="py-3.5 px-4">OPD Hours</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{doc.full_name}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {doc.email}
                        </span>
                        {doc.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {doc.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 text-xs">
                        {doc.specialization}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div>{doc.qualification}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Reg: {doc.registration_number || 'N/A'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      ₹{doc.consultation_fee}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 font-mono">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {doc.available_from} - {doc.available_to}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {doc.is_active ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(doc)}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                          doc.is_active
                            ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                            : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {doc.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Doctor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Doctor User Account & Profile (Admin Only)"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateDoctor} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {formError}
            </div>
          )}

          <div className="bg-teal-50/50 p-3 rounded-xl border border-teal-100 text-xs text-teal-800">
            This will create a new user account with role <strong>DOCTOR</strong> and configure their
            clinical practice settings.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Doctor Full Name *
              </label>
              <input
                type="text"
                required
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="e.g. Dr. Rajesh Sharma"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Login Email *
              </label>
              <input
                type="email"
                required
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="e.g. dr.sharma@clinic.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Account Password *
              </label>
              <input
                type="password"
                required
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Minimum 6 characters"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+91 98000 00011"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Medical Specialization *
              </label>
              <input
                type="text"
                required
                name="specialization"
                value={formData.specialization}
                onChange={handleInputChange}
                placeholder="e.g. Cardiology, Pediatrics, General Medicine"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Qualification Degrees *
              </label>
              <input
                type="text"
                required
                name="qualification"
                value={formData.qualification}
                onChange={handleInputChange}
                placeholder="e.g. MBBS, MD, DM"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Medical Reg. Number
              </label>
              <input
                type="text"
                name="registration_number"
                value={formData.registration_number}
                onChange={handleInputChange}
                placeholder="e.g. MCI-28491"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Consultation Fee (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="50"
                name="consultation_fee"
                value={formData.consultation_fee}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Available Hours
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  name="available_from"
                  value={formData.available_from}
                  onChange={handleInputChange}
                  placeholder="09:00"
                  className="w-1/2 px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-center"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="text"
                  name="available_to"
                  value={formData.available_to}
                  onChange={handleInputChange}
                  placeholder="17:00"
                  className="w-1/2 px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-center"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-teal-600/30 transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Creating Doctor...' : 'Save Doctor'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
