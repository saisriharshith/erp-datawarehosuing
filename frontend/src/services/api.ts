/**
 * Centralized API Service Client
 * Handles authentication header injection, error handling, and typed API endpoints.
 */

const API_BASE = '/api/v1';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please log in again.');
    }

    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();
    if (!response.ok) {
      const errorMsg = data?.error?.message || data?.detail || 'An error occurred';
      throw new Error(errorMsg);
    }

    return data as T;
  }

  // Auth
  async login(credentials: { email: string; password: string }) {
    return this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  async changePassword(data: { old_password: string; new_password: string }) {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Students
  async getStudents(params: { page?: number; page_size?: number; search?: string; course_id?: string; enrollment_status?: string } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.page_size) query.append('page_size', params.page_size.toString());
    if (params.search) query.append('search', params.search);
    if (params.course_id) query.append('course_id', params.course_id);
    if (params.enrollment_status) query.append('enrollment_status', params.enrollment_status);
    return this.request<any>(`/students?${query.toString()}`);
  }

  async createStudent(student: any) {
    return this.request<any>('/students', {
      method: 'POST',
      body: JSON.stringify(student),
    });
  }

  async getStudent(id: string) {
    return this.request<any>(`/students/${id}`);
  }

  async updateStudent(id: string, updates: any) {
    return this.request<any>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteStudent(id: string) {
    return this.request<void>(`/students/${id}`, {
      method: 'DELETE',
    });
  }

  // Face Enrollment
  async enrollSample(studentId: string, imageBase64: string, sampleIndex: number) {
    return this.request<any>(`/enrollment/${studentId}/samples`, {
      method: 'POST',
      body: JSON.stringify({
        image_base64: imageBase64,
        sample_index: sampleIndex,
      }),
    });
  }

  async getEnrollmentInfo(studentId: string) {
    return this.request<any>(`/enrollment/${studentId}/info`);
  }

  async deleteEnrollment(studentId: string) {
    return this.request<void>(`/enrollment/${studentId}`, {
      method: 'DELETE',
    });
  }

  // Lecturers
  async getLecturers() {
    return this.request<any[]>('/lecturers');
  }

  async createLecturer(lecturer: any) {
    return this.request<any>('/lecturers', {
      method: 'POST',
      body: JSON.stringify(lecturer),
    });
  }

  async updateLecturer(id: string, updates: any) {
    return this.request<any>(`/lecturers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async getMyAssignments() {
    return this.request<{ courses: any[]; units: any[]; venues: any[] }>('/lecturers/me/assignments');
  }

  // Academic Entities
  async getCourses(activeOnly = false) {
    return this.request<any[]>(`/courses?active_only=${activeOnly}`);
  }

  async createCourse(course: any) {
    return this.request<any>('/courses', {
      method: 'POST',
      body: JSON.stringify(course),
    });
  }

  async deleteCourse(id: string) {
    return this.request<void>(`/courses/${id}`, {
      method: 'DELETE',
    });
  }

  async getUnits(courseId?: string) {
    const q = courseId ? `?course_id=${courseId}` : '';
    return this.request<any[]>(`/units${q}`);
  }

  async createUnit(unit: any) {
    return this.request<any>('/units', {
      method: 'POST',
      body: JSON.stringify(unit),
    });
  }

  async deleteUnit(id: string) {
    return this.request<void>(`/units/${id}`, {
      method: 'DELETE',
    });
  }

  async getVenues() {
    return this.request<any[]>('/venues');
  }

  async createVenue(venue: any) {
    return this.request<any>('/venues', {
      method: 'POST',
      body: JSON.stringify(venue),
    });
  }

  async deleteVenue(id: string) {
    return this.request<void>(`/venues/${id}`, {
      method: 'DELETE',
    });
  }

  // Attendance Sessions & Real-Time Recognition
  async getSessions(params: { status?: string; course_id?: string; unit_id?: string } = {}) {
    const q = new URLSearchParams();
    if (params.status) q.append('status', params.status);
    if (params.course_id) q.append('course_id', params.course_id);
    if (params.unit_id) q.append('unit_id', params.unit_id);
    return this.request<any[]>(`/attendance/sessions?${q.toString()}`);
  }

  async getSession(id: string) {
    return this.request<any>(`/attendance/sessions/${id}`);
  }

  async createSession(session: { course_id: string; unit_id: string; venue_id: string; notes?: string }) {
    return this.request<any>('/attendance/sessions', {
      method: 'POST',
      body: JSON.stringify(session),
    });
  }

  async startSession(id: string) {
    return this.request<any>(`/attendance/sessions/${id}/start`, {
      method: 'POST',
    });
  }

  async stopSession(id: string) {
    return this.request<any>(`/attendance/sessions/${id}/stop`, {
      method: 'POST',
    });
  }

  async recognizeFrame(sessionId: string, imageBase64: string) {
    return this.request<any>(`/attendance/sessions/${sessionId}/recognize`, {
      method: 'POST',
      body: JSON.stringify({ image_base64: imageBase64 }),
    });
  }

  async getSessionRecords(sessionId: string) {
    return this.request<any[]>(`/attendance/sessions/${sessionId}/records`);
  }

  // Analytics
  async getAdminAnalytics() {
    return this.request<any>('/analytics/admin');
  }

  async getLecturerAnalytics() {
    return this.request<any>('/analytics/lecturer');
  }

  // Reports
  async getReportData(filters: any = {}) {
    const q = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) q.append(k, String(v));
    });
    return this.request<any>(`/reports/attendance?${q.toString()}`);
  }

  getExportUrl(format: 'csv' | 'excel' | 'pdf', filters: any = {}): string {
    const q = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) q.append(k, String(v));
    });
    return `${API_BASE}/reports/export/${format}?${q.toString()}`;
  }

  async downloadReport(format: 'csv' | 'excel' | 'pdf', filters: any = {}) {
    const q = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) q.append(k, String(v));
    });
    const url = `${API_BASE}/reports/export/${format}?${q.toString()}`;
    const token = this.getToken();
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      throw new Error('Failed to download report');
    }
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `attendance_report.${format === 'excel' ? 'xlsx' : format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  }

  // Admin Settings & Audit
  async getSettings() {
    return this.request<any>('/admin/settings');
  }

  async updateSettings(settings: any) {
    return this.request<any>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async getAuditLogs(limit = 50) {
    return this.request<any[]>(`/admin/audit-logs?limit=${limit}`);
  }
}

export const api = new ApiClient();
