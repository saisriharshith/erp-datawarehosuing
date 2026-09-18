export type UserRole = 'ADMIN' | 'LECTURER';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  avatar_url?: string;
}

export interface Student {
  id: string;
  student_id: string;
  registration_number?: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  phone_number?: string;
  gender?: string;
  course_id: string;
  course_code?: string;
  course_title?: string;
  course?: { id?: string; course_code?: string; course_name?: string; title?: string };
  year: number;
  academic_year?: number;
  section: string;
  semester?: number;
  status: string;
  face_enrollment_status: 'PENDING' | 'ENROLLED';
  enrollment_status?: 'PENDING' | 'ENROLLED';
  enrolled_samples_count: number;
  embedding_count?: number;
  primary_photo_url?: string;
  created_at: string;
}

export interface StudentEnrollmentInfoResponse {
  student_id: string;
  enrolled_samples_count: number;
  target_required: number;
  photo_urls: string[];
  is_enrolled: boolean;
  samples?: any[];
}

export interface StudentDetail extends Student {
  attendance_percentage: number;
  total_classes: number;
  attended_classes: number;
  enrolled_photos: string[];
}

export interface Lecturer {
  id: string;
  user_id: string;
  staff_id: string;
  full_name: string;
  email: string;
  phone?: string;
  department: string;
  assigned_courses: string[];
  assigned_units: string[];
  assigned_course_names: string[];
  assigned_unit_names: string[];
  created_at: string;
}

export interface Course {
  id: string;
  course_code: string;
  title: string;
  department: string;
  credits: number;
  duration_years: number;
  is_active: boolean;
  units_count: number;
  enrolled_students_count: number;
  created_at: string;
}

export interface Unit {
  id: string;
  unit_code: string;
  name: string;
  course_id: string;
  course_code?: string;
  course_title?: string;
  credit_hours: number;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface Venue {
  id: string;
  venue_code: string;
  name: string;
  building: string;
  room_number: string;
  capacity: number;
  venue_type: 'LECTURE_HALL' | 'LABORATORY' | 'SEMINAR_ROOM' | 'AUDITORIUM';
  is_active: boolean;
  created_at: string;
}

export type SessionStatus = 'CREATED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface AttendanceSession {
  id: string;
  session_code: string;
  course_id: string;
  course_code?: string;
  course_title?: string;
  unit_id: string;
  unit_code?: string;
  unit_name?: string;
  venue_id: string;
  venue_code?: string;
  venue_name?: string;
  lecturer_id: string;
  lecturer_name?: string;
  status: SessionStatus;
  started_at?: string;
  ended_at?: string;
  total_present: number;
  notes?: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  student_name: string;
  student_registration_number: string;
  course_id: string;
  unit_id: string;
  venue_id: string;
  lecturer_id: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT';
  marked_at: string;
  similarity_score: number;
  liveness_score?: number;
  verified_method: string;
}

export interface DetectedFace {
  box: [number, number, number, number]; // [x1, y1, x2, y2]
  student_id?: string;
  student_name?: string;
  registration_number?: string;
  similarity_score: number;
  status: 'NEW_PRESENT' | 'ALREADY_MARKED' | 'UNKNOWN';
  is_live?: boolean;
  liveness_score?: number;
}

export interface RecognizeFrameResponse {
  session_id: string;
  faces: DetectedFace[];
  total_present: number;
  newly_marked_count: number;
  processing_time_ms: number;
}

export interface DailyTrendPoint {
  date: string;
  present: number;
  total_sessions: number;
  attendance_rate: number;
}

export interface CourseAttendanceStat {
  course_code: string;
  course_title: string;
  total_enrolled: number;
  attendance_rate: number;
}

export interface AdminAnalytics {
  total_students: number;
  total_lecturers: number;
  total_courses: number;
  total_units: number;
  active_sessions_now: number;
  today_sessions_count: number;
  today_attendance_percentage: number;
  today_present_count: number;
  today_absent_count: number;
  attendance_trends: DailyTrendPoint[];
  course_stats: CourseAttendanceStat[];
}

export interface LecturerAnalytics {
  assigned_courses_count: number;
  assigned_units_count: number;
  total_sessions_conducted: number;
  active_session_id?: string;
  average_attendance_percentage: number;
  recent_sessions: Array<{
    id: string;
    session_code: string;
    status: string;
    total_present: number;
    created_at: string;
  }>;
  unit_attendance_stats: Array<{
    unit_code: string;
    name: string;
    total_marked: number;
  }>;
}

export interface ReportRow {
  date: string;
  time: string;
  marked_at: string;
  student_id: string;
  student_name: string;
  course_code: string;
  unit_code: string;
  unit_name: string;
  venue_code: string;
  lecturer_name: string;
  session_code: string;
  status: string;
  similarity_score: number;
}

export interface ReportSummary {
  total_records: number;
  present_count: number;
  absent_count: number;
  attendance_percentage: number;
  records: ReportRow[];
}

export interface SystemSettings {
  face_similarity_threshold: number;
  min_enrollment_samples: number;
  max_enrollment_samples: number;
  liveness_enabled: boolean;
  liveness_threshold: number;
  model_name: string;
  environment: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  user_role?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  created_at: string;
}
