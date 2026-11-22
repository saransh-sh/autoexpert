/**
 * AutoExpert — API Client Service Layer
 */

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'API request failed';
    try {
      const err = await response.json();
      errorDetail = err.detail || JSON.stringify(err);
    } catch (e) {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  // Handle PDF or raw binary
  if (response.headers.get('content-type')?.includes('application/pdf')) {
    return response.blob();
  }

  return response.json();
}

export const api = {
  // Vehicles
  getVehicles: (type) => request(`/vehicles${type ? `?vehicle_type=${type}` : ''}`),
  getVehicle: (id) => request(`/vehicles/${id}`),
  createVehicle: (data) => request('/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  updateVehicle: (id, data) => request(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVehicle: (id) => request(`/vehicles/${id}`, { method: 'DELETE' }),
  getVehicleHealth: (id) => request(`/vehicles/${id}/health`),

  // Diagnostics
  startDiagnostic: (data) => request('/diagnostics/start', { method: 'POST', body: JSON.stringify(data) }),
  answerDiagnostic: (data) => request('/diagnostics/answer', { method: 'POST', body: JSON.stringify(data) }),
  runForwardChain: (data) => request('/diagnostics/forward-chain', { method: 'POST', body: JSON.stringify(data) }),
  runBackwardChain: (data) => request('/diagnostics/backward-chain', { method: 'POST', body: JSON.stringify(data) }),
  getSession: (id) => request(`/diagnostics/${id}`),
  getSessionExplanation: (id) => request(`/diagnostics/${id}/explanation`),

  // Rules
  getRules: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/rules${qs ? `?${qs}` : ''}`);
  },
  getRule: (id) => request(`/rules/${id}`),
  getRuleStats: () => request('/rules/stats'),

  // Reports
  getReports: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reports${qs ? `?${qs}` : ''}`);
  },
  getReport: (id) => request(`/reports/${id}`),
  compareReports: (a, b) => request(`/reports/compare?report_a=${a}&report_b=${b}`),
  downloadReportPdfUrl: (id) => `${API_BASE}/reports/${id}/pdf`,

  // Maintenance
  getMaintenance: (vehicleId) => request(`/maintenance${vehicleId ? `?vehicle_id=${vehicleId}` : ''}`),
  createMaintenance: (data) => request('/maintenance', { method: 'POST', body: JSON.stringify(data) }),
  updateMaintenance: (id, data) => request(`/maintenance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Demo
  getDemoScenarios: () => request('/demo/scenarios'),
  runDemoScenario: (data) => request('/demo/run', { method: 'POST', body: JSON.stringify(data) }),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),
};
