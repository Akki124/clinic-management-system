import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common/Modal';
import {
  Stethoscope,
  Pill,
  Heart,
  Plus,
  Trash2,
  CheckCircle,
  ArrowLeft,
  Activity,
  History,
  FileCheck,
  User,
  AlertCircle,
  Printer,
  Brain,
  Thermometer,
  FlaskConical,
  FileText,
  Sparkles,
  Clock,
  Flame,
  Snowflake,
  Scale,
  Eye,
  Check,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';

export function ConsultationRoom() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [appointment, setAppointment] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [completedPrescriptionId, setCompletedPrescriptionId] = useState(null);

  // Active Tab for navigating between sections
  const [activeSection, setActiveSection] = useState('complaints');
  const [viewMode, setViewMode] = useState('tabbed'); // 'tabbed' or 'all'

  // SECTION 1: Chief Complaints & Associated Complaints
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [associatedComplaints, setAssociatedComplaints] = useState('');

  // SECTION 2: Patient History
  const [pastHistory, setPastHistory] = useState('');
  const [familyHistory, setFamilyHistory] = useState('');

  // SECTION 3: Personal History
  const [appetite, setAppetite] = useState('Normal');
  const [thirst, setThirst] = useState('Normal');
  const [desire, setDesire] = useState('');
  const [aversion, setAversion] = useState('');
  const [thermalState, setThermalState] = useState('Ambithermal');
  const [disagree, setDisagree] = useState('');
  const [allergy, setAllergy] = useState('');
  const [stool, setStool] = useState('Normal');
  const [urine, setUrine] = useState('Normal');
  const [sleep, setSleep] = useState('Sound');
  const [dreams, setDreams] = useState('');
  const [habit, setHabit] = useState('None');
  const [menstrualHistory, setMenstrualHistory] = useState('');
  const [obstetricHistory, setObstetricHistory] = useState('');

  // SECTION 4: Clinical Examination
  const [weight, setWeight] = useState('70 kg');
  const [pulse, setPulse] = useState('76 bpm');
  const [tongue, setTongue] = useState('Clean pink');
  const [conjunctiva, setConjunctiva] = useState('Normal pink');
  const [height, setHeight] = useState('170 cm');
  const [bloodPressure, setBloodPressure] = useState('120/80 mmHg');
  const [temperature, setTemperature] = useState('98.6 F');
  const [nail, setNail] = useState('Normal');

  // SECTION 5: Systemic Examination
  const [cvs, setCvs] = useState('S1, S2 heard normal. No murmurs.');
  const [cns, setCns] = useState('Conscious, oriented, reflexes intact. No tremors.');
  const [rs, setRs] = useState('Bilateral vesicular breath sounds clear. No wheeze or rhonchi.');
  const [git, setGit] = useState('Per abdomen soft, non-tender. No organomegaly.');

  // SECTION 6: Mental Symptoms
  const [mentalSymptoms, setMentalSymptoms] = useState('');

  // SECTION 7: Lab Investigation
  const [labInvestigation, setLabInvestigation] = useState('');

  // SECTION 8: Diagnosis & Homeopathic Treatment
  const [diagnosis, setDiagnosis] = useState('');
  const [totalityOfSymptoms, setTotalityOfSymptoms] = useState('');
  const [treatmentDose, setTreatmentDose] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [prescriptionNotes, setPrescriptionNotes] = useState(
    'Keep 30 minutes gap before and after food. Avoid raw onion, garlic, coffee, mint, and camphor.'
  );

  // Homeopathic Remedies Repeater (Rx)
  const [medicines, setMedicines] = useState([
    {
      medicine_name: 'Arnica Montana',
      dosage: '200CH',
      frequency: '4 Pills BD (Morning & Night)',
      duration: '7 days',
      instructions: 'Dissolve on clean tongue on empty stomach',
    },
  ]);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        setLoading(true);
        const appRes = await api.appointments.getById(appointmentId);
        setAppointment(appRes.appointment);
        if (appRes.appointment.reason) {
          setChiefComplaint(appRes.appointment.reason);
        }
        if (appRes.appointment.blood_pressure) setBloodPressure(appRes.appointment.blood_pressure);
        if (appRes.appointment.temperature) setTemperature(appRes.appointment.temperature);
        if (appRes.appointment.weight) setWeight(appRes.appointment.weight);

        // Load past visits of this patient for reference
        if (appRes.appointment.patient_id) {
          const pastVisits = await api.patients.getVisits(appRes.appointment.patient_id);
          setPatientHistory(pastVisits.visits || []);
        }
      } catch (err) {
        console.error('Failed to load consultation appointment:', err);
        setError(err.message || 'Failed to load consultation session');
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [appointmentId]);

  const handleAddMedicine = () => {
    setMedicines((prev) => [
      ...prev,
      {
        medicine_name: '',
        dosage: '200CH',
        frequency: '4 Pills BD',
        duration: '7 days',
        instructions: 'Dissolve on clean tongue',
      },
    ]);
  };

  const handleRemoveMedicine = (index) => {
    setMedicines((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleMedicineChange = (index, field, value) => {
    setMedicines((prev) =>
      prev.map((med, idx) => (idx === index ? { ...med, [field]: value } : med))
    );
  };

  const handleFinishConsultation = async (e) => {
    e.preventDefault();
    if (!chiefComplaint.trim()) {
      alert('Please enter Chief Complaints before completing consultation');
      setActiveSection('complaints');
      return;
    }
    if (!diagnosis.trim()) {
      alert('Please enter Clinical Diagnosis in Section 8');
      setActiveSection('diagnosis_rx');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const validMedicines = medicines.filter((m) => m.medicine_name.trim() !== '');

      const payload = {
        appointment_id: parseInt(appointmentId, 10),
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        // 1. Complaints
        chief_complaint: chiefComplaint,
        associated_complaints: associatedComplaints,
        // 2. History
        past_history: pastHistory,
        family_history: familyHistory,
        // 3. Personal History
        appetite,
        thirst,
        desire,
        aversion,
        thermal_state: thermalState,
        disagree,
        allergy,
        stool,
        urine,
        sleep,
        dreams,
        habit,
        menstrual_history: menstrualHistory,
        obstetric_history: obstetricHistory,
        // 4. Clinical Examination
        weight,
        pulse,
        tongue,
        conjunctiva,
        height,
        blood_pressure: bloodPressure,
        temperature,
        nail,
        // 5. Systemic Examination
        cvs,
        cns,
        rs,
        git,
        // 6. Mental Symptoms
        mental_symptoms: mentalSymptoms,
        // 7. Lab Investigation
        lab_investigation: labInvestigation,
        // 8. Diagnosis & Treatment
        diagnosis,
        totality_of_symptoms: totalityOfSymptoms,
        treatment_dose: treatmentDose,
        doctor_notes: doctorNotes,
        follow_up_date: followUpDate || null,
        prescription_notes: prescriptionNotes,
        prescription_items: validMedicines,
      };

      const res = await api.visits.create(payload);
      setSuccess(true);
      if (res.prescription && res.prescription.id) {
        setCompletedPrescriptionId(res.prescription.id);
      } else {
        setTimeout(() => {
          navigate(`/patients/${appointment.patient_id}`);
        }, 1500);
      }
    } catch (err) {
      console.error('Error saving consultation:', err);
      setError(err.message || 'Failed to save consultation');
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: 'complaints', num: '1', title: 'Complaints', subtitle: 'Chief & Associated' },
    { id: 'history', num: '2', title: 'History', subtitle: 'Past & Family' },
    { id: 'personal', num: '3', title: 'Personal', subtitle: 'Thermals & Desires' },
    { id: 'clinical_exam', num: '4', title: 'Clinical Exam', subtitle: 'General Vitals' },
    { id: 'systemic_exam', num: '5', title: 'Systemic Exam', subtitle: 'CVS, CNS, RS, GIT' },
    { id: 'mental', num: '6', title: 'Mental Symptoms', subtitle: 'Mind & Disposition' },
    { id: 'lab', num: '7', title: 'Lab Reports', subtitle: 'Investigations' },
    { id: 'diagnosis_rx', num: '8', title: 'Diagnosis & Rx', subtitle: 'Totality & Remedies' },
  ];

  if (loading) return <LoadingSpinner text="Preparing Homeopathic consultation desk..." />;

  if (error && !appointment) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-rose-600 font-semibold mb-3">{error}</p>
        <Link
          to="/appointments"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Appointments
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/appointments"
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 transition shadow-2xs shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-teal-100 text-teal-900 border border-teal-200 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-700 shrink-0" />
              <span className="truncate">Homeopathy OPD Desk • Case Record</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
              Doctor Consultation Desk
            </h1>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          {/* View mode toggle */}
          <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 flex-1 sm:flex-initial justify-center">
            <button
              type="button"
              onClick={() => setViewMode('tabbed')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition cursor-pointer text-center ${
                viewMode === 'tabbed' ? 'bg-white text-teal-800 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Tabs Mode
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition cursor-pointer text-center ${
                viewMode === 'all' ? 'bg-white text-teal-800 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Full Case
            </button>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] sm:text-[11px] font-mono text-slate-400">#{appointment.id}</span>
            <div className="text-xs font-bold text-slate-700">
              {appointment.start_time}
            </div>
          </div>
        </div>
      </div>

      {completedPrescriptionId ? (
        <div className="bg-white border-2 border-emerald-400 rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-lg space-y-6">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider rounded-full">
              Case Taking & Consultation Finalized
            </span>
            <h2 className="text-2xl font-black text-slate-900">
              Homeopathic Prescription & Case Successfully Recorded!
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Totality of symptoms, mental rubrics, and prescribed remedies for{' '}
              <strong>
                {appointment.patient_first_name} {appointment.patient_last_name}
              </strong>{' '}
              have been permanently saved.
            </p>
          </div>

          <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-2xl flex items-center justify-between text-left">
            <div>
              <div className="text-[10px] font-bold uppercase text-teal-700 tracking-wider">
                Official Homeopathy Rx Record
              </div>
              <div className="font-mono font-bold text-teal-950 text-sm">
                Prescription #RX-00{completedPrescriptionId}
              </div>
            </div>
            <Link
              to={`/prescriptions/${completedPrescriptionId}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/25 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" /> View & Print Prescription (Rx)
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to={`/patients/${appointment.patient_id}`}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              Patient Medical File
            </Link>
            <Link
              to="/appointments"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              OPD Appointments Queue
            </Link>
          </div>
        </div>
      ) : (
        <>
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Patient Quick Info Strip */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-700 text-white flex items-center justify-center font-black text-lg shadow-md shadow-teal-700/20 shrink-0">
                {appointment.patient_first_name[0]}
                {appointment.patient_last_name[0]}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    {appointment.patient_first_name} {appointment.patient_last_name}
                  </h3>
                  <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-bold">
                    {appointment.patient_code}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                  <span>Gender: <strong>{appointment.patient_gender || 'N/A'}</strong></span>
                  <span>•</span>
                  <span>Blood Group: <strong className="text-teal-800">{appointment.patient_blood_group || 'N/A'}</strong></span>
                  <span>•</span>
                  <span>Phone: {appointment.patient_phone || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to={`/patients/${appointment.patient_id}`}
                target="_blank"
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Complete Patient History ↗
              </Link>
            </div>
          </div>

          {/* Section Navigation Tabs (Click to jump / focus) */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 min-w-max">
              {sections.map((sec) => {
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => {
                      setActiveSection(sec.id);
                      if (viewMode === 'all') {
                        const el = document.getElementById(`sec-${sec.id}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                      isActive
                        ? 'bg-teal-700 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                        isActive ? 'bg-white text-teal-800' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {sec.num}
                    </span>
                    <span className="whitespace-nowrap">{sec.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Layout Grid: Consultation Form Left (2 Cols), Case History Sidebar Right (1 Col) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={handleFinishConsultation} className="lg:col-span-2 space-y-6">
              {/* SECTION 1: Chief Complaints & Associated Complaints */}
              {(viewMode === 'all' || activeSection === 'complaints') && (
                <div id="sec-complaints" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                        1
                      </div>
                      <div>
                        <h2 className="text-sm font-extrabold text-slate-900">
                          Chief Complaints & Associated Complaints
                        </h2>
                        <p className="text-[11px] text-slate-400">
                          Location, Sensation, Modalities (Aggravation / Amelioration), and Concomitants
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Chief Complaints <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={chiefComplaint}
                        onChange={(e) => setChiefComplaint(e.target.value)}
                        placeholder="e.g. Throbbing right-sided headache with nausea since 4 days. Aggravated by light, noise, sun heat. Ameliorated by cold compress and tight bandaging..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Other Associated Complaints
                      </label>
                      <textarea
                        rows={3}
                        value={associatedComplaints}
                        onChange={(e) => setAssociatedComplaints(e.target.value)}
                        placeholder="e.g. Acid eructations, constipation with burning in soles at night, generalized fatigue..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: Patient History */}
              {(viewMode === 'all' || activeSection === 'history') && (
                <div id="sec-history" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                        2
                      </div>
                      <div>
                        <h2 className="text-sm font-extrabold text-slate-900">
                          Patient History (Past & Family)
                        </h2>
                        <p className="text-[11px] text-slate-400">
                          Miasmatic background, past suppressions, surgeries, and hereditary traits
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Past History
                      </label>
                      <textarea
                        rows={3}
                        value={pastHistory}
                        onChange={(e) => setPastHistory(e.target.value)}
                        placeholder="e.g. Recurrent tonsillitis in childhood suppressed with antibiotics; Typhoid at age 18; Appendectomy 5 years ago; History of eczema..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Family History
                      </label>
                      <textarea
                        rows={3}
                        value={familyHistory}
                        onChange={(e) => setFamilyHistory(e.target.value)}
                        placeholder="e.g. Father: Diabetic & Hypertensive; Mother: Bronchial Asthma; Maternal grandfather: Carcinoma Colon..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: Personal History (Homeopathic Physical Generals) */}
              {(viewMode === 'all' || activeSection === 'personal') && (
                <div id="sec-personal" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                        3
                      </div>
                      <div>
                        <h2 className="text-sm font-extrabold text-slate-900">
                          Personal History (Physical Generals)
                        </h2>
                        <p className="text-[11px] text-slate-400">
                          Appetite, Thirst, Thermals, Desires, Aversions, Excretions, Sleep & Female History
                        </p>
                      </div>
                    </div>

                    {/* Thermal State Quick Badge */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setThermalState('Chilly')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition cursor-pointer ${
                          thermalState === 'Chilly' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Snowflake className="w-3 h-3" /> Chilly
                      </button>
                      <button
                        type="button"
                        onClick={() => setThermalState('Hot')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition cursor-pointer ${
                          thermalState === 'Hot' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Flame className="w-3 h-3" /> Hot
                      </button>
                      <button
                        type="button"
                        onClick={() => setThermalState('Ambithermal')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition cursor-pointer ${
                          thermalState === 'Ambithermal' ? 'bg-teal-700 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Scale className="w-3 h-3" /> Ambithermal
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Appetite */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Appetite</label>
                      <input
                        type="text"
                        value={appetite}
                        onChange={(e) => setAppetite(e.target.value)}
                        placeholder="e.g. Normal / Ravenous / Poor / Canine hunger"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                      />
                    </div>

                    {/* Thirst */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Thirst</label>
                      <input
                        type="text"
                        value={thirst}
                        onChange={(e) => setThirst(e.target.value)}
                        placeholder="e.g. Thirstless / Large qty at long interval / Small qty frequently"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                      />
                    </div>

                    {/* Thermal State */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Thermal State</label>
                      <select
                        value={thermalState}
                        onChange={(e) => setThermalState(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-teal-800"
                      >
                        <option value="Chilly">Chilly (Sensitive to cold)</option>
                        <option value="Hot">Hot (Sensitive to heat/warmth)</option>
                        <option value="Ambithermal">Ambithermal (Neither/Both)</option>
                      </select>
                    </div>

                    {/* Desire */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Desire</label>
                      <input
                        type="text"
                        value={desire}
                        onChange={(e) => setDesire(e.target.value)}
                        placeholder="e.g. Sweets, Salty, Sour, Spicy, Warm drinks, Cold milk"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                      />
                    </div>

                    {/* Aversion */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Aversion</label>
                      <input
                        type="text"
                        value={aversion}
                        onChange={(e) => setAversion(e.target.value)}
                        placeholder="e.g. Meat, Milk, Fatty foods, Bread, Sweets"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                      />
                    </div>

                    {/* Disagree / Intolerance */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Disagree / Aggravation</label>
                      <input
                        type="text"
                        value={disagree}
                        onChange={(e) => setDisagree(e.target.value)}
                        placeholder="e.g. Milk causes diarrhea, Onions cause bloating"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                      />
                    </div>

                    {/* Allergy */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Allergy</label>
                      <input
                        type="text"
                        value={allergy}
                        onChange={(e) => setAllergy(e.target.value)}
                        placeholder="e.g. Dust, Pollen, NSAIDs, Sulfa, Strong perfumes"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                      />
                    </div>

                    {/* Stool */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Stool</label>
                      <input
                        type="text"
                        value={stool}
                        onChange={(e) => setStool(e.target.value)}
                        placeholder="e.g. Normal / Hard dry knotty / Loose / Ineffective urging"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                      />
                    </div>

                    {/* Urine */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Urine</label>
                      <input
                        type="text"
                        value={urine}
                        onChange={(e) => setUrine(e.target.value)}
                        placeholder="e.g. Clear / Burning / Profuse / Scanty / Nocturia"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                      />
                    </div>

                    {/* Sleep */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Sleep</label>
                      <input
                        type="text"
                        value={sleep}
                        onChange={(e) => setSleep(e.target.value)}
                        placeholder="e.g. Sound / Disturbed / Wakes 3 AM / Unrefreshing"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                      />
                    </div>

                    {/* Dreams */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Dreams</label>
                      <input
                        type="text"
                        value={dreams}
                        onChange={(e) => setDreams(e.target.value)}
                        placeholder="e.g. Frightful, Falling, Water, Animals, Dead people"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                      />
                    </div>

                    {/* Habit */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Habit</label>
                      <input
                        type="text"
                        value={habit}
                        onChange={(e) => setHabit(e.target.value)}
                        placeholder="e.g. Tea / Coffee addiction, Smoking, Alcohol, None"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Female / Obstetric History */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Menstrual History
                      </label>
                      <textarea
                        rows={2}
                        value={menstrualHistory}
                        onChange={(e) => setMenstrualHistory(e.target.value)}
                        placeholder="e.g. LMP: 12th Sept; Regular 28-day cycle, duration 4 days, dark clotted flow, dysmenorrhea before flow..."
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Obstetric History
                      </label>
                      <textarea
                        rows={2}
                        value={obstetricHistory}
                        onChange={(e) => setObstetricHistory(e.target.value)}
                        placeholder="e.g. G2 P2 L2 A0; Full term normal deliveries; No postpartum hemorrhage..."
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 4: Clinical Examination */}
              {(viewMode === 'all' || activeSection === 'clinical_exam') && (
                <div id="sec-clinical_exam" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                        4
                      </div>
                      <div>
                        <h2 className="text-sm font-extrabold text-slate-900">
                          Clinical Examination (General Physical)
                        </h2>
                        <p className="text-[11px] text-slate-400">
                          Anthropometrics, vital parameters, tongue, conjunctiva, and nails
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {/* Weight */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        W.T. (Weight)
                      </label>
                      <input
                        type="text"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="e.g. 68 kg"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white"
                      />
                    </div>

                    {/* Height */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Height</label>
                      <input
                        type="text"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="e.g. 172 cm"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white"
                      />
                    </div>

                    {/* Blood Pressure */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">B.P.</label>
                      <input
                        type="text"
                        value={bloodPressure}
                        onChange={(e) => setBloodPressure(e.target.value)}
                        placeholder="e.g. 120/80 mmHg"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-teal-900 focus:bg-white"
                      />
                    </div>

                    {/* Pulse */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Pulse</label>
                      <input
                        type="text"
                        value={pulse}
                        onChange={(e) => setPulse(e.target.value)}
                        placeholder="e.g. 76 bpm"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white"
                      />
                    </div>

                    {/* Temperature */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Temp</label>
                      <input
                        type="text"
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value)}
                        placeholder="e.g. 98.6 F"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white"
                      />
                    </div>

                    {/* Tongue */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tongue</label>
                      <input
                        type="text"
                        value={tongue}
                        onChange={(e) => setTongue(e.target.value)}
                        placeholder="e.g. Clean / White coated / Imprinted teeth"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                      />
                    </div>

                    {/* Conjunctiva */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Conjunctiva</label>
                      <input
                        type="text"
                        value={conjunctiva}
                        onChange={(e) => setConjunctiva(e.target.value)}
                        placeholder="e.g. Normal pink / Pallor / Icteric"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                      />
                    </div>

                    {/* Nail */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nail</label>
                      <input
                        type="text"
                        value={nail}
                        onChange={(e) => setNail(e.target.value)}
                        placeholder="e.g. Normal / Pale / Cyanosis / Koilonychia"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 5: Systemic Examination */}
              {(viewMode === 'all' || activeSection === 'systemic_exam') && (
                <div id="sec-systemic_exam" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                        5
                      </div>
                      <div>
                        <h2 className="text-sm font-extrabold text-slate-900">
                          Systemic Examination
                        </h2>
                        <p className="text-[11px] text-slate-400">
                          Cardiovascular, Central Nervous, Respiratory, and Gastrointestinal systems
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        CVS (Cardiovascular System)
                      </label>
                      <textarea
                        rows={2}
                        value={cvs}
                        onChange={(e) => setCvs(e.target.value)}
                        placeholder="e.g. S1 S2 heard. No murmurs. Peripheral pulses palpable."
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        CNS (Central Nervous System)
                      </label>
                      <textarea
                        rows={2}
                        value={cns}
                        onChange={(e) => setCns(e.target.value)}
                        placeholder="e.g. Conscious, oriented to time place person. Reflexes normal. No motor/sensory deficit."
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        R.S. (Respiratory System)
                      </label>
                      <textarea
                        rows={2}
                        value={rs}
                        onChange={(e) => setRs(e.target.value)}
                        placeholder="e.g. Bilateral vesicular breath sounds heard. No adventitious sounds (wheeze / rhonchi)."
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        G.I.T. (Gastrointestinal Tract)
                      </label>
                      <textarea
                        rows={2}
                        value={git}
                        onChange={(e) => setGit(e.target.value)}
                        placeholder="e.g. Per abdomen soft, non-tender, no organomegaly, bowel sounds present."
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 6: Mental Symptoms */}
              {(viewMode === 'all' || activeSection === 'mental') && (
                <div id="sec-mental" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                        6
                      </div>
                      <div>
                        <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                          <Brain className="w-4 h-4 text-teal-700" /> Mental Symptoms & Disposition
                        </h2>
                        <p className="text-[11px] text-slate-400">
                          Mind rubrics, temperament, emotions, fears, reactions to consolation and stress
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mental Symptoms (Mind & Emotional State)
                    </label>
                    <textarea
                      rows={4}
                      value={mentalSymptoms}
                      onChange={(e) => setMentalSymptoms(e.target.value)}
                      placeholder="e.g. Highly anxious about health, anticipatory anxiety; Irritable when questioned; Consolation aggravates symptoms; Fear of dark, dogs, and solitude; Fastidious nature, wants everything in order; Weeping disposition when narrating complaints..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>
              )}

              {/* SECTION 7: Lab Investigation */}
              {(viewMode === 'all' || activeSection === 'lab') && (
                <div id="sec-lab" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                        7
                      </div>
                      <div>
                        <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                          <FlaskConical className="w-4 h-4 text-teal-700" /> Lab Investigations & Diagnostic Tests
                        </h2>
                        <p className="text-[11px] text-slate-400">
                          Pathological tests, imaging, blood chemistry, and clinical notes
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Lab Investigation Findings
                    </label>
                    <textarea
                      rows={3}
                      value={labInvestigation}
                      onChange={(e) => setLabInvestigation(e.target.value)}
                      placeholder="e.g. CBC: Hb 11.2 gm%, TLC 8,200, Platelets 2.4L; ESR: 28 mm/hr; TSH: 3.8 uIU/ml; Blood Sugar Fasting: 94 mg/dl; USG Abdomen: Mild fatty liver Grade 1..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>
              )}

              {/* SECTION 8: Diagnosis & Homeopathic Prescription */}
              {(viewMode === 'all' || activeSection === 'diagnosis_rx') && (
                <div id="sec-diagnosis_rx" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                        8
                      </div>
                      <div>
                        <h2 className="text-sm font-extrabold text-slate-900">
                          Diagnosis, Totality of Symptoms & Homeopathic Treatment
                        </h2>
                        <p className="text-[11px] text-slate-400">
                          Miasm, Rubrics, Totality, Posology, Prescribed remedies & Follow-up
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Final Clinical Diagnosis <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        placeholder="e.g. Chronic Migraine with Gastric Disturbance, Psoric miasm"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Totality of Symptoms (Homeopathic Rubrics & Keynotes)
                      </label>
                      <textarea
                        rows={3}
                        value={totalityOfSymptoms}
                        onChange={(e) => setTotalityOfSymptoms(e.target.value)}
                        placeholder="e.g. Right sided headache < sun heat, > tight pressure; Thirstless with dry mouth; Craving for sweets; Chilly thermal; Mild gentle weeping disposition..."
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Treatment & Dose (Posology & Plan)
                      </label>
                      <textarea
                        rows={3}
                        value={treatmentDose}
                        onChange={(e) => setTreatmentDose(e.target.value)}
                        placeholder="e.g. Pulsatilla Nigricans 200CH, single dose of 4 pills stat, followed by Rubrum / SL twice daily for 14 days..."
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Electronic Remedies List (Rx) */}
                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                        <Pill className="w-4 h-4 text-teal-600" />
                        <span>Homeopathic Remedies (Rx Itemized Schedule)</span>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddMedicine}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs rounded-xl transition cursor-pointer border border-teal-200"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Remedy
                      </button>
                    </div>

                    <div className="space-y-3">
                      {medicines.map((med, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-teal-800 uppercase font-mono">
                              Remedy #{idx + 1}
                            </span>
                            {medicines.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMedicine(idx)}
                                className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                                title="Remove remedy"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Remedy / Medicine Name
                              </label>
                              <input
                                type="text"
                                value={med.medicine_name}
                                onChange={(e) => handleMedicineChange(idx, 'medicine_name', e.target.value)}
                                placeholder="e.g. Arnica Montana / Nux Vomica / Lycopodium"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Potency / Scale
                              </label>
                              <input
                                type="text"
                                value={med.dosage}
                                onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                                placeholder="e.g. 30CH / 200CH / 1M / Q / 6X"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-teal-800 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Frequency / Repetition
                              </label>
                              <input
                                type="text"
                                value={med.frequency}
                                onChange={(e) => handleMedicineChange(idx, 'frequency', e.target.value)}
                                placeholder="e.g. 4 Pills BD / OD / SOS"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Duration
                              </label>
                              <input
                                type="text"
                                value={med.duration}
                                onChange={(e) => handleMedicineChange(idx, 'duration', e.target.value)}
                                placeholder="e.g. 7 days / 15 days / 1 month"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Intake Instructions
                              </label>
                              <input
                                type="text"
                                value={med.instructions}
                                onChange={(e) =>
                                  handleMedicineChange(idx, 'instructions', e.target.value)
                                }
                                placeholder="e.g. Dissolve on clean tongue. Avoid raw onions & coffee."
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* General Advice & Follow-Up */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Homeopathic Dietary & Lifestyle Guidelines
                      </label>
                      <textarea
                        rows={2}
                        value={prescriptionNotes}
                        onChange={(e) => setPrescriptionNotes(e.target.value)}
                        placeholder="e.g. Keep 30 minutes gap before and after food. Avoid raw onions, garlic, camphor, strong scents and coffee."
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Recommended Follow-Up Date
                      </label>
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-teal-800 focus:bg-white"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Patient revisit fee is ₹0 within the follow-up window.
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Physician's Private Clinical Notes & Prognosis
                      </label>
                      <textarea
                        rows={2}
                        value={doctorNotes}
                        onChange={(e) => setDoctorNotes(e.target.value)}
                        placeholder="Private medical observations, remedy reaction expectations, second prescription notes..."
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit / Finish Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500">
                  <span>Sections Filled: </span>
                  <span className="font-bold text-teal-800">
                    {[chiefComplaint, pastHistory, appetite, weight, cvs, mentalSymptoms, labInvestigation, diagnosis].filter(Boolean).length} / 8 Key Modules
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                  {viewMode === 'tabbed' && activeSection !== 'diagnosis_rx' && (
                    <button
                      type="button"
                      onClick={() => {
                        const curIdx = sections.findIndex((s) => s.id === activeSection);
                        if (curIdx < sections.length - 1) {
                          setActiveSection(sections[curIdx + 1].id);
                        }
                      }}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Next Section</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/25 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <FileCheck className="w-4 h-4" />
                    {saving ? 'Finalizing Case Record...' : 'Complete Consultation & Issue Homeopathic Rx'}
                  </button>
                </div>
              </div>
            </form>

            {/* RIGHT 1 COLUMN: Past Medical History & Homeopathic Case Log */}
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3">
                  <History className="w-4 h-4 text-teal-600" />
                  <span>Past Homeopathic Case History</span>
                </div>

                {patientHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    First visit on record for this patient. Initial constitutional case taking.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                    {patientHistory.map((v) => (
                      <div
                        key={v.id}
                        className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between font-bold text-teal-800">
                          <span>{new Date(v.created_at).toLocaleDateString()}</span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            {v.doctor_name}
                          </span>
                        </div>

                        <div className="font-bold text-slate-900">
                          Diagnosis: <span className="text-slate-700 font-normal">{v.diagnosis}</span>
                        </div>

                        <div className="text-slate-600 text-[11px]">
                          <strong>Complaint:</strong> {v.chief_complaint}
                        </div>

                        {v.mental_symptoms && (
                          <div className="text-slate-600 text-[11px] bg-white p-2 rounded-lg border border-slate-200/60">
                            <strong className="text-teal-900">Mind:</strong> {v.mental_symptoms}
                          </div>
                        )}

                        {v.totality_of_symptoms && (
                          <div className="text-slate-600 text-[11px] bg-white p-2 rounded-lg border border-slate-200/60">
                            <strong className="text-teal-900">Totality:</strong> {v.totality_of_symptoms}
                          </div>
                        )}

                        {v.prescription?.items && v.prescription.items.length > 0 && (
                          <div className="text-[11px] font-mono text-teal-800 pt-1 border-t border-slate-200/60">
                            Rx: {v.prescription.items.map((i) => `${i.medicine_name} ${i.dosage}`).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
