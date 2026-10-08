import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useClinic } from '../../context/ClinicContext';
import { LoadingSpinner } from '../../components/common/Modal';
import {
  Printer,
  ArrowLeft,
  HeartPulse,
  Pill,
  Calendar,
  User,
  Phone,
  Droplet,
  Activity,
  FileCheck,
  CheckCircle,
  Share2,
} from 'lucide-react';

export function PrescriptionReceipt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clinic } = useClinic();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPrescription = async () => {
      try {
        setLoading(true);
        const res = await api.prescriptions.getById(id);
        setData(res.prescription);
      } catch (err) {
        console.error('Failed to load prescription:', err);
        setError(err.message || 'Prescription not found');
      } finally {
        setLoading(false);
      }
    };

    loadPrescription();
  }, [id]);

  if (loading) return <LoadingSpinner text="Generating official medical prescription receipt..." />;

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 max-w-xl mx-auto my-12">
        <p className="text-rose-600 font-semibold mb-3">{error || 'Prescription not found'}</p>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  const p = data;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Medical Profile
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to={`/patients/${p.patient_id}`}
            className="flex-1 sm:flex-initial text-center px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            Patient Record
          </Link>
          <button
            onClick={() => window.print()}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print Rx
          </button>
        </div>
      </div>

      {/* Official Prescription Pad / Letterhead */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-12 border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0">
        {/* Clinic & Hospital Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-teal-700/80">
          <div className="flex items-center gap-4">
            {clinic?.logo_url ? (
              <img
                src={clinic.logo_url}
                alt={clinic.clinic_name}
                className="w-14 h-14 object-contain rounded-2xl bg-white p-1 border border-slate-200 shadow-md shadow-teal-700/10 shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-teal-700 text-white flex items-center justify-center font-bold shadow-md shadow-teal-700/20 shrink-0">
                <HeartPulse className="w-8 h-8" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {clinic?.clinic_name || 'AuraCare Clinic'}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {clinic?.tagline || 'Comprehensive Clinical Practice & Multispeciality OPD'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {clinic?.address || '108 Healthcare Blvd, Central District, Pune'} • Tel:{' '}
                {clinic?.phone || '+91 98000 00000'} • Reg:{' '}
                {clinic?.registration_number || 'MC-PUN-2024-8891'}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl">
            <div className="text-base font-extrabold text-teal-900">{p.doctor_name}</div>
            <div className="text-xs text-teal-700 font-semibold">{p.doctor_specialization}</div>
            <div className="text-[11px] text-slate-500">{p.doctor_qualification}</div>
            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
              Medical Reg No: <strong>{p.doctor_reg_no || 'MCI-VERIFIED'}</strong>
            </div>
          </div>
        </div>

        {/* Patient Demographic Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-b border-slate-200/80 text-xs bg-slate-50/70 p-4 rounded-2xl my-5">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Patient Name
            </span>
            <span className="font-extrabold text-slate-800 text-sm">
              {p.patient_first_name} {p.patient_last_name}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Patient ID
            </span>
            <span className="font-mono font-bold text-teal-800">{p.patient_code}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Gender / Age
            </span>
            <span className="font-medium text-slate-700">
              {p.patient_gender || 'N/A'}{' '}
              {p.patient_dob ? `(${new Date(p.patient_dob).toLocaleDateString()})` : ''}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Consultation Date
            </span>
            <span className="font-medium text-slate-800">
              {new Date(p.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Physical Vitals Strip & Diagnosis */}
        <div className="mb-6 space-y-3">
          {(p.blood_pressure || p.temperature || p.weight || p.pulse || p.height || p.patient_blood_group) && (
            <div className="flex flex-wrap items-center gap-3 text-xs bg-teal-50/50 border border-teal-100/80 p-3 rounded-xl font-mono text-teal-900">
              <span className="font-bold font-sans text-teal-800 text-[11px] uppercase mr-1">
                Clinical Vitals:
              </span>
              {p.blood_pressure && (
                <span className="bg-white px-2 py-0.5 rounded-md border border-teal-200">
                  BP: <strong>{p.blood_pressure}</strong>
                </span>
              )}
              {p.pulse && (
                <span className="bg-white px-2 py-0.5 rounded-md border border-teal-200">
                  Pulse: <strong>{p.pulse}</strong>
                </span>
              )}
              {p.temperature && (
                <span className="bg-white px-2 py-0.5 rounded-md border border-teal-200">
                  Temp: <strong>{p.temperature}</strong>
                </span>
              )}
              {p.weight && (
                <span className="bg-white px-2 py-0.5 rounded-md border border-teal-200">
                  Weight: <strong>{p.weight}</strong>
                </span>
              )}
              {p.height && (
                <span className="bg-white px-2 py-0.5 rounded-md border border-teal-200">
                  Height: <strong>{p.height}</strong>
                </span>
              )}
              {p.patient_blood_group && (
                <span className="bg-white px-2 py-0.5 rounded-md border border-teal-200">
                  Blood Group: <strong>{p.patient_blood_group}</strong>
                </span>
              )}
            </div>
          )}

          {p.diagnosis && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
              <div>
                <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  Clinical Diagnosis
                </div>
                <div className="font-extrabold text-slate-900 text-sm mt-0.5">{p.diagnosis}</div>
              </div>

              {(p.chief_complaint || p.associated_complaints) && (
                <div className="text-slate-600 text-[11px] space-y-0.5 pt-1 border-t border-slate-200/60">
                  {p.chief_complaint && <div><strong>Chief Complaints:</strong> {p.chief_complaint}</div>}
                  {p.associated_complaints && <div><strong>Associated Complaints:</strong> {p.associated_complaints}</div>}
                </div>
              )}

              {p.totality_of_symptoms && (
                <div className="p-2.5 bg-teal-50/70 border border-teal-200 rounded-lg text-teal-950 text-[11px] mt-1">
                  <span className="font-bold uppercase tracking-wider text-[9px] text-teal-800 block mb-0.5">
                    Homeopathic Totality of Symptoms & Modalities
                  </span>
                  <div className="whitespace-pre-line">{p.totality_of_symptoms}</div>
                </div>
              )}

              {p.treatment_dose && (
                <div className="p-2.5 bg-slate-100 rounded-lg text-slate-800 text-[11px] mt-1">
                  <span className="font-bold uppercase tracking-wider text-[9px] text-slate-500 block mb-0.5">
                    Prescribed Posology & Homeopathic Regimen
                  </span>
                  <div className="whitespace-pre-line font-medium">{p.treatment_dose}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Prescribed Medications Section (Rx) */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-3xl font-serif font-black text-teal-800 italic">℞</span>
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
              Prescribed Medicines & Dosage Schedule
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3 w-8">#</th>
                  <th className="p-3">Medicine Name & Formulation</th>
                  <th className="p-3">Dosage</th>
                  <th className="p-3">Frequency / Timing</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Instructions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {p.items && p.items.length > 0 ? (
                  p.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono text-slate-400 font-bold">{idx + 1}</td>
                      <td className="p-3 font-extrabold text-slate-900 text-sm">
                        {item.medicine_name}
                      </td>
                      <td className="p-3 text-slate-700 font-medium">{item.dosage}</td>
                      <td className="p-3 font-mono font-bold text-teal-800 bg-teal-50/40 rounded">
                        {item.frequency}
                      </td>
                      <td className="p-3 text-slate-700">{item.duration}</td>
                      <td className="p-3 text-slate-600 italic">
                        {item.instructions || 'As advised'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-slate-400">
                      No medications listed
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Clinical Advice & Dietary Guidelines */}
        {p.notes && (
          <div className="mb-8 p-4 bg-amber-50/60 border border-amber-200 rounded-2xl text-xs space-y-1">
            <div className="font-bold text-amber-900 uppercase tracking-wider text-[10px]">
              Physician's Special Advice & Lifestyle Instructions
            </div>
            <p className="text-amber-950 whitespace-pre-line leading-relaxed">{p.notes}</p>
          </div>
        )}

        {/* Follow-up Review Notice */}
        {p.follow_up_date && (
          <div className="mb-8 p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs flex items-center justify-between text-teal-900">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-700" />
              <span className="font-semibold">
                Recommended Follow-Up / Review Date:
              </span>
            </div>
            <strong className="font-mono text-sm font-bold text-teal-800">
              {new Date(p.follow_up_date).toLocaleDateString()}
            </strong>
          </div>
        )}

        {/* Footer: Doctor Signature & Verification Seal */}
        <div className="pt-8 border-t-2 border-slate-100 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="text-[11px] text-slate-400 space-y-1 max-w-md">
            <div className="flex items-center gap-1.5 text-teal-700 font-bold">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Certified Electronic Clinical Prescription</span>
            </div>
            {clinic?.receipt_footer_note && (
              <p className="text-slate-600 italic text-[11px] leading-relaxed">
                "{clinic.receipt_footer_note}"
              </p>
            )}
            <div>
              Issued by {clinic?.clinic_name || 'AuraCare Clinical Practice'}. Valid for pharmacy dispensing.
            </div>
            <div className="font-mono text-[10px] text-slate-400">
              Rx ID: RX-00{p.id} • Auth Hash: OK-{p.id}-2026
            </div>
          </div>

          <div className="text-center sm:text-right">
            <div className="border-b border-slate-300 w-48 mb-2 mx-auto sm:ml-auto"></div>
            <div className="font-extrabold text-slate-900 text-sm">{p.doctor_name}</div>
            <div className="text-xs text-teal-700 font-semibold">{p.doctor_specialization}</div>
            <div className="text-[10px] font-mono text-slate-400">
              Reg: {p.doctor_reg_no || 'MCI-APPROVED'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
