const API_BASE = '/api';

export const getAuthToken = () => localStorage.getItem('mbms_token');
export const setAuthToken = (token) => localStorage.setItem('mbms_token', token);
export const removeAuthToken = () => localStorage.removeItem('mbms_token');

export async function apiRequest(endpoint, method = 'GET', data = null, customHeaders = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (response.status === 401) {
    // If unauthorized, clear token and notify
    removeAuthToken();
    window.dispatchEvent(new Event('mbms_unauthorized'));
    throw new Error('Session expired or unauthorized. Please log in.');
  }

  if (!response.ok) {
    let errorMsg = `Error ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.message || errJson.Message) {
        errorMsg = errJson.message || errJson.Message;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  // If response is file blob
  const contentType = response.headers.get('content-type');
  if (contentType && (contentType.includes('text/csv') || contentType.includes('image/') || contentType.includes('application/pdf'))) {
    return await response.blob();
  }

  // Handle empty responses
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// Specific API Endpoints
export const AuthAPI = {
  login: (username, password) => apiRequest('/auth/login', 'POST', { username, password }),
  getCurrentUser: () => apiRequest('/auth/me', 'GET'),
};

export const TicketsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    return apiRequest(`/tickets?${query.toString()}`);
  },
  getById: (id) => apiRequest(`/tickets/${id}`),
  getByNumber: (ticketNumber) => apiRequest(`/tickets/number/${ticketNumber}`),
  create: (data) => apiRequest('/tickets', 'POST', data),
  assign: (id, mechanicId, remarks) => apiRequest(`/tickets/${id}/assign`, 'POST', { mechanicId, remarks }),
  accept: (id) => apiRequest(`/tickets/${id}/accept`, 'POST'),
  startWork: (id, remarks) => apiRequest(`/tickets/${id}/start-work`, 'POST', { remarks }),
  pauseWork: (id, reason, notes) => apiRequest(`/tickets/${id}/pause-work`, 'POST', { reason, notes }),
  resumeWork: (id, notes) => apiRequest(`/tickets/${id}/resume-work`, 'POST', { notes }),
  completeWork: (id, data) => apiRequest(`/tickets/${id}/complete-work`, 'POST', data),
  approve: (id, data) => apiRequest(`/tickets/${id}/approval`, 'POST', data),
  reopen: (id, reason) => apiRequest(`/tickets/${id}/reopen`, 'POST', { reason }),
  cancel: (id, reason) => apiRequest(`/tickets/${id}/cancel`, 'POST', { reason }),
  addComment: (id, commentText) => apiRequest(`/tickets/${id}/comments`, 'POST', { commentText }),
};

export const MastersAPI = {
  getDepartments: () => apiRequest('/masters/departments'),
  getSections: (departmentId) => apiRequest(`/masters/sections${departmentId ? `?departmentId=${departmentId}` : ''}`),
  getMachines: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    const qs = query.toString();
    return apiRequest(`/masters/machines${qs ? `?${qs}` : ''}`);
  },
  getMachineById: (id) => apiRequest(`/masters/machines/${id}`),
  getMachineByCode: (code) => apiRequest(`/masters/machines/code/${code}`),
  createMachine: (data) => apiRequest('/masters/machines', 'POST', data),
  updateMachine: (id, data) => apiRequest(`/masters/machines/${id}`, 'PUT', data),
  getCategories: () => apiRequest('/masters/categories'),
  getMechanics: (availableOnly) => apiRequest(`/masters/mechanics${availableOnly ? '?availableOnly=true' : ''}`),
  getSpareParts: (search) => apiRequest(`/masters/spare-parts${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  createSparePart: (data) => apiRequest('/masters/spare-parts', 'POST', data),
  bulkImportSpareParts: (parts) => apiRequest('/masters/spare-parts/bulk', 'POST', parts),
  getSparePartTransactions: (type, partId) => {
    const q = new URLSearchParams();
    if (type) q.append('type', type);
    if (partId) q.append('partId', partId);
    const qs = q.toString();
    return apiRequest(`/masters/spare-parts/transactions${qs ? `?${qs}` : ''}`);
  },
  addSparePartTransaction: (data) => apiRequest('/masters/spare-parts/transactions', 'POST', data),
  bulkImportMachines: (machines) => apiRequest('/masters/machines/bulk', 'POST', machines),
  getSupervisors: () => apiRequest('/masters/supervisors'),
  createSupervisor: (data) => apiRequest('/masters/supervisors', 'POST', data),
  bulkImportSupervisors: (supervisors) => apiRequest('/masters/supervisors/bulk', 'POST', supervisors),
  createMechanic: (data) => apiRequest('/masters/mechanics', 'POST', data),
  bulkImportMechanics: (mechanics) => apiRequest('/masters/mechanics/bulk', 'POST', mechanics),
  getShifts: () => apiRequest('/masters/shifts'),
};

export const ReportsAPI = {
  getDashboard: (fromDate, toDate) => {
    const q = new URLSearchParams();
    if (fromDate) q.append('fromDate', fromDate);
    if (toDate) q.append('toDate', toDate);
    return apiRequest(`/reports/dashboard?${q.toString()}`);
  },
  getMachines: (fromDate, toDate, departmentId) => {
    const q = new URLSearchParams();
    if (fromDate) q.append('fromDate', fromDate);
    if (toDate) q.append('toDate', toDate);
    if (departmentId) q.append('departmentId', departmentId);
    return apiRequest(`/reports/machines?${q.toString()}`);
  },
  getMechanics: (fromDate, toDate) => {
    const q = new URLSearchParams();
    if (fromDate) q.append('fromDate', fromDate);
    if (toDate) q.append('toDate', toDate);
    return apiRequest(`/reports/mechanics?${q.toString()}`);
  },
  getSla: (fromDate, toDate, priority) => {
    const q = new URLSearchParams();
    if (fromDate) q.append('fromDate', fromDate);
    if (toDate) q.append('toDate', toDate);
    if (priority) q.append('priority', priority);
    return apiRequest(`/reports/sla?${q.toString()}`);
  },
  getRepeatBreakdowns: (rollingDays = 30, minOccurrences = 2) =>
    apiRequest(`/reports/repeat-breakdowns?rollingDays=${rollingDays}&minOccurrences=${minOccurrences}`),
  getShifts: (fromDate, toDate) => {
    const q = new URLSearchParams();
    if (fromDate) q.append('fromDate', fromDate);
    if (toDate) q.append('toDate', toDate);
    return apiRequest(`/reports/shifts?${q.toString()}`);
  },
  exportCsvUrl: (reportType, fromDate, toDate) => {
    const q = new URLSearchParams({ reportType });
    if (fromDate) q.append('fromDate', fromDate);
    if (toDate) q.append('toDate', toDate);
    return `${API_BASE}/reports/export-csv?${q.toString()}`;
  }
};
