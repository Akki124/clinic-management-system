import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

const defaultSettings = {
  id: 1,
  clinic_name: 'AuraCare Multispeciality Clinic',
  tagline: 'Comprehensive Outpatient & Family Healthcare Center',
  phone: '+91 98000 00000',
  email: 'contact@auracareclinic.com',
  address: '108 Healthcare Blvd, Central Medical District, Pune, Maharashtra 411001',
  registration_number: 'MC-PUN-2024-8891',
  logo_url: null,
  website: 'https://auracare.clinic',
  tax_id: 'GSTIN-27AABCA1234F1Z5',
  currency_symbol: '₹',
  revisit_validity_days: 14,
  receipt_footer_note:
    'Thank you for choosing AuraCare Clinic. Please bring this document for your follow-up consultation.',
};

const ClinicContext = createContext({
  clinic: defaultSettings,
  loading: true,
  refreshClinic: async () => {},
});

export function ClinicProvider({ children }) {
  const [clinic, setClinic] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.settings.get();
      if (res && res.settings) {
        setClinic((prev) => ({
          ...prev,
          ...res.settings,
          // ensure currency symbol defaults properly if missing/corrupt
          currency_symbol: res.settings.currency_symbol === '?' ? '₹' : (res.settings.currency_symbol || '₹'),
        }));
      }
    } catch (err) {
      console.warn('Could not load clinic settings, using defaults:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const refreshClinic = async () => {
    await fetchSettings();
  };

  return (
    <ClinicContext.Provider value={{ clinic, loading, refreshClinic }}>
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinic() {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
}
