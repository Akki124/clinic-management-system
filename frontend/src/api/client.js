// API client for Clinic Management System
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('clinic_token');

  const headers = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('clinic_token');
      localStorage.removeItem('clinic_user');
      window.dispatchEvent(new Event('auth_logout'));
    }
    const error = new Error(
      data.message || data.error || (response.status ? `Server error (HTTP ${response.status})` : 'Unable to connect to server')
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  auth: {
    login: (credentials) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    getProfile: () => request('/auth/profile'),
  },

  // Doctors (Admin creation)
  doctors: {
    getAll: (params = '') => request(`/doctors${params ? '?' + params : ''}`),
    getById: (id) => request(`/doctors/${id}`),
    create: (data) =>
      request('/doctors', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/doctors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // Staff (Admin creation)
  staff: {
    getAll: () => request('/staff'),
    create: (data) =>
      request('/staff', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/staff/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // Patients
  patients: {
    getAll: (params = '') => request(`/patients${params ? '?' + params : ''}`),
    getById: (id) => request(`/patients/${id}`),
    create: (data) =>
      request('/patients', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getVisits: (id) => request(`/patients/${id}/visits`),
    getPrescriptions: (id) => request(`/patients/${id}/prescriptions`),
    getDocuments: (id) => request(`/patients/${id}/documents`),
  },

  // Appointments
  appointments: {
    getAll: (params = '') => request(`/appointments${params ? '?' + params : ''}`),
    getById: (id) => request(`/appointments/${id}`),
    create: (data) =>
      request('/appointments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    updateStatus: (id, data) =>
      request(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(typeof data === 'string' ? { status: data } : data),
      }),
  },

  // Visits & Consultations
  visits: {
    create: (data) =>
      request('/visits', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getById: (id) => request(`/visits/${id}`),
  },

  // Prescriptions
  prescriptions: {
    create: (data) =>
      request('/prescriptions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getById: (id) => request(`/prescriptions/${id}`),
  },

  // Billing
  billing: {
    getAll: (params = '') => request(`/bills${params ? '?' + params : ''}`),
    getById: (id) => request(`/bills/${id}`),
    create: (data) =>
      request('/bills', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    calculateFee: (params) => request(`/bills/calculate-fee?${params}`),
    addPayment: (id, data) =>
      request(`/bills/${id}/payments`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Documents
  documents: {
    upload: (formData) =>
      request('/documents/upload', {
        method: 'POST',
        body: formData,
      }),
  },

  // Reports & Stats
  reports: {
    getDashboard: () => request('/reports/dashboard'),
  },

  // Clinic Settings (Admin configuration & portal branding)
  settings: {
    get: () => request('/settings'),
    update: (data) =>
      request('/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    uploadLogo: (formData) =>
      request('/settings/logo', {
        method: 'POST',
        body: formData,
      }),
    deleteLogo: () =>
      request('/settings/logo', {
        method: 'DELETE',
      }),
  },
};
