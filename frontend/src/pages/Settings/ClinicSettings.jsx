import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useClinic } from '../../context/ClinicContext';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  FileText,
  Upload,
  Trash2,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Printer,
  HeartPulse,
  Save,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export function ClinicSettings() {
  const { clinic, refreshClinic } = useClinic();

  const [formData, setFormData] = useState({
    clinic_name: '',
    tagline: '',
    phone: '',
    email: '',
    address: '',
    registration_number: '',
    website: '',
    tax_id: '',
    currency_symbol: '₹',
    revisit_validity_days: 14,
    receipt_footer_note: '',
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sync form with clinic context
  useEffect(() => {
    if (clinic) {
      setFormData({
        clinic_name: clinic.clinic_name || '',
        tagline: clinic.tagline || '',
        phone: clinic.phone || '',
        email: clinic.email || '',
        address: clinic.address || '',
        registration_number: clinic.registration_number || '',
        website: clinic.website || '',
        tax_id: clinic.tax_id || '',
        currency_symbol: clinic.currency_symbol || '₹',
        revisit_validity_days: clinic.revisit_validity_days || 14,
        receipt_footer_note: clinic.receipt_footer_note || '',
      });
      setLogoPreview(clinic.logo_url || null);
    }
  }, [clinic]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.settings.update(formData);
      await refreshClinic();
      setSuccessMsg('Clinic details and receipt configuration saved successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to update clinic settings:', err);
      setErrorMsg(err.message || 'Failed to update clinic settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Logo file size must be less than 5MB');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    setUploadingLogo(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const data = new FormData();
      data.append('logo', logoFile);
      await api.settings.uploadLogo(data);
      await refreshClinic();
      setLogoFile(null);
      setSuccessMsg('Clinic logo uploaded and applied to all receipts and portals!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to upload logo:', err);
      setErrorMsg(err.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!window.confirm('Are you sure you want to remove the custom logo and revert to the default clinic icon?')) {
      return;
    }
    setUploadingLogo(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.settings.deleteLogo();
      await refreshClinic();
      setLogoFile(null);
      setLogoPreview(null);
      setSuccessMsg('Clinic logo removed. Reverted to default clinic symbol.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to remove logo:', err);
      setErrorMsg(err.message || 'Failed to remove logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto pb-12">
      {/* Top Banner & Security Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-teal-600/20 shrink-0">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Clinic Details & Branding
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" /> Admin Access
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Updates reflect across Web Portal, Prescriptions (Rx), and Invoices.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={handleSaveDetails}
            disabled={saving}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/25 transition disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2.5 shadow-2xs animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2.5 shadow-2xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT 2 COLUMNS: Form Settings */}
        <form onSubmit={handleSaveDetails} className="lg:col-span-2 space-y-6">
          {/* Section 1: Clinic Identity */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Building2 className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">Clinic Identity & Registration</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinic / Hospital Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="clinic_name"
                  value={formData.clinic_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. AuraCare Multispeciality Clinic"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Specialty Tagline / Subtitle
                </label>
                <input
                  type="text"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleChange}
                  placeholder="e.g. Comprehensive Clinical Practice & Multispeciality OPD"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Medical Council / Establishment Reg. No.
                </label>
                <input
                  type="text"
                  name="registration_number"
                  value={formData.registration_number}
                  onChange={handleChange}
                  placeholder="e.g. MC-PUN-2024-8891"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GSTIN / Tax ID Number
                </label>
                <input
                  type="text"
                  name="tax_id"
                  value={formData.tax_id}
                  onChange={handleChange}
                  placeholder="e.g. 27AABCA1234F1Z5"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact Information & Location */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Phone className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">Contact Details & Physical Location</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Helpline / Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. +91 98000 00000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. contact@auracareclinic.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Website / Patient Portal URL
                </label>
                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="e.g. https://auracare.clinic"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinic Postal Address (Printed on Rx Header & Invoices)
                </label>
                <textarea
                  rows={2}
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g. 108 Healthcare Blvd, Central District, Pune, Maharashtra 411001"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Receipt & Consultation Rules */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Printer className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">Receipt Customization & Revisit Policy</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Billing Currency Symbol
                </label>
                <input
                  type="text"
                  name="currency_symbol"
                  value={formData.currency_symbol}
                  onChange={handleChange}
                  placeholder="e.g. ₹ or $ or AED"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
                <p className="text-[10px] text-slate-400 mt-1">Appears on invoices, bills, and doctor fees.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Free Revisit Validity Window (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  max="90"
                  name="revisit_validity_days"
                  value={formData.revisit_validity_days}
                  onChange={handleChange}
                  placeholder="e.g. 14"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Days within which follow-up visits have ₹0 consultation fee.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Printed Receipt Footer Note / Instructions
                </label>
                <textarea
                  rows={2}
                  name="receipt_footer_note"
                  value={formData.receipt_footer_note}
                  onChange={handleChange}
                  placeholder="e.g. Thank you for choosing AuraCare Clinic. Please bring this document for your follow-up consultation."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/25 transition disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving All Settings...' : 'Save All Settings'}
            </button>
          </div>
        </form>

        {/* RIGHT 1 COLUMN: Logo Uploader & Live Preview */}
        <div className="space-y-6">
          {/* Logo Management Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">Clinic Logo & Emblem</h2>
            </div>

            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center">
              {logoPreview ? (
                <div className="relative group">
                  <img
                    src={logoPreview}
                    alt="Clinic Logo Preview"
                    className="w-24 h-24 object-contain rounded-2xl bg-white p-2 shadow-xs border border-slate-200"
                  />
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <span className="text-[11px] font-bold text-teal-700">Custom Logo Active</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-20 h-20 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-teal-600/20 mx-auto">
                    <HeartPulse className="w-10 h-10" />
                  </div>
                  <p className="text-xs font-semibold text-slate-600">Default Clinic Icon</p>
                  <p className="text-[10px] text-slate-400">Upload a custom image to replace this icon</p>
                </div>
              )}

              {/* Upload control */}
              <div className="mt-4 w-full space-y-2">
                <input
                  type="file"
                  id="logo-upload-input"
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  onChange={handleLogoFileChange}
                  className="hidden"
                />

                <label
                  htmlFor="logo-upload-input"
                  className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5 text-teal-600" />
                  {logoFile ? 'Change Chosen Image' : 'Select Logo Image'}
                </label>

                {logoFile && (
                  <button
                    type="button"
                    onClick={handleUploadLogo}
                    disabled={uploadingLogo}
                    className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition disabled:opacity-50 cursor-pointer"
                  >
                    {uploadingLogo ? 'Uploading Logo...' : 'Upload & Apply Logo'}
                  </button>
                )}

                {clinic.logo_url && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    disabled={uploadingLogo}
                    className="inline-flex items-center justify-center gap-1.5 w-full px-4 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Custom Logo
                  </button>
                )}
              </div>
            </div>

            <div className="text-[11px] text-slate-400 space-y-1">
              <p>• Recommended: Square or transparent PNG/SVG (min 200x200px).</p>
              <p>• Maximum file size: 5MB.</p>
              <p>• Applied instantly to Prescriptions, Bills, and Portal Header.</p>
            </div>
          </div>

          {/* Live Letterhead Preview Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-teal-600" />
                <h2 className="text-sm font-bold text-slate-900">Live Letterhead Preview</h2>
              </div>
              <span className="text-[10px] font-bold text-teal-700 uppercase">Real-Time</span>
            </div>

            <p className="text-[11px] text-slate-400">
              This is how your clinic letterhead appears on patient Prescription Receipts (Rx) and Invoices:
            </p>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-3">
              <div className="flex items-start gap-3 pb-3 border-b border-teal-700/40">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="w-10 h-10 object-contain rounded-xl bg-white p-1 border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold shrink-0">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-extrabold text-slate-900 text-xs truncate">
                    {formData.clinic_name || 'Clinic Name'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium truncate">
                    {formData.tagline || 'Specialty Practice'}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5 line-clamp-2">
                    {formData.address || 'Address'} • Tel: {formData.phone || 'Phone'} • Reg:{' '}
                    {formData.registration_number || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="text-[9px] text-slate-400 italic">
                {formData.receipt_footer_note || 'Official medical practice document.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
