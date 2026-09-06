import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchAPI } from '../services/api';
import PrintableTranscriptModal from '../components/PrintableTranscriptModal';
import PrintableHallTicketModal from '../components/PrintableHallTicketModal';
import FeeReceiptModal from '../components/FeeReceiptModal';
import { getSubjectTitle } from '../utils/subjectMap';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function StudentPortal({ defaultTab = 'overview' }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const isDean = user?.role === 'ADMIN';

  // Normalize active tab (handle aliases like schedule -> timetable)
  const rawTab = searchParams.get('tab') || defaultTab || 'overview';
  const activeTab = rawTab === 'schedule' ? 'timetable' : rawTab;
  const setActiveTab = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  // Switch between Today, Week, and Exams in schedule/timetable
  const [scheduleViewMode, setScheduleViewMode] = useState('today'); // 'today' | 'week' | 'exams'

  // For Student: locked to own student ID.
  // For Dean: null initially (showing all-student master list), or set to specific student ID when inspecting.
  const [inspectedStudentId, setInspectedStudentId] = useState(
    isDean ? null : (user?.student_id || 'STU20220001')
  );

  // Master Student List State (for Dean inspection view)
  const [masterStudents, setMasterStudents] = useState([]);
  const [masterTotal, setMasterTotal] = useState(0);
  const [masterPage, setMasterPage] = useState(1);
  const [deptFilter, setDeptFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [masterLoading, setMasterLoading] = useState(false);

  // Single Student Profile State
  const [studentData, setStudentData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Modals
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [showHallTicketModal, setShowHallTicketModal] = useState(false);
  const [showFeeReceiptModal, setShowFeeReceiptModal] = useState(false);

  // Target CGPA Planner
  const [targetCgpa, setTargetCgpa] = useState(8.5);

  // Filters for sub-modules
  const [attendanceSemFilter, setAttendanceSemFilter] = useState('ALL');
  const [marksSemFilter, setMarksSemFilter] = useState('ALL');
  const [noticeCategoryFilter, setNoticeCategoryFilter] = useState('ALL');

  // Synchronize student ID with logged-in user
  useEffect(() => {
    if (!isDean && user?.student_id) {
      setInspectedStudentId(user.student_id);
    }
  }, [user, isDean]);

  // Load All Students Directory for Dean
  useEffect(() => {
    if (isDean && !inspectedStudentId) {
      setMasterLoading(true);
      let url = `/students?page=${masterPage}&limit=12&`;
      if (deptFilter) url += `department_id=${deptFilter}&`;
      if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;

      fetchAPI(url)
        .then(res => {
          setMasterStudents(res.students || []);
          setMasterTotal(res.total || 0);
        })
        .catch(err => {
          console.error(err);
          addToast('Failed to load students directory', 'danger');
        })
        .finally(() => setMasterLoading(false));
    }
  }, [isDean, inspectedStudentId, masterPage, deptFilter, searchTerm]);

  // Load Specific Student Data
  const loadStudentData = (sId) => {
    if (!sId) return;
    setProfileLoading(true);
    fetchAPI(`/student/portal-summary?student_id=${sId}`)
      .then(res => {
        setStudentData(res);
      })
      .catch(err => {
        console.error(err);
        addToast('Failed to load student academic records', 'danger');
      })
      .finally(() => setProfileLoading(false));
  };

  useEffect(() => {
    if (inspectedStudentId) {
      loadStudentData(inspectedStudentId);
    } else {
      setStudentData(null);
    }
  }, [inspectedStudentId]);

  // Static/Enriched Data for Schedule, Notices, and Timetable
  const todaySchedule = useMemo(() => [
    { time: '09:00 AM - 10:00 AM', code: 'CS501', title: 'Operating Systems & Virtualization', faculty: 'Dr. Sunita Deshmukh', room: 'Hall 204, CS Block', status: 'COMPLETED' },
    { time: '10:15 AM - 11:15 AM', code: 'CS401', title: 'Database Management Systems', faculty: 'Dr. Rajeshwar Rao', room: 'Lab 102, Tech Wing', status: 'IN_PROGRESS' },
    { time: '11:30 AM - 12:30 PM', code: 'MA201', title: 'Discrete Mathematics & Graph Theory', faculty: 'Prof. Ananya Sen', room: 'Hall 108, Science Block', status: 'UPCOMING' },
    { time: '02:00 PM - 03:30 PM', code: 'CS502', title: 'Computer Networks Laboratory', faculty: 'Prof. K. V. Reddy', room: 'Networks Lab 3', status: 'UPCOMING' }
  ], []);

  const weeklyTimetable = useMemo(() => [
    { day: 'Monday', slots: ['CS501 (Hall 204)', 'CS401 (Lab 102)', 'MA201 (Hall 108)', 'Lunch Break', 'CS502 Lab (Net Lab 3)'] },
    { day: 'Tuesday', slots: ['CS401 (Hall 204)', 'MA201 (Hall 108)', 'CS501 (Hall 204)', 'Lunch Break', 'Library / Seminar'] },
    { day: 'Wednesday', slots: ['CS501 (Hall 204)', 'CS401 (Lab 102)', 'CS503 (Hall 302)', 'Lunch Break', 'CS401 Lab (DB Lab 1)'] },
    { day: 'Thursday', slots: ['MA201 (Hall 108)', 'CS503 (Hall 302)', 'CS501 (Hall 204)', 'Lunch Break', 'Sports / Elective'] },
    { day: 'Friday', slots: ['CS503 (Hall 302)', 'CS401 (Hall 204)', 'MA201 (Hall 108)', 'Lunch Break', 'Mentoring / Counseling'] }
  ], []);

  const examSchedule = useMemo(() => [
    { date: 'Sep 18, 2026', day: 'Friday', time: '10:00 AM - 01:00 PM', code: 'CS401', title: 'Database Management Systems', venue: 'Exam Hall 3, Block B', seat: 'Desk B-42' },
    { date: 'Sep 21, 2026', day: 'Monday', time: '10:00 AM - 01:00 PM', code: 'CS501', title: 'Operating Systems & Virtualization', venue: 'Exam Hall 2, Block A', seat: 'Desk A-19' },
    { date: 'Sep 23, 2026', day: 'Wednesday', time: '10:00 AM - 01:00 PM', code: 'MA201', title: 'Discrete Mathematics & Graph Theory', venue: 'Auditorium West', seat: 'Desk W-08' },
    { date: 'Sep 25, 2026', day: 'Friday', time: '02:00 PM - 05:00 PM', code: 'CS502', title: 'Computer Networks & Security', venue: 'Exam Hall 3, Block B', seat: 'Desk B-42' },
    { date: 'Sep 28, 2026', day: 'Monday', time: '10:00 AM - 01:00 PM', code: 'CS503', title: 'Software Engineering & Agile', venue: 'Exam Hall 1, Block A', seat: 'Desk A-31' }
  ], []);

  const noticesList = useMemo(() => [
    {
      id: 101,
      title: 'Mandatory 75% Attendance Requirement for End-Sem Exam Hall Ticket',
      category: 'Academic',
      priority: 'HIGH',
      date: 'Sep 02, 2026',
      source: 'Office of the Dean (Academic Affairs)',
      description: 'As per university statutory regulations, students having aggregate attendance below 75% in any subject will not be issued Hall Tickets for the upcoming semester examinations without valid approved condonation.'
    },
    {
      id: 102,
      title: 'Mid-Term Assessment 2 Timetable & Hall Allocation Published',
      category: 'Examination',
      priority: 'HIGH',
      date: 'Aug 28, 2026',
      source: 'Controller of Examinations',
      description: 'The schedule for Continuous Internal Assessment II is now available on the portal. Examinations commence from September 18, 2026. Hall tickets will be available for download 5 days prior.'
    },
    {
      id: 103,
      title: 'Semester Term 2 Tuition Fee Remittance Deadline: Sep 15',
      category: 'Fees',
      priority: 'HIGH',
      date: 'Aug 24, 2026',
      source: 'Bursar & Finance Directorate',
      description: 'The last date for payment of term installment fees without late fine is September 15, 2026. Settle pending balances via online portal or Bursar office to avoid registration holds.'
    },
    {
      id: 104,
      title: 'Annual Inter-University Hackathon & Innovation Summit 2026',
      category: 'Events',
      priority: 'NORMAL',
      date: 'Aug 20, 2026',
      source: 'Department of Computer Science',
      description: 'Registrations are open for the 48-hour Annual Inter-University Hackathon. Cash awards of ₹1,50,000 to be won. Team project submissions close September 10, 2026.'
    },
    {
      id: 105,
      title: 'Campus Monsoon Advisory & Hybrid Learning Contingency',
      category: 'Emergency',
      priority: 'NORMAL',
      date: 'Aug 15, 2026',
      source: 'Registrar General',
      description: 'Heavy precipitation advisory issued by local authorities. All laboratory and theory classes will switch to hybrid mode if a regional red alert is issued.'
    }
  ], []);

  // Time-based greeting helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Initials Avatar
  const getInitials = (name = 'Student') => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (name[0] || 'S').toUpperCase();
  };

  // =========================================================================
  // VIEW: DEAN MASTER DIRECTORY SELECTOR (If logged in as Dean without selection)
  // =========================================================================
  if (isDean && !inspectedStudentId) {
    return (
      <div className="p-2 p-md-3">
        <div className="erp-card p-4 mb-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle mb-2 fw-semibold">
                <i className="bi bi-shield-lock-fill me-1"></i> Student Master Registry
              </span>
              <h3 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                Enrolled Students Directory ({masterTotal})
              </h3>
              <p className="mb-0 text-muted small">
                Select any enrolled student from the institutional register to inspect their full academic record, attendance compliance, marks, and fees.
              </p>
            </div>
            <div className="d-flex gap-2">
              <select
                className="form-select form-select-sm"
                value={deptFilter}
                onChange={e => { setDeptFilter(e.target.value); setMasterPage(1); }}
                style={{ width: '180px' }}
              >
                <option value="">All Departments</option>
                <option value="DEPT_CSE">Computer Science</option>
                <option value="DEPT_ECE">Electronics</option>
                <option value="DEPT_MECH">Mechanical</option>
                <option value="DEPT_CIVIL">Civil</option>
                <option value="DEPT_AIDS">AI & Data Science</option>
              </select>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setMasterPage(1); }}
                style={{ width: '200px' }}
              />
            </div>
          </div>
        </div>

        {masterLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted small">Loading institutional student register...</p>
          </div>
        ) : (
          <div className="row g-3">
            {masterStudents.map(s => (
              <div key={s.student_id} className="col-12 col-md-6 col-xl-4">
                <div
                  className="erp-card p-3 h-100 d-flex flex-column justify-content-between"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setInspectedStudentId(s.student_id)}
                >
                  <div>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="badge bg-light text-dark border font-mono">{s.student_id}</span>
                      <span className={`badge ${s.risk_level === 'HIGH' ? 'bg-danger-subtle text-danger border border-danger-subtle' : s.risk_level === 'MEDIUM' ? 'bg-warning-subtle text-warning border border-warning-subtle' : 'bg-success-subtle text-success border border-success-subtle'}`}>
                        {s.risk_level || 'LOW'} RISK
                      </span>
                    </div>
                    <h6 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>{s.full_name}</h6>
                    <div className="text-muted small mb-2">{s.department_name} • Semester {s.current_semester || s.semester}</div>
                    <div className="d-flex gap-3 small text-muted">
                      <span>Attendance: <strong>{s.attendance_percentage || 82}%</strong></span>
                      <span>CGPA: <strong>{s.cgpa || 8.1}</strong></span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-top text-end">
                    <span className="btn btn-sm btn-outline-primary" style={{ fontSize: '0.75rem' }}>
                      Inspect Academic Record <i className="bi bi-arrow-right ms-1"></i>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Loading state for single student profile
  if (profileLoading || !studentData) {
    return (
      <div className="p-4 text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted small">Loading personal academic workspace...</p>
      </div>
    );
  }

  const st = studentData.student || {};
  const att = studentData.attendance || studentData.summary_cards || {};
  const exams = studentData.examinations || {};
  const fees = studentData.fees || studentData.fee_summary || {};
  const lib = studentData.library || studentData.library_summary || {};
  const subjectRecords = studentData.subject_attendance || att.subject_records || [];
  const examRecords = studentData.examination_records || exams.exam_records || [];
  const sgpaTrend = studentData.sgpa_trend || [];

  // Derived Attendance Metrics
  const overallAttPct = Number(att.overall_percentage !== undefined ? att.overall_percentage : (studentData.summary_cards?.attendance_percentage ?? 0)).toFixed(1);
  const totalClasses = att.total_classes !== undefined ? att.total_classes : 0;
  const attendedClasses = att.classes_attended !== undefined ? att.classes_attended : 0;
  const missedClasses = Math.max(0, totalClasses - attendedClasses);

  // Shortfall & Attention Subjects
  const shortageSubjects = totalClasses > 0 ? subjectRecords.filter(s => (s.attendance_percentage || 0) < 75.0) : [];

  // Derived Academic Performance Metrics
  const currentCgpa = exams.cgpa !== undefined ? exams.cgpa : (studentData.summary_cards?.cgpa ?? 0.00);
  const currentSgpa = sgpaTrend.length ? sgpaTrend[sgpaTrend.length - 1].sgpa : 0.00;
  const totalCreditsCompleted = exams.total_credits ?? (examRecords.length > 0 ? examRecords.filter(e => e.is_passed && (e.total_marks || 0) > 0).reduce((sum, e) => sum + (e.credits || 0), 0) : 0);

  // Derived Fee Metrics
  const totalFeeAmount = fees.total_due || fees.total_fee || 85000;
  const paidFeeAmount = fees.total_paid !== undefined ? fees.total_paid : (fees.amount_paid || 0);
  const pendingFeeAmount = fees.outstanding_balance !== undefined ? fees.outstanding_balance : (totalFeeAmount - paidFeeAmount);
  const feeDueDate = fees.due_date || 'September 15, 2026';
  const feeStatus = fees.status || (pendingFeeAmount === 0 ? 'PAID' : paidFeeAmount > 0 ? 'PARTIAL' : 'PENDING');

  // Enrolled Subjects List for Subject Workspace (dynamic from subjectRecords)
  const registeredSubjects = subjectRecords.length > 0
    ? subjectRecords.map((s, idx) => ({
        code: s.subject_id,
        title: s.subject_name || `${st.department_name || 'Core'} Course (${s.subject_id})`,
        credits: s.credits || 4,
        faculty: s.faculty_name || 'Department Faculty',
        facultyRole: 'Course Instructor',
        type: s.type || 'Core Theory',
        attendance: s.attendance_percentage !== undefined ? Number(s.attendance_percentage) : 0,
        attended: s.classes_attended || 0,
        total: s.total_classes || 0,
        schedule: s.schedule || 'Mon, Wed, Fri • 10:00 AM - 11:00 AM',
        currentModule: (s.total_classes || 0) === 0 ? 'Module 1: Course Overview & Orientation' : `Module ${Math.min(5, Math.ceil((s.total_classes || 1) / 8))}: Core Topics`,
        pendingTask: (s.total_classes || 0) === 0 ? 'Register course workspace and obtain handbook' : 'Review lecture notes & submit problem sets',
        examDate: 'Oct 2026'
      }))
    : [
        {
          code: 'CS501',
          title: `${st.department_name || 'Department'} Core Course 1`,
          credits: 4,
          faculty: 'Faculty Instructor',
          facultyRole: 'Lead Instructor',
          type: 'Core Theory',
          attendance: 0.0,
          attended: 0,
          total: 0,
          schedule: 'Mon, Wed • 09:00 AM - 10:00 AM',
          currentModule: 'Module 1: Course Overview',
          pendingTask: 'Obtain course handbook',
          examDate: 'Oct 2026'
        }
      ];

  // Chart Data: SGPA Progression Across Semesters
  const sgpaChartData = {
    labels: sgpaTrend.length ? sgpaTrend.map(s => s.semester) : ['Semester 1 (In Progress)'],
    datasets: [
      {
        label: 'Semester SGPA',
        data: sgpaTrend.length ? sgpaTrend.map(s => s.sgpa) : [0.0],
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.12)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#4f46e5',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  };

  const sgpaChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 6.5,
        max: 10.0,
        ticks: { stepSize: 0.5, font: { size: 10 } },
        grid: { color: 'rgba(150, 150, 150, 0.12)' }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, weight: '600' } }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` SGPA: ${ctx.raw} / 10.0`
        }
      }
    }
  };

  // Calculations for Attendance Shortfall / Margin
  const calculateShortfall = (attended, total) => {
    const pct = (attended / total) * 100;
    if (pct < 75.0) {
      const needed = Math.max(0, Math.ceil((0.75 * total - attended) / 0.25));
      return { status: 'SHORTAGE', needed };
    } else {
      const safeToMiss = Math.max(0, Math.floor((attended - 0.75 * total) / 0.75));
      return { status: 'HEALTHY', safeToMiss };
    }
  };

  return (
    <div className="p-1 p-md-3">
      {/* 1. DEAN BACK-BAR (Only visible when Dean inspects a student) */}
      {isDean && (
        <div className="d-flex align-items-center justify-content-between p-3 mb-3 rounded-3 bg-primary text-white shadow-sm">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-shield-check fs-5"></i>
            <span className="small">
              Inspecting <strong>{st.full_name}</strong> ({st.student_id}) as Institutional Administrator
            </span>
          </div>
          <button
            className="btn btn-sm btn-light fw-bold"
            onClick={() => setInspectedStudentId(null)}
          >
            <i className="bi bi-arrow-left me-1"></i> Return to Registry
          </button>
        </div>
      )}

      {/* 2. TOP PERSONAL GREETING & IDENTITY BANNER */}
      <div
        className="erp-card p-4 mb-4"
        style={{
          background: 'linear-gradient(135deg, var(--surface-card) 0%, var(--surface-elevated) 100%)',
          borderColor: 'var(--border-color)'
        }}
      >
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          {/* Avatar & Student Info */}
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: '62px',
                height: '62px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: '800',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)'
              }}
            >
              {getInitials(st.full_name)}
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <h4 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                  {getGreeting()}, {st.full_name ? st.full_name.split(' ')[0] : 'Harshith'} 👋
                </h4>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle font-mono small">
                  {st.student_id || 'STU20220001'}
                </span>
              </div>
              <div className="d-flex flex-wrap align-items-center gap-2 text-muted small">
                <span><strong>{st.department_name || 'Computer Science & Engineering'}</strong></span>
                <span>•</span>
                <span>2nd Year</span>
                <span>•</span>
                <span>Semester {st.semester || st.current_semester || 3}</span>
                <span>•</span>
                <span>Section A</span>
              </div>
            </div>
          </div>

          {/* Direct Document Generation Actions */}
          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 py-2 px-3 fw-semibold"
              onClick={() => setShowTranscriptModal(true)}
            >
              <i className="bi bi-file-earmark-text-fill"></i>
              <span>Official Transcript</span>
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 py-2 px-3 fw-semibold"
              onClick={() => setShowHallTicketModal(true)}
            >
              <i className="bi bi-card-checklist"></i>
              <span>Exam Hall Ticket</span>
            </button>
            <button
              type="button"
              className="btn btn-sm btn-primary d-flex align-items-center gap-1 py-2 px-3 fw-semibold"
              onClick={() => setShowFeeReceiptModal(true)}
            >
              <i className="bi bi-receipt"></i>
              <span>Fee Receipt</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. NAVIGATION SUB-TABS */}
      <div className="d-flex flex-wrap gap-1 mb-4 pb-2 border-bottom overflow-auto" style={{ borderColor: 'var(--border-color)' }}>
        {[
          { key: 'overview', label: 'Overview', icon: 'bi-grid-fill' },
          { key: 'attendance', label: 'Attendance', icon: 'bi-calendar-check-fill' },
          { key: 'marks', label: 'Marks & Exams', icon: 'bi-journal-bookmark-fill' },
          { key: 'cgpa', label: 'SGPA / CGPA', icon: 'bi-graph-up-arrow' },
          { key: 'subjects', label: 'My Subjects', icon: 'bi-collection-fill' },
          { key: 'timetable', label: 'Timetable & Exams', icon: 'bi-clock-history' },
          { key: 'fees', label: 'Fees & Receipts', icon: 'bi-receipt' },
          { key: 'notices', label: 'Notices', icon: 'bi-megaphone-fill' },
          { key: 'documents', label: 'Printable Records', icon: 'bi-file-earmark-pdf-fill' },
          { key: 'profile', label: 'Student Profile', icon: 'bi-person-badge-fill' }
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`btn btn-sm d-flex align-items-center gap-2 px-3 py-2 rounded-pill fw-semibold transition-all ${
              activeTab === tab.key
                ? 'btn-primary text-white shadow-sm'
                : 'btn-light border'
            }`}
            style={{
              fontSize: '0.82rem',
              backgroundColor: activeTab === tab.key ? '#4f46e5' : 'var(--surface-elevated)',
              borderColor: activeTab === tab.key ? '#4f46e5' : 'var(--border-color)',
              color: activeTab === tab.key ? '#ffffff' : 'var(--text-secondary)'
            }}
            onClick={() => setActiveTab(tab.key)}
          >
            <i className={`bi ${tab.icon}`}></i>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* =================================================================== */}
      {/* SUB-VIEW 1: OVERVIEW (Answers: "How am I doing, What do I need to do, What's happening today?") */}
      {/* =================================================================== */}
      {activeTab === 'overview' && (
        <div className="d-flex flex-column gap-4">
          
          {/* SECTION A: "HOW AM I DOING?" (Academic Snapshot) */}
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0 text-uppercase tracking-wider text-muted small">
                <i className="bi bi-activity text-primary me-2"></i> Academic Snapshot • How Am I Doing?
              </h6>
              <span className="badge bg-light text-muted border small">Current Term Standing</span>
            </div>

            <div className="row g-3">
              {/* Stat Card 1: Attendance */}
              <div className="col-12 col-md-6 col-xl-3">
                <div className="erp-stat-card h-100 d-flex flex-column justify-content-between p-3">
                  <div>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="text-muted small fw-semibold">Attendance</span>
                      <span className={totalClasses === 0 ? 'badge bg-secondary-subtle text-secondary border' : (overallAttPct >= 75 ? 'status-badge-healthy' : 'status-badge-critical')}>
                        {totalClasses === 0 ? 'Classes Pending' : (overallAttPct >= 75 ? 'Good ✓' : 'Shortage ⚠')}
                      </span>
                    </div>
                    <div className="d-flex align-items-baseline gap-2">
                      <h2 className="fw-bold mb-0" style={{ color: totalClasses === 0 ? 'var(--text-primary)' : (overallAttPct >= 75 ? '#10b981' : '#ef4444') }}>
                        {overallAttPct}%
                      </h2>
                      <span className="text-muted small">aggregate</span>
                    </div>
                    <div className="attendance-progress my-2" style={{ height: '6px' }}>
                      <div
                        className="attendance-progress-fill"
                        style={{
                          width: `${Math.min(100, overallAttPct)}%`,
                          backgroundColor: totalClasses === 0 ? '#94a3b8' : (overallAttPct >= 75 ? '#10b981' : '#ef4444')
                        }}
                      />
                    </div>
                    <div className="d-flex justify-content-between text-muted small">
                      <span>Attended: <strong style={{ color: 'var(--text-primary)' }}>{attendedClasses}</strong> / {totalClasses}</span>
                      <span className="text-success fw-semibold">{totalClasses === 0 ? 'Good Standing' : (overallAttPct >= 75 ? 'Eligible' : 'Debarred')}</span>
                    </div>
                  </div>
                  <div className="pt-2 mt-2 border-top d-flex justify-content-between align-items-center">
                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>Min 75% statutory rule</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-decoration-none p-0 fw-semibold"
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => setActiveTab('attendance')}
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              </div>

              {/* Stat Card 2: CGPA */}
              <div className="col-12 col-md-6 col-xl-3">
                <div className="erp-stat-card h-100 d-flex flex-column justify-content-between p-3">
                  <div>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="text-muted small fw-semibold">Cumulative GPA</span>
                      <span className={`badge ${currentCgpa > 0 ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-secondary-subtle text-secondary border'}`}>
                        {currentCgpa > 0 ? '+0.31 ↑' : 'Term In Progress'}
                      </span>
                    </div>
                    <div className="d-flex align-items-baseline gap-2">
                      <h2 className="fw-bold mb-0 text-primary">
                        {currentCgpa}
                      </h2>
                      <span className="text-muted small">/ 10.0 CGPA</span>
                    </div>
                    <div className="text-muted small my-2">
                      Standing: <strong className={currentCgpa > 0 ? 'text-success' : 'text-muted'}>{currentCgpa > 0 ? 'First Class with Distinction' : 'Pending Evaluation / In Good Standing'}</strong>
                    </div>
                    <div className="d-flex justify-content-between text-muted small">
                      <span>Latest SGPA: <strong style={{ color: 'var(--text-primary)' }}>{currentSgpa > 0 ? currentSgpa : 'Pending'}</strong></span>
                      <span>Rank: <strong>{currentCgpa > 0 ? 'Top 5%' : 'Enrolled'}</strong></span>
                    </div>
                  </div>
                  <div className="pt-2 mt-2 border-top d-flex justify-content-between align-items-center">
                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>Calculated across {sgpaTrend.length} terms</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-decoration-none p-0 fw-semibold"
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => setActiveTab('cgpa')}
                    >
                      Progression →
                    </button>
                  </div>
                </div>
              </div>

              {/* Stat Card 3: Credits */}
              <div className="col-12 col-md-6 col-xl-3">
                <div className="erp-stat-card h-100 d-flex flex-column justify-content-between p-3">
                  <div>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="text-muted small fw-semibold">Academic Credits</span>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                        {totalCreditsCompleted > 0 ? 'Completed' : 'Enrolled'}
                      </span>
                    </div>
                    <div className="d-flex align-items-baseline gap-2">
                      <h2 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                        {totalCreditsCompleted}
                      </h2>
                      <span className="text-muted small">Credits (Semester {st.semester || 1})</span>
                    </div>
                    <div className="text-muted small my-2">
                      Cumulative Earned: <strong>{totalCreditsCompleted} / 160 Credits</strong>
                    </div>
                    <div className="d-flex justify-content-between text-muted small">
                      <span>Backlogs: <strong className="text-success">{exams.backlogs || 0} Active</strong></span>
                      <span>Audit: <strong className="text-success">{totalCreditsCompleted > 0 ? 'Cleared' : 'Registered'}</strong></span>
                    </div>
                  </div>
                  <div className="pt-2 mt-2 border-top d-flex justify-content-between align-items-center">
                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>B.Tech Degree Requirement</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-decoration-none p-0 fw-semibold"
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => setActiveTab('marks')}
                    >
                      Credit Audit →
                    </button>
                  </div>
                </div>
              </div>

              {/* Stat Card 4: Fee Standing */}
              <div className="col-12 col-md-6 col-xl-3">
                <div className="erp-stat-card h-100 d-flex flex-column justify-content-between p-3">
                  <div>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="text-muted small fw-semibold">Term Tuition & Fees</span>
                      <span className={`badge ${feeStatus === 'PAID' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning border border-warning-subtle'}`}>
                        {feeStatus === 'PAID' ? 'Settled' : 'Due Sep 15'}
                      </span>
                    </div>
                    <div className="d-flex align-items-baseline gap-2">
                      <h2 className="fw-bold mb-0" style={{ color: pendingFeeAmount === 0 ? '#10b981' : '#d97706' }}>
                        ₹{pendingFeeAmount.toLocaleString()}
                      </h2>
                      <span className="text-muted small">Pending Dues</span>
                    </div>
                    <div className="text-muted small my-2">
                      Total Billed: ₹{totalFeeAmount.toLocaleString()} • Paid: ₹{paidFeeAmount.toLocaleString()}
                    </div>
                    <div className="text-muted small">
                      Due Date: <strong className="text-danger">{feeDueDate}</strong>
                    </div>
                  </div>
                  <div className="pt-2 mt-2 border-top d-flex justify-content-between align-items-center">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary py-0 px-2"
                      style={{ fontSize: '0.72rem' }}
                      onClick={() => setShowFeeReceiptModal(true)}
                    >
                      <i className="bi bi-download me-1"></i> Receipt
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-decoration-none p-0 fw-semibold"
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => setActiveTab('fees')}
                    >
                      Fee Ledger →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION B: "WHAT DO I NEED TO DO?" (Intelligent Attention Required Banner) */}
          <div
            className="p-3 p-md-4 rounded-4 border"
            style={{
              backgroundColor: shortageSubjects.length > 0 ? 'rgba(239, 68, 68, 0.03)' : 'rgba(79, 70, 229, 0.03)',
              borderColor: shortageSubjects.length > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(79, 70, 229, 0.15)'
            }}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <span
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: shortageSubjects.length > 0 ? '#fee2e2' : '#e0e7ff',
                    color: shortageSubjects.length > 0 ? '#dc2626' : '#4338ca',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}
                >
                  {shortageSubjects.length > 0 ? '⚡' : '📌'}
                </span>
                <div>
                  <h6 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                    Action Items & Term Status
                  </h6>
                  <span className="text-muted small">Items requiring your attention, attendance compliance, or deadline settlement</span>
                </div>
              </div>
              <span className={`badge ${shortageSubjects.length > 0 ? 'bg-danger-subtle text-danger border border-danger-subtle' : 'bg-primary-subtle text-primary border border-primary-subtle'} fw-semibold`}>
                {shortageSubjects.length > 0 ? 'High Priority' : 'In Good Standing'}
              </span>
            </div>

            <div className="row g-3">
              {/* Action Item 1: Attendance Compliance or Onboarding Status */}
              <div className="col-12 col-md-4">
                {shortageSubjects.length > 0 ? (
                  <div className="p-3 rounded-3 border bg-white shadow-sm h-100 d-flex flex-column justify-content-between" style={{ borderColor: 'rgba(239, 68, 68, 0.25)' }}>
                    <div>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className="badge bg-danger text-white small">
                          <i className="bi bi-exclamation-triangle-fill me-1"></i> Attendance Shortage
                        </span>
                        <span className="fw-bold text-danger font-mono small">{shortageSubjects[0].attendance_percentage}%</span>
                      </div>
                      <h6 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {shortageSubjects[0].subject_name || shortageSubjects[0].subject_id}
                      </h6>
                      <p className="text-muted small mb-2" style={{ lineHeight: '1.4' }}>
                        Current attendance is <strong>{shortageSubjects[0].attendance_percentage}%</strong> ({shortageSubjects[0].classes_attended}/{shortageSubjects[0].total_classes} classes). You need to attend the <strong>next consecutive classes</strong> to reach the mandatory 75% exam hall-ticket eligibility threshold.
                      </p>
                    </div>
                    <div className="pt-2 border-top d-flex justify-content-between align-items-center">
                      <span className="text-danger small fw-semibold">Shortfall Alert</span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger py-1 px-2 fw-semibold"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => setActiveTab('attendance')}
                      >
                        View Attendance →
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-3 border bg-white shadow-sm h-100 d-flex flex-column justify-content-between" style={{ borderColor: 'rgba(59, 130, 246, 0.25)' }}>
                    <div>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle small">
                          <i className="bi bi-info-circle-fill me-1"></i> Academic Status
                        </span>
                        <span className="fw-bold text-success font-mono small">{totalClasses === 0 ? 'Term Starting' : 'Compliant'}</span>
                      </div>
                      <h6 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {totalClasses === 0 ? 'Course Roster Active' : 'Satisfactory Attendance'}
                      </h6>
                      <p className="text-muted small mb-2" style={{ lineHeight: '1.4' }}>
                        {totalClasses === 0
                          ? `Enrolled for Semester ${st.semester || 1} coursework. Class attendance tracking and continuous evaluations will reflect here once faculty conduct sessions.`
                          : 'Your attendance satisfies university statutory exam regulations across all registered courses.'}
                      </p>
                    </div>
                    <div className="pt-2 border-top d-flex justify-content-between align-items-center">
                      <span className="text-success small fw-semibold">Good Standing</span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary py-1 px-2 fw-semibold"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => setActiveTab('subjects')}
                      >
                        View Courses →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Item 2: Fee Due Reminder */}
              <div className="col-12 col-md-4">
                <div className="p-3 rounded-3 border bg-white shadow-sm h-100 d-flex flex-column justify-content-between" style={{ borderColor: pendingFeeAmount > 0 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)' }}>
                  <div>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className={`badge ${pendingFeeAmount > 0 ? 'bg-warning text-dark' : 'bg-success text-white'} small`}>
                        <i className={`bi ${pendingFeeAmount > 0 ? 'bi-cash-stack' : 'bi-check-circle-fill'} me-1`}></i> {pendingFeeAmount > 0 ? 'Fee Due Reminder' : 'Fee Status'}
                      </span>
                      <span className={`fw-bold font-mono small ${pendingFeeAmount > 0 ? 'text-danger' : 'text-success'}`}>₹{pendingFeeAmount.toLocaleString()}</span>
                    </div>
                    <h6 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                      {pendingFeeAmount > 0 ? 'Term Tuition Installment Pending' : 'Semester Fees Fully Settled'}
                    </h6>
                    <p className="text-muted small mb-2" style={{ lineHeight: '1.4' }}>
                      {pendingFeeAmount > 0
                        ? `An outstanding fee balance of ₹${pendingFeeAmount.toLocaleString()} is due on or before ${feeDueDate}. Settle dues to avoid late penalty charges.`
                        : 'All tuition and laboratory charges for the current academic session have been settled with zero arrears.'}
                    </p>
                  </div>
                  <div className="pt-2 border-top d-flex justify-content-between align-items-center">
                    <span className="text-muted small">{pendingFeeAmount > 0 ? 'Due in 9 days' : 'Cleared'}</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-warning text-dark py-1 px-2 fw-semibold"
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => setActiveTab('fees')}
                    >
                      View Fees & Pay →
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Item 3: New Notice Alert */}
              <div className="col-12 col-md-4">
                <div className="p-3 rounded-3 border bg-white shadow-sm h-100 d-flex flex-column justify-content-between" style={{ borderColor: 'rgba(79, 70, 229, 0.25)' }}>
                  <div>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="badge bg-primary text-white small">
                        <i className="bi bi-bell-fill me-1"></i> New Notice Published
                      </span>
                      <span className="badge bg-light text-dark border small">Sep 02</span>
                    </div>
                    <h6 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                      Mid-Term Assessment 2 Timetable
                    </h6>
                    <p className="text-muted small mb-2" style={{ lineHeight: '1.4' }}>
                      Official examination dates and allocated examination centers for Mid-Term Assessment 2 have been declared. Commences from September 18, 2026.
                    </p>
                  </div>
                  <div className="pt-2 border-top d-flex justify-content-between align-items-center">
                    <span className="text-muted small">Academic Notice</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary py-1 px-2 fw-semibold"
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => setActiveTab('timetable')}
                    >
                      View Exam Schedule →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION C: "WHAT IS HAPPENING TODAY?" (Today's Live Schedule with Today / Week Switch) */}
          <div className="row g-3">
            {/* Left Col: Interactive Schedule with Today / Week Toggle */}
            <div className="col-12 col-lg-7">
              <div className="erp-card p-4 h-100">
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3 pb-2 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                  <div>
                    <h6 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                      <i className="bi bi-calendar2-week text-primary me-2"></i> What's Happening Today
                    </h6>
                    <span className="text-muted small">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Interactive Today / Week Switch */}
                  <div className="btn-group btn-group-sm p-1 rounded-pill bg-light border" role="group">
                    <button
                      type="button"
                      className={`btn btn-sm rounded-pill px-3 fw-semibold ${scheduleViewMode === 'today' ? 'btn-primary text-white shadow-sm' : 'btn-light border-0 text-muted'}`}
                      onClick={() => setScheduleViewMode('today')}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm rounded-pill px-3 fw-semibold ${scheduleViewMode === 'week' ? 'btn-primary text-white shadow-sm' : 'btn-light border-0 text-muted'}`}
                      onClick={() => setScheduleViewMode('week')}
                    >
                      Week
                    </button>
                  </div>
                </div>

                {scheduleViewMode === 'today' ? (
                  <div className="d-flex flex-column gap-3">
                    {todaySchedule.map((cls, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-3 border d-flex justify-content-between align-items-center transition-all"
                        style={{
                          backgroundColor: cls.status === 'IN_PROGRESS' ? 'rgba(79, 70, 229, 0.06)' : 'var(--surface-elevated)',
                          borderColor: cls.status === 'IN_PROGRESS' ? '#4f46e5' : 'var(--border-color)'
                        }}
                      >
                        <div className="d-flex align-items-start gap-3">
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '10px',
                              backgroundColor: cls.status === 'IN_PROGRESS' ? '#4f46e5' : cls.status === 'COMPLETED' ? 'var(--border-color)' : 'rgba(79, 70, 229, 0.1)',
                              color: cls.status === 'IN_PROGRESS' ? '#ffffff' : cls.status === 'COMPLETED' ? 'var(--text-secondary)' : '#4f46e5',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              fontSize: '0.85rem'
                            }}
                          >
                            {cls.code.slice(0, 4)}
                          </div>
                          <div>
                            <div className="d-flex align-items-center gap-2">
                              <h6 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                                {cls.title}
                              </h6>
                              <span className="badge bg-light text-dark border font-mono small">
                                {cls.code}
                              </span>
                            </div>
                            <div className="text-muted small mt-1">
                              <i className="bi bi-person me-1"></i> {cls.faculty} • <i className="bi bi-geo-alt me-1"></i> {cls.room}
                            </div>
                          </div>
                        </div>

                        <div className="text-end">
                          <div className="font-mono small fw-bold" style={{ color: 'var(--text-primary)' }}>
                            {cls.time}
                          </div>
                          <span
                            className={`badge mt-1 ${
                              cls.status === 'COMPLETED'
                                ? 'bg-secondary'
                                : cls.status === 'IN_PROGRESS'
                                ? 'bg-primary'
                                : 'bg-light text-dark border'
                            }`}
                            style={{ fontSize: '0.7rem' }}
                          >
                            {cls.status === 'IN_PROGRESS' ? '● In Progress' : cls.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Mini Weekly Schedule View */
                  <div className="table-responsive">
                    <table className="table table-bordered align-middle text-center small mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Day</th>
                          <th>09:00 - 10:00</th>
                          <th>10:15 - 11:15</th>
                          <th>11:30 - 12:30</th>
                          <th>01:30 - 03:00</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weeklyTimetable.map((row, idx) => (
                          <tr key={idx}>
                            <td className="fw-bold bg-light" style={{ color: 'var(--text-primary)' }}>{row.day}</td>
                            <td><div className="p-1 rounded bg-light border small">{row.slots[0]}</div></td>
                            <td><div className="p-1 rounded bg-light border small">{row.slots[1]}</div></td>
                            <td><div className="p-1 rounded bg-light border small">{row.slots[2]}</div></td>
                            <td><div className="p-1 rounded bg-primary-subtle text-primary border border-primary-subtle fw-semibold small">{row.slots[4]}</div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Academic Progression Curve & Quick Target CGPA */}
            <div className="col-12 col-lg-5">
              <div className="erp-card p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h6 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                        <i className="bi bi-graph-up-arrow text-primary me-2"></i> SGPA Progression Curve
                      </h6>
                      <span className="text-muted small">Continuous academic grade progression</span>
                    </div>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle fw-bold">
                      CGPA: {currentCgpa}
                    </span>
                  </div>

                  <div style={{ height: '200px' }}>
                    <Line data={sgpaChartData} options={sgpaChartOptions} />
                  </div>
                </div>

                <div className="pt-3 mt-3 border-top">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="small fw-bold" style={{ color: 'var(--text-primary)' }}>Target Graduation CGPA: {targetCgpa}</div>
                      <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                        Required SGPA in remaining semesters: <strong className="text-primary font-mono">8.55</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary fw-semibold"
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => setActiveTab('cgpa')}
                    >
                      Target Planner →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION D: REGISTERED SUBJECTS PREVIEW */}
          <div className="erp-card p-4">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <h6 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                  <i className="bi bi-collection-fill text-primary me-2"></i> Registered Subjects • Semester 3
                </h6>
                <span className="text-muted small">Direct workspace access to all currently registered courses</span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary fw-semibold"
                style={{ fontSize: '0.75rem' }}
                onClick={() => setActiveTab('subjects')}
              >
                View Full Subject Workspace ({registeredSubjects.length}) →
              </button>
            </div>

            <div className="row g-3">
              {registeredSubjects.slice(0, 3).map((sub, idx) => (
                <div key={idx} className="col-12 col-md-4">
                  <div className="p-3 rounded-3 border h-100 d-flex flex-column justify-content-between" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border-color)' }}>
                    <div>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className="badge bg-light text-dark border font-mono">{sub.code}</span>
                        <span className={sub.attendance >= 75 ? 'status-badge-healthy' : 'status-badge-critical'}>
                          {sub.attendance}%
                        </span>
                      </div>
                      <h6 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>{sub.title}</h6>
                      <div className="text-muted small mb-2">{sub.faculty}</div>
                      <p className="text-muted mb-2" style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                        {sub.pendingTask}
                      </p>
                    </div>
                    <div className="pt-2 border-top d-flex justify-content-between align-items-center">
                      <span className="text-muted font-mono" style={{ fontSize: '0.72rem' }}>{sub.credits} Credits</span>
                      <button
                        type="button"
                        className="btn btn-sm btn-link p-0 text-decoration-none fw-semibold"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => setActiveTab('subjects')}
                      >
                        Workspace →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-VIEW 2: ATTENDANCE (Detailed Table + Shortfall/Margin Calculator) */}
      {/* =================================================================== */}
      {activeTab === 'attendance' && (
        <div className="d-flex flex-column gap-4">
          {/* Top KPI Cards */}
          <div className="row g-3">
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="erp-stat-card">
                <span className="text-muted small">Aggregate Attendance</span>
                <h3 className="fw-bold my-1" style={{ color: overallAttPct >= 75 ? '#10b981' : '#ef4444' }}>
                  {overallAttPct}%
                </h3>
                <span className={overallAttPct >= 75 ? 'status-badge-healthy' : 'status-badge-critical'}>
                  {overallAttPct >= 75 ? 'Eligible for End-Sem' : 'Debarment Notice Risk'}
                </span>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="erp-stat-card">
                <span className="text-muted small">Total Lectures Conducted</span>
                <h3 className="fw-bold my-1" style={{ color: 'var(--text-primary)' }}>{totalClasses}</h3>
                <span className="badge bg-light text-muted border">Term Lectures</span>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="erp-stat-card">
                <span className="text-muted small">Lectures Attended</span>
                <h3 className="fw-bold my-1 text-success">{attendedClasses}</h3>
                <span className="badge bg-success-subtle text-success border border-success-subtle">Present Record</span>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="erp-stat-card">
                <span className="text-muted small">Classes Missed</span>
                <h3 className="fw-bold my-1 text-danger">{missedClasses}</h3>
                <span className="badge bg-danger-subtle text-danger border border-danger-subtle">Absent Count</span>
              </div>
            </div>
          </div>

          {/* Subject-Wise Detailed Attendance Table with Shortfall / Margin Calculator */}
          <div className="erp-card p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-2 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <h5 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  <i className="bi bi-calendar-check-fill text-primary me-2"></i> Subject Attendance Roster & Shortfall Calculator
                </h5>
                <span className="text-muted small">
                  Live subject attendance tracking with dynamic calculation of classes needed to reach 75% statutory compliance
                </span>
              </div>

              {/* Semester Filter */}
              <select
                className="form-select form-select-sm"
                value={attendanceSemFilter}
                onChange={e => setAttendanceSemFilter(e.target.value)}
                style={{ width: '160px' }}
              >
                <option value="ALL">All Semesters</option>
                <option value="3">Semester 3 (Current)</option>
                <option value="2">Semester 2</option>
                <option value="1">Semester 1</option>
              </select>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small">
                  <tr>
                    <th>Subject Code & Title</th>
                    <th className="text-center">Present</th>
                    <th className="text-center">Absent</th>
                    <th className="text-center">Total</th>
                    <th className="text-center">Attendance %</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Shortfall / Safe Margin</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {registeredSubjects.map((sub, idx) => {
                    const calc = calculateShortfall(sub.attended, sub.total);
                    const isZero = sub.total === 0;
                    const isLow = !isZero && sub.attendance < 75.0;

                    return (
                      <tr key={idx}>
                        <td>
                          <div className="fw-bold" style={{ color: 'var(--text-primary)' }}>{sub.title}</div>
                          <span className="font-mono text-muted" style={{ fontSize: '0.72rem' }}>{sub.code} • {sub.faculty}</span>
                        </td>
                        <td className="text-center text-success fw-bold font-mono">{sub.attended}</td>
                        <td className="text-center text-danger fw-bold font-mono">{Math.max(0, sub.total - sub.attended)}</td>
                        <td className="text-center font-mono">{sub.total}</td>
                        <td className="text-center">
                          <div className="d-flex align-items-center justify-content-center gap-2">
                            <span className={`fw-bold font-mono ${isZero ? 'text-muted' : (isLow ? 'text-danger' : 'text-success')}`}>{sub.attendance}%</span>
                            <div style={{ width: '60px', height: '6px' }} className="attendance-progress">
                              <div
                                className="attendance-progress-fill"
                                style={{ width: `${Math.min(100, sub.attendance)}%`, backgroundColor: isZero ? '#cbd5e1' : (isLow ? '#ef4444' : '#10b981') }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="text-center">
                          <span className={isZero ? 'badge bg-secondary-subtle text-secondary border' : (!isLow ? 'status-badge-healthy' : 'status-badge-critical')}>
                            {isZero ? 'Not Commenced' : (!isLow ? 'Satisfied' : 'Shortage')}
                          </span>
                        </td>
                        <td className="text-center">
                          {isZero ? (
                            <span className="badge bg-light text-muted border px-2 py-1">
                              Classes pending commencement
                            </span>
                          ) : isLow ? (
                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
                              ⚠ Need {calc.needed} more consecutive classes for 75%
                            </span>
                          ) : (
                            <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                              ✓ Can safely miss {calc.safeToMiss} class(es)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 rounded-3 bg-light border small text-muted">
              <strong>University Attendance Regulation:</strong> Minimum 75% aggregate attendance in theory and laboratory coursework is compulsory for hall-ticket eligibility under Section 14(B) of the Academic Ordinance. Condonation up to 10% is permitted strictly on substantiated medical grounds upon Dean approval.
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-VIEW 3: MARKS & EXAMS MODULE */}
      {/* =================================================================== */}
      {activeTab === 'marks' && (
        <div className="d-flex flex-column gap-4">
          <div className="row g-3">
            <div className="col-12 col-sm-4">
              <div className="erp-stat-card">
                <span className="text-muted small">Cumulative GPA</span>
                <h3 className="fw-bold my-1 text-primary">{currentCgpa} / 10.0</h3>
                <span className="badge bg-success-subtle text-success border border-success-subtle">Top 5% Cohort</span>
              </div>
            </div>
            <div className="col-12 col-sm-4">
              <div className="erp-stat-card">
                <span className="text-muted small">Active Backlogs</span>
                <h3 className="fw-bold my-1 text-success">0</h3>
                <span className="badge bg-success-subtle text-success border border-success-subtle">All Courses Cleared</span>
              </div>
            </div>
            <div className="col-12 col-sm-4">
              <div className="erp-stat-card">
                <span className="text-muted small">Earned Credits</span>
                <h3 className="fw-bold my-1" style={{ color: 'var(--text-primary)' }}>68</h3>
                <span className="badge bg-light text-muted border">Towards 160 Total</span>
              </div>
            </div>
          </div>

          <div className="erp-card p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-2 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <h5 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  <i className="bi bi-journal-bookmark-fill text-primary me-2"></i> Semester Marks & Assessment Ledger
                </h5>
                <span className="text-muted small">
                  Continuous internal assessments, mid-term examinations, laboratory evaluations, and awarded letter grades
                </span>
              </div>

              {/* Semester Filter */}
              <select
                className="form-select form-select-sm"
                value={marksSemFilter}
                onChange={e => setMarksSemFilter(e.target.value)}
                style={{ width: '160px' }}
              >
                <option value="ALL">All Semesters</option>
                <option value="3">Semester 3</option>
                <option value="2">Semester 2</option>
                <option value="1">Semester 1</option>
              </select>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small">
                  <tr>
                    <th>Subject Code & Title</th>
                    <th>Term</th>
                    <th className="text-center">Internal (30)</th>
                    <th className="text-center">Midterm (20)</th>
                    <th className="text-center">Assignment (10)</th>
                    <th className="text-center">End-Sem (40)</th>
                    <th className="text-center">Total (100)</th>
                    <th className="text-center">Grade</th>
                    <th className="text-center">Grade Points</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {(examRecords.length > 0 ? examRecords : registeredSubjects).map((ex, idx) => {
                    const internal = ex.internal_marks_scored ?? ex.internal_marks ?? 0;
                    const midterm = ex.midterm_marks ?? 0;
                    const assignment = ex.assignment_marks ?? 0;
                    const endsem = ex.end_semester_marks_scored ?? ex.external_marks ?? 0;
                    const total = ex.total_marks ?? (internal + midterm + assignment + endsem);
                    const grade = ex.grade_letter || (total > 0 ? (total >= 80 ? 'A+' : 'B') : '-');
                    const pts = ex.grade_point !== undefined ? Number(ex.grade_point).toFixed(1) : (total > 0 ? '7.0' : '0.0');

                    return (
                      <tr key={idx}>
                        <td>
                          <div className="fw-bold" style={{ color: 'var(--text-primary)' }}>{ex.subject_name || ex.title}</div>
                          <span className="font-mono text-muted" style={{ fontSize: '0.72rem' }}>{ex.subject_id || ex.code}</span>
                        </td>
                        <td>Sem {ex.semester || st.semester || 1}</td>
                        <td className="text-center font-mono">{internal}</td>
                        <td className="text-center font-mono">{midterm}</td>
                        <td className="text-center font-mono">{assignment}</td>
                        <td className="text-center font-mono">{endsem}</td>
                        <td className="text-center font-mono fw-bold text-primary">{total}</td>
                        <td className="text-center">
                          <span className={`badge ${grade === 'O' ? 'bg-success' : grade === '-' || total === 0 ? 'badge bg-secondary-subtle text-secondary border' : 'bg-primary'}`}>
                            {grade === '-' || total === 0 ? 'Pending' : grade}
                          </span>
                        </td>
                        <td className="text-center font-mono fw-bold">{pts}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-VIEW 4: SGPA / CGPA PROGRESSION */}
      {/* =================================================================== */}
      {activeTab === 'cgpa' && (
        <div className="d-flex flex-column gap-4">
          <div className="row g-3">
            <div className="col-12 col-lg-8">
              <div className="erp-card p-4 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                      <i className="bi bi-graph-up-arrow text-primary me-2"></i> Semester SGPA Progression
                    </h5>
                    <span className="text-muted small">Grade point average performance curve across completed terms</span>
                  </div>
                  <div className="text-end">
                    <span className="text-muted small d-block">Current Cumulative GPA</span>
                    <h3 className="fw-bold text-primary mb-0">{currentCgpa} / 10.0</h3>
                  </div>
                </div>
                <div style={{ height: '260px' }}>
                  <Line data={sgpaChartData} options={sgpaChartOptions} />
                </div>
              </div>
            </div>

            {/* Target CGPA Goal Planner */}
            <div className="col-12 col-lg-4">
              <div className="erp-card p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <h6 className="fw-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                    <i className="bi bi-bullseye text-warning me-2"></i> Target CGPA Goal Planner
                  </h6>
                  <p className="text-muted small">
                    Adjust target graduation GPA to compute the required average SGPA for your remaining semesters.
                  </p>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between small fw-bold mb-1">
                      <span>Target Graduation CGPA:</span>
                      <span className="text-primary font-mono fs-6">{targetCgpa}</span>
                    </div>
                    <input
                      type="range"
                      className="form-range"
                      min="7.0"
                      max="10.0"
                      step="0.1"
                      value={targetCgpa}
                      onChange={e => setTargetCgpa(parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="p-3 rounded-3 bg-light border small">
                    <div className="text-muted mb-1">Required Future SGPA:</div>
                    <div className="fw-bold fs-4 text-success font-mono">
                      {Math.min(10.0, Math.max(6.0, Number((targetCgpa * 8 - currentCgpa * (sgpaTrend.length || 3)) / Math.max(1, 8 - (sgpaTrend.length || 3))).toFixed(2)))}
                    </div>
                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                      Across remaining {Math.max(1, 8 - (sgpaTrend.length || 3))} semesters to graduate with {targetCgpa} CGPA.
                    </span>
                  </div>
                </div>
                <div className="pt-3 border-top mt-3 text-muted small">
                  <strong>Formula:</strong> CGPA = Σ(SGPA × Credits) / Σ(Credits)
                </div>
              </div>
            </div>
          </div>

          {/* Semester Credit Audit Ledger */}
          <div className="erp-card p-4">
            <h6 className="fw-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              Semester Performance & Credit Ledger
            </h6>
            <div className="table-responsive">
              <table className="table table-bordered align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Semester Term</th>
                    <th className="text-center">SGPA Scored</th>
                    <th className="text-center">Credits Registered</th>
                    <th className="text-center">Credits Earned</th>
                    <th className="text-center">Cumulative Credits</th>
                    <th className="text-center">Backlogs</th>
                    <th className="text-center">Standing</th>
                  </tr>
                </thead>
                <tbody>
                  {(sgpaTrend.length > 0
                    ? sgpaTrend.map((s, idx) => ({
                        term: s.semester,
                        sgpa: s.sgpa,
                        reg: 22,
                        earned: 22,
                        cum: (idx + 1) * 22,
                        backlogs: 0,
                        standing: 'First Class with Distinction'
                      }))
                    : [
                        { term: `Semester ${st.semester || 1} (Current Term)`, sgpa: 'Pending', reg: 22, earned: 0, cum: 0, backlogs: 0, standing: 'Term In Progress' }
                      ]
                  ).map((row, idx) => (
                    <tr key={idx}>
                      <td className="fw-bold" style={{ color: 'var(--text-primary)' }}>{row.term}</td>
                      <td className="text-center font-mono fw-bold text-primary">{row.sgpa}</td>
                      <td className="text-center font-mono">{row.reg}</td>
                      <td className="text-center font-mono text-success">{row.earned}</td>
                      <td className="text-center font-mono fw-semibold">{row.cum}</td>
                      <td className="text-center font-mono text-success">{row.backlogs}</td>
                      <td className="text-center">
                        <span className={`badge ${row.standing === 'Term In Progress' ? 'badge bg-secondary-subtle text-secondary border' : 'bg-success-subtle text-success border border-success-subtle'}`}>
                          {row.standing}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-VIEW 5: MY SUBJECTS (Subject Workspace) */}
      {/* =================================================================== */}
      {activeTab === 'subjects' && (
        <div className="d-flex flex-column gap-4">
          <div className="erp-card p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-2 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <h5 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  <i className="bi bi-collection-fill text-primary me-2"></i> Registered Courses Workspace
                </h5>
                <span className="text-muted small">
                  Enrolled subjects for Semester {st.semester || 1} with instructors, class timings, syllabus modules, and attendance status
                </span>
              </div>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 fw-semibold">
                {registeredSubjects.length} Courses Registered • {registeredSubjects.reduce((s, c) => s + (c.credits || 4), 0)} Total Credits
              </span>
            </div>

            <div className="row g-4">
              {registeredSubjects.map((sub, idx) => {
                const calc = calculateShortfall(sub.attended, sub.total);
                const isZero = sub.total === 0;
                const isLow = !isZero && sub.attendance < 75.0;

                return (
                  <div key={idx} className="col-12 col-md-6 col-xl-4">
                    <div
                      className="erp-card p-4 h-100 d-flex flex-column justify-content-between"
                      style={{
                        borderColor: isLow ? 'rgba(239, 68, 68, 0.35)' : 'var(--border-color)',
                        backgroundColor: isLow ? 'rgba(239, 68, 68, 0.015)' : 'var(--surface-card)'
                      }}
                    >
                      <div>
                        {/* Header Badges */}
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-light text-dark border font-mono fw-bold">{sub.code}</span>
                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle">{sub.credits} Credits</span>
                          </div>
                          <span className={isZero ? 'badge bg-secondary-subtle text-secondary border' : (!isLow ? 'status-badge-healthy' : 'status-badge-critical')}>
                            {isZero ? 'Pending' : `${sub.attendance}%`}
                          </span>
                        </div>

                        {/* Title & Instructor */}
                        <h6 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>{sub.title}</h6>
                        <div className="text-muted small mb-3">
                          <i className="bi bi-person-badge text-primary me-1"></i> {sub.faculty} <span className="text-muted" style={{ fontSize: '0.72rem' }}>({sub.facultyRole})</span>
                        </div>

                        {/* Attendance Progress */}
                        <div className="mb-3">
                          <div className="d-flex justify-content-between text-muted small mb-1">
                            <span>Attendance Progress</span>
                            <span className={`fw-bold font-mono ${isZero ? 'text-muted' : (isLow ? 'text-danger' : 'text-success')}`}>
                              {sub.attended} / {sub.total} Classes
                            </span>
                          </div>
                          <div className="attendance-progress" style={{ height: '6px' }}>
                            <div
                              className="attendance-progress-fill"
                              style={{ width: `${Math.min(100, sub.attendance)}%`, backgroundColor: isZero ? '#cbd5e1' : (isLow ? '#ef4444' : '#10b981') }}
                            />
                          </div>
                          {isZero ? (
                            <div className="text-muted small mt-1" style={{ fontSize: '0.72rem' }}>
                              Academic sessions pending commencement
                            </div>
                          ) : isLow ? (
                            <div className="text-danger small mt-1" style={{ fontSize: '0.72rem' }}>
                              ⚠ Attend next {calc.needed} classes consecutively for 75%
                            </div>
                          ) : (
                            <div className="text-success small mt-1" style={{ fontSize: '0.72rem' }}>
                              ✓ Safe (can miss up to {calc.safeToMiss} classes)
                            </div>
                          )}
                        </div>

                        {/* Schedule & Module Info */}
                        <div className="p-3 rounded-3 bg-light border mb-3 small">
                          <div className="mb-1 text-muted">
                            <i className="bi bi-clock text-primary me-1"></i> <strong>Schedule:</strong> {sub.schedule}
                          </div>
                          <div className="mb-1 text-muted">
                            <i className="bi bi-bookmark-check text-primary me-1"></i> <strong>Active Topic:</strong> {sub.currentModule}
                          </div>
                          <div className="text-muted">
                            <i className="bi bi-calendar-event text-warning me-1"></i> <strong>Task:</strong> {sub.pendingTask}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-top d-flex justify-content-between align-items-center">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => setActiveTab('attendance')}
                        >
                          Attendance
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => setActiveTab('marks')}
                        >
                          Grades
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => setActiveTab('timetable')}
                        >
                          Schedule
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-VIEW 6: TIMETABLE & EXAMINATIONS */}
      {/* =================================================================== */}
      {activeTab === 'timetable' && (
        <div className="d-flex flex-column gap-4">
          {/* Segmented Switch */}
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                <i className="bi bi-clock-history text-primary me-2"></i> Class Timetable & Examination Schedule
              </h5>
              <span className="text-muted small">Semester 3 Section A • Academic Calendar 2026</span>
            </div>

            <div className="btn-group p-1 rounded-pill bg-light border" role="group">
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3 fw-semibold ${scheduleViewMode === 'today' ? 'btn-primary text-white' : 'btn-light border-0 text-muted'}`}
                onClick={() => setScheduleViewMode('today')}
              >
                Today's Schedule
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3 fw-semibold ${scheduleViewMode === 'week' ? 'btn-primary text-white' : 'btn-light border-0 text-muted'}`}
                onClick={() => setScheduleViewMode('week')}
              >
                Weekly Matrix
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3 fw-semibold ${scheduleViewMode === 'exams' ? 'btn-primary text-white' : 'btn-light border-0 text-muted'}`}
                onClick={() => setScheduleViewMode('exams')}
              >
                Exam Schedule
              </button>
            </div>
          </div>

          {scheduleViewMode === 'today' && (
            <div className="erp-card p-4">
              <h6 className="fw-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                Today's Chronological Lectures
              </h6>
              <div className="d-flex flex-column gap-3">
                {todaySchedule.map((cls, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-3 border d-flex justify-content-between align-items-center"
                    style={{
                      backgroundColor: cls.status === 'IN_PROGRESS' ? 'rgba(79, 70, 229, 0.06)' : 'var(--surface-elevated)',
                      borderColor: cls.status === 'IN_PROGRESS' ? '#4f46e5' : 'var(--border-color)'
                    }}
                  >
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-light text-dark border font-mono small">{cls.code}</span>
                        <h6 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>{cls.title}</h6>
                      </div>
                      <div className="text-muted small mt-1">
                        Instructor: <strong>{cls.faculty}</strong> • Location: <strong>{cls.room}</strong>
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="font-mono small fw-bold">{cls.time}</div>
                      <span className={`badge mt-1 ${cls.status === 'COMPLETED' ? 'bg-secondary' : cls.status === 'IN_PROGRESS' ? 'bg-primary' : 'bg-light text-dark border'}`}>
                        {cls.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {scheduleViewMode === 'week' && (
            <div className="erp-card p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>Weekly Lecture Matrix</h6>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => window.print()}>
                  <i className="bi bi-printer me-1"></i> Print Timetable
                </button>
              </div>
              <div className="table-responsive">
                <table className="table table-bordered align-middle text-center small mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Day</th>
                      <th>09:00 - 10:00</th>
                      <th>10:15 - 11:15</th>
                      <th>11:30 - 12:30</th>
                      <th className="bg-light text-muted">12:30 - 01:30</th>
                      <th>01:30 - 03:00</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyTimetable.map((row, idx) => (
                      <tr key={idx}>
                        <td className="fw-bold bg-light" style={{ color: 'var(--text-primary)' }}>{row.day}</td>
                        <td><div className="p-2 rounded border bg-light small">{row.slots[0]}</div></td>
                        <td><div className="p-2 rounded border bg-light small">{row.slots[1]}</div></td>
                        <td><div className="p-2 rounded border bg-light small">{row.slots[2]}</div></td>
                        <td className="bg-light text-muted fst-italic">Lunch Break</td>
                        <td><div className="p-2 rounded border bg-primary-subtle text-primary border-primary-subtle fw-semibold small">{row.slots[4]}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {scheduleViewMode === 'exams' && (
            <div className="erp-card p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                    Upcoming Mid-Term Examination Timetable
                  </h6>
                  <span className="text-muted small">Official schedule by Controller of Examinations</span>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => setShowHallTicketModal(true)}
                >
                  <i className="bi bi-card-checklist me-1"></i> Print Hall Ticket
                </button>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 small">
                  <thead className="table-light">
                    <tr>
                      <th>Date & Day</th>
                      <th>Session Time</th>
                      <th>Subject Code & Title</th>
                      <th>Venue Hall</th>
                      <th>Assigned Desk</th>
                      <th className="text-center">Admit Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examSchedule.map((ex, idx) => (
                      <tr key={idx}>
                        <td className="fw-bold" style={{ color: 'var(--text-primary)' }}>
                          {ex.date} <span className="text-muted fw-normal">({ex.day})</span>
                        </td>
                        <td className="font-mono">{ex.time}</td>
                        <td>
                          <div className="fw-bold">{ex.title}</div>
                          <span className="text-muted font-mono">{ex.code}</span>
                        </td>
                        <td>{ex.venue}</td>
                        <td className="font-mono fw-bold text-primary">{ex.seat}</td>
                        <td className="text-center">
                          <span className="badge bg-success-subtle text-success border border-success-subtle">
                            Verified & Eligible
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-VIEW 7: FEES & RECEIPTS */}
      {/* =================================================================== */}
      {activeTab === 'fees' && (
        <div className="d-flex flex-column gap-4">
          <div className="row g-3">
            <div className="col-12 col-sm-4">
              <div className="erp-stat-card">
                <span className="text-muted small">Total Academic Fees Billed</span>
                <h3 className="fw-bold my-1 text-primary">₹{totalFeeAmount.toLocaleString()}</h3>
                <span className="badge bg-light text-muted border">Annual Schedule</span>
              </div>
            </div>
            <div className="col-12 col-sm-4">
              <div className="erp-stat-card">
                <span className="text-muted small">Total Remitted & Settled</span>
                <h3 className="fw-bold my-1 text-success">₹{paidFeeAmount.toLocaleString()}</h3>
                <span className="badge bg-success-subtle text-success border border-success-subtle">Payment Confirmed</span>
              </div>
            </div>
            <div className="col-12 col-sm-4">
              <div className="erp-stat-card">
                <span className="text-muted small">Outstanding Balance Dues</span>
                <h3 className="fw-bold my-1 text-danger">₹{pendingFeeAmount.toLocaleString()}</h3>
                <span className="badge bg-danger-subtle text-danger border border-danger-subtle">Due: {feeDueDate}</span>
              </div>
            </div>
          </div>

          <div className="erp-card p-4">
            <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <h5 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  <i className="bi bi-receipt text-primary me-2"></i> Payment History & Remittance Ledger
                </h5>
                <span className="text-muted small">Official transaction ledger of tuition, laboratory, and examination fee payments</span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-primary d-flex align-items-center gap-1"
                onClick={() => setShowFeeReceiptModal(true)}
              >
                <i className="bi bi-file-earmark-arrow-down-fill"></i>
                <span>Download Official Fee Receipt</span>
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Payment Date</th>
                    <th>Transaction ID</th>
                    <th>Fee Component</th>
                    <th>Payment Method</th>
                    <th className="text-end">Amount Paid</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(fees.transactions && fees.transactions.length > 0 ? fees.transactions : []).map((txn, idx) => (
                    <tr key={idx}>
                      <td>{txn.payment_date || '2026-08-14'}</td>
                      <td className="font-mono text-primary fw-bold">{txn.txn_id || `TXN_${idx + 1}`}</td>
                      <td>{txn.description || 'Semester Tuition Fee Installment'}</td>
                      <td>Online NetBanking (Institutional Payment Portal)</td>
                      <td className="text-end font-mono fw-bold">₹{(txn.amount || 0).toLocaleString()}</td>
                      <td className="text-center">
                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                          {txn.status || 'CONFIRMED'}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-sm btn-link p-0 text-decoration-none"
                          onClick={() => setShowFeeReceiptModal(true)}
                        >
                          <i className="bi bi-file-pdf text-danger fs-6"></i> Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!fees.transactions || fees.transactions.length === 0) && (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">
                        <i className="bi bi-info-circle me-1"></i> No fee payments recorded yet. Outstanding term balance: <strong className="text-danger">₹{pendingFeeAmount.toLocaleString()}</strong>.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-VIEW 8: NOTICES & CIRCULARS */}
      {/* =================================================================== */}
      {activeTab === 'notices' && (
        <div className="d-flex flex-column gap-4">
          <div className="erp-card p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-2 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <h5 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  <i className="bi bi-megaphone-fill text-primary me-2"></i> University Notices & Circulars
                </h5>
                <span className="text-muted small">Official notices from Academic Affairs, Controller of Examinations, and Student Services</span>
              </div>

              {/* Category Filter */}
              <div className="d-flex flex-wrap gap-1">
                {['ALL', 'Academic', 'Examination', 'Fees', 'Events', 'Emergency'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    className={`btn btn-sm rounded-pill px-3 py-1 ${noticeCategoryFilter === cat ? 'btn-primary' : 'btn-light border'}`}
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => setNoticeCategoryFilter(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="d-flex flex-column gap-3">
              {noticesList
                .filter(n => noticeCategoryFilter === 'ALL' || n.category === noticeCategoryFilter)
                .map(n => (
                  <div key={n.id} className="p-3 rounded-3 border" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border-color)' }}>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-secondary text-white small">{n.category}</span>
                        <span className={`badge ${n.priority === 'HIGH' ? 'bg-danger text-white' : 'bg-light text-dark border'} small`}>
                          {n.priority} PRIORITY
                        </span>
                        <span className="text-muted small"><i className="bi bi-clock me-1"></i> {n.date}</span>
                      </div>
                      <span className="text-muted small fst-italic">{n.source}</span>
                    </div>
                    <h6 className="fw-bold mb-2" style={{ color: 'var(--text-primary)' }}>{n.title}</h6>
                    <p className="text-muted small mb-0" style={{ lineHeight: '1.5' }}>{n.description}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-VIEW 9: PRINTABLE DOCUMENTS */}
      {/* =================================================================== */}
      {activeTab === 'documents' && (
        <div className="d-flex flex-column gap-4">
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <div className="erp-card p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="fs-1 text-primary mb-3"><i className="bi bi-file-earmark-text-fill"></i></div>
                  <h5 className="fw-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Official Grade Transcript
                  </h5>
                  <p className="text-muted small">
                    Certified statement of marks, grade points, and credits earned across all completed semesters, verified by the Controller of Examinations.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary d-flex align-items-center justify-content-center gap-2"
                  onClick={() => setShowTranscriptModal(true)}
                >
                  <i className="bi bi-printer-fill"></i>
                  <span>Print Grade Transcript</span>
                </button>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="erp-card p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="fs-1 text-warning mb-3"><i className="bi bi-card-checklist"></i></div>
                  <h5 className="fw-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Examination Hall Ticket
                  </h5>
                  <p className="text-muted small">
                    Official examination admit card with assigned seating center, timetable, desk number, and statutory candidate instructions.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-primary d-flex align-items-center justify-content-center gap-2"
                  onClick={() => setShowHallTicketModal(true)}
                >
                  <i className="bi bi-printer-fill"></i>
                  <span>Print Hall Ticket</span>
                </button>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="erp-card p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="fs-1 text-success mb-3"><i className="bi bi-receipt"></i></div>
                  <h5 className="fw-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Fee Payment Receipt
                  </h5>
                  <p className="text-muted small">
                    Official institutional receipt confirming settlement of tuition, laboratory, and campus service fees with official verification watermark.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-success d-flex align-items-center justify-content-center gap-2"
                  onClick={() => setShowFeeReceiptModal(true)}
                >
                  <i className="bi bi-download"></i>
                  <span>Download Fee Receipt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-VIEW 10: STUDENT PROFILE */}
      {/* =================================================================== */}
      {activeTab === 'profile' && (
        <div className="erp-card p-4">
          <h5 className="fw-bold mb-4 pb-2 border-bottom" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
            <i className="bi bi-person-badge-fill text-primary me-2"></i> Official Student Profile
          </h5>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="text-muted small fw-semibold">Full Legal Name</label>
              <div className="p-2 rounded bg-light border fw-bold" style={{ color: 'var(--text-primary)' }}>{st.full_name || 'Harshith Kontham'}</div>
            </div>
            <div className="col-12 col-md-6">
              <label className="text-muted small fw-semibold">Institutional Registration ID</label>
              <div className="p-2 rounded bg-light border font-mono fw-bold text-primary">{st.student_id || 'STU20220001'}</div>
            </div>
            <div className="col-12 col-md-6">
              <label className="text-muted small fw-semibold">Degree & Major</label>
              <div className="p-2 rounded bg-light border">Bachelor of Technology in Computer Science & Engineering</div>
            </div>
            <div className="col-12 col-md-6">
              <label className="text-muted small fw-semibold">Academic Year & Term</label>
              <div className="p-2 rounded bg-light border">2nd Year • Semester 3 • Section A</div>
            </div>
            <div className="col-12 col-md-6">
              <label className="text-muted small fw-semibold">Institutional Email</label>
              <div className="p-2 rounded bg-light border">{st.email || 'harshith@college.edu'}</div>
            </div>
            <div className="col-12 col-md-6">
              <label className="text-muted small fw-semibold">Contact Phone</label>
              <div className="p-2 rounded bg-light border font-mono">{st.phone || '+91-9876543210'}</div>
            </div>
            <div className="col-12 col-md-6">
              <label className="text-muted small fw-semibold">Department / School</label>
              <div className="p-2 rounded bg-light border">{st.department_name || 'Department of Computer Science & Engineering'}</div>
            </div>
            <div className="col-12 col-md-6">
              <label className="text-muted small fw-semibold">Faculty Mentor / Advisor</label>
              <div className="p-2 rounded bg-light border">Dr. Sunita Deshmukh (Office: Block B, Room 204)</div>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showTranscriptModal && (
        <PrintableTranscriptModal
          student={st}
          exams={examRecords}
          summaryCards={{ cgpa: currentCgpa, totalCredits: totalCreditsCompleted, backlogs: 0 }}
          onClose={() => setShowTranscriptModal(false)}
        />
      )}

      {showHallTicketModal && (
        <PrintableHallTicketModal
          student={st}
          exams={examRecords}
          onClose={() => setShowHallTicketModal(false)}
        />
      )}

      {showFeeReceiptModal && (
        <FeeReceiptModal
          student={st}
          fees={fees}
          onClose={() => setShowFeeReceiptModal(false)}
        />
      )}
    </div>
  );
}
