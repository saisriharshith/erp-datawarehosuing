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
import { Line, Bar } from 'react-chartjs-2';

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

export default function StudentPortal() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const isDean = user?.role === 'ADMIN';

  // Active sub-module tab from URL: 'overview' | 'attendance' | 'marks' | 'cgpa' | 'schedule' | 'fees' | 'notices' | 'documents'
  const activeTab = searchParams.get('tab') || 'overview';
  const setActiveTab = (tabName) => {
    setSearchParams({ tab: tabName });
  };

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

  // Static/Fallback Data for Schedule, Notices, and Timetable
  const todaySchedule = useMemo(() => [
    { time: '09:00 AM - 10:00 AM', code: 'CS501', title: 'Operating Systems', faculty: 'Dr. Sunita Deshmukh', room: 'Hall 204, CS Block', status: 'COMPLETED' },
    { time: '10:15 AM - 11:15 AM', code: 'CS401', title: 'Database Management Systems', faculty: 'Dr. Rajeshwar Rao', room: 'Lab 102, Tech Wing', status: 'IN_PROGRESS' },
    { time: '11:30 AM - 12:30 PM', code: 'MA301', title: 'Discrete Mathematical Structures', faculty: 'Prof. Ananya Sen', room: 'Hall 108, Science Block', status: 'UPCOMING' },
    { time: '02:00 PM - 03:30 PM', code: 'CS502', title: 'Computer Networks Laboratory', faculty: 'Prof. K. V. Reddy', room: 'Networks Lab 3', status: 'UPCOMING' }
  ], []);

  const noticesList = useMemo(() => [
    {
      id: 101,
      title: 'Mandatory 75% Attendance Requirement for End-Sem Exam Admit Card',
      category: 'Academic',
      priority: 'HIGH',
      date: 'Sep 02, 2026',
      description: 'As per university statutory regulation, students having aggregate attendance below 75% will not be issued Hall Tickets for the upcoming semester examinations.'
    },
    {
      id: 102,
      title: 'Mid-Term Assessment 2 Timetable Published',
      category: 'Examination',
      priority: 'NORMAL',
      date: 'Aug 28, 2026',
      description: 'The schedule for Continuous Internal Assessment II is now available. Examinations commence from September 18, 2026.'
    },
    {
      id: 103,
      title: 'Semester Tuition Fee Remittance Deadline',
      category: 'Fees',
      priority: 'HIGH',
      date: 'Aug 24, 2026',
      description: 'The last date for payment of term installment fees without late fine is September 15, 2026. Settle pending balances via online portal or Bursar office.'
    },
    {
      id: 104,
      title: 'Campus Hackathon & Technology Symposium 2026',
      category: 'Events',
      priority: 'NORMAL',
      date: 'Aug 20, 2026',
      description: 'Registration opens for the annual Inter-University Technical Symposium. Team submissions close September 10, 2026.'
    },
    {
      id: 105,
      title: 'Campus Emergency Protocol & Monsoon Advisory',
      category: 'Emergency',
      priority: 'HIGH',
      date: 'Aug 15, 2026',
      description: 'Heavy precipitation advisory issued by local meteorological department. Classes operate under hybrid online schedule if red alert is issued.'
    }
  ], []);

  const weeklyTimetable = useMemo(() => [
    { day: 'Monday', slots: ['CS501 (Hall 204)', 'CS401 (Lab 102)', 'MA301 (Hall 108)', 'Lunch Break', 'CS502 Lab (Net Lab 3)'] },
    { day: 'Tuesday', slots: ['CS401 (Hall 204)', 'MA301 (Hall 108)', 'CS501 (Hall 204)', 'Lunch Break', 'Library / Seminar'] },
    { day: 'Wednesday', slots: ['CS501 (Hall 204)', 'CS401 (Lab 102)', 'CS503 (Hall 302)', 'Lunch Break', 'CS401 Lab (DB Lab 1)'] },
    { day: 'Thursday', slots: ['MA301 (Hall 108)', 'CS503 (Hall 302)', 'CS501 (Hall 204)', 'Lunch Break', 'Sports / Elective'] },
    { day: 'Friday', slots: ['CS503 (Hall 302)', 'CS401 (Hall 204)', 'MA301 (Hall 108)', 'Lunch Break', 'Mentoring / Counseling'] }
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
      <div className="p-3 p-md-4">
        <div className="p-4 rounded-4 mb-4 border" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-color)' }}>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <span className="badge bg-primary text-white mb-2 fw-semibold">
                <i className="bi bi-shield-lock-fill me-1"></i> Admin Inspection View (All Records)
              </span>
              <h3 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                University Student 360 Hub ({masterTotal} Enrolled)
              </h3>
              <p className="mb-0 text-muted small">
                Select any enrolled student from the master register to inspect their full academic record, attendance compliance, marks, and fees.
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
                      Inspect 360 Hub <i className="bi bi-arrow-right ms-1"></i>
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
        <p className="mt-2 text-muted small">Loading complete student academic record...</p>
      </div>
    );
  }

  const st = studentData.student || {};
  const att = studentData.attendance || {};
  const exams = studentData.examinations || {};
  const fees = studentData.fees || {};
  const sgpaTrend = studentData.sgpa_trend || [];
  const subjectRecords = att.subject_records || [];
  const examRecords = exams.exam_records || [];

  // Derived Attendance Metrics
  const overallAttPct = Number(att.overall_percentage || 78.4).toFixed(1);
  const totalClasses = att.total_classes || 120;
  const attendedClasses = att.classes_attended || Math.round(totalClasses * (overallAttPct / 100));
  const missedClasses = totalClasses - attendedClasses;
  const remainingClasses = Math.max(0, 160 - totalClasses);
  const shortageSubjects = subjectRecords.filter(s => (s.attendance_percentage || 0) < 75.0);

  // Derived Academic Performance Metrics
  const currentCgpa = exams.cgpa || 8.42;
  const currentSgpa = sgpaTrend.length ? sgpaTrend[sgpaTrend.length - 1].sgpa : 8.5;
  const prevSgpa = sgpaTrend.length > 1 ? sgpaTrend[sgpaTrend.length - 2].sgpa : 8.1;
  const highestSgpa = sgpaTrend.length ? Math.max(...sgpaTrend.map(s => s.sgpa)) : 8.5;

  // Derived Fee Metrics
  const totalFeeAmount = fees.total_fee || fees.total_due || 120000;
  const paidFeeAmount = fees.amount_paid || fees.total_paid || 90000;
  const pendingFeeAmount = fees.outstanding_balance !== undefined ? fees.outstanding_balance : (totalFeeAmount - paidFeeAmount);
  const feeDueDate = fees.due_date || 'September 15, 2026';
  const feeStatus = pendingFeeAmount === 0 ? 'PAID' : paidFeeAmount > 0 ? 'PARTIAL' : 'OVERDUE';

  // Chart Data: SGPA Progression Across Semesters
  const sgpaChartData = {
    labels: sgpaTrend.map(s => s.semester),
    datasets: [
      {
        label: 'SGPA Progression',
        data: sgpaTrend.map(s => s.sgpa),
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#4f46e5',
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ]
  };

  const sgpaChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 6.0,
        max: 10.0,
        ticks: { stepSize: 0.5, font: { size: 10 } },
        grid: { color: 'rgba(150, 150, 150, 0.15)' }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` SGPA: ${ctx.raw}`
        }
      }
    }
  };

  return (
    <div className="p-2 p-md-4">
      {/* 1. DEAN BACK-BAR (Only visible when Dean inspects a student) */}
      {isDean && (
        <div className="d-flex align-items-center justify-content-between p-3 mb-3 rounded-3 bg-primary text-white shadow-sm">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-shield-check fs-5"></i>
            <span className="small">
              Inspecting <strong>{st.full_name}</strong> ({st.student_id}) as Admin (All Records Access)
            </span>
          </div>
          <button
            className="btn btn-sm btn-light fw-bold"
            onClick={() => setInspectedStudentId(null)}
          >
            <i className="bi bi-arrow-left me-1"></i> Return to Master Directory
          </button>
        </div>
      )}

      {/* 2. TOP GREETING & IDENTITY BANNER */}
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
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #0284c7 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem',
                fontWeight: '800',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)'
              }}
            >
              {getInitials(st.full_name)}
            </div>
            <div>
              <div className="text-muted small fw-semibold mb-1">
                {getGreeting()}, <span style={{ color: 'var(--text-primary)' }}>{st.full_name}</span>
              </div>
              <h4 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                {st.full_name}
              </h4>
              <div className="d-flex flex-wrap align-items-center gap-2 text-muted small">
                <span className="badge bg-light text-dark border font-mono">{st.student_id}</span>
                <span>•</span>
                <span>Program: <strong>B.Tech ({st.department_name || 'CSE'})</strong></span>
                <span>•</span>
                <span>Year {st.batch_year ? (2026 - st.batch_year + 1) : 3}, Semester {st.semester || st.current_semester || 5}</span>
              </div>
            </div>
          </div>

          {/* Quick Status Badges */}
          <div className="d-flex flex-wrap gap-2">
            <span className={overallAttPct >= 75 ? 'status-badge-healthy' : overallAttPct >= 65 ? 'status-badge-warning' : 'status-badge-critical'}>
              <i className="bi bi-calendar-check"></i>
              Attendance: {overallAttPct}% ({overallAttPct >= 75 ? 'Healthy' : 'Debarment Risk'})
            </span>
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 fw-semibold">
              <i className="bi bi-award me-1"></i> CGPA: {currentCgpa}
            </span>
            <span className={`badge px-3 py-2 fw-semibold ${feeStatus === 'PAID' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning border border-warning-subtle'}`}>
              <i className="bi bi-wallet2 me-1"></i> Fee: {feeStatus}
            </span>
          </div>
        </div>
      </div>

      {/* 3. NAVIGATION SUB-TABS */}
      <div className="d-flex flex-wrap gap-1 mb-4 pb-2 border-bottom overflow-auto" style={{ borderColor: 'var(--border-color)' }}>
        {[
          { key: 'overview', label: 'Dashboard Overview', icon: 'bi-grid-fill' },
          { key: 'attendance', label: 'Attendance Record', icon: 'bi-calendar-check-fill' },
          { key: 'marks', label: 'Marks & Examination', icon: 'bi-journal-bookmark-fill' },
          { key: 'cgpa', label: 'SGPA / CGPA Progression', icon: 'bi-graph-up-arrow' },
          { key: 'schedule', label: 'Timetable & Classes', icon: 'bi-clock-history' },
          { key: 'fees', label: 'Fee Ledger & Receipts', icon: 'bi-receipt' },
          { key: 'notices', label: 'Notices & Circulars', icon: 'bi-megaphone-fill' },
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
      {/* SUB-VIEW 1: DASHBOARD OVERVIEW (Answers: "How am I doing, what do I pay, what do I know today?") */}
      {/* =================================================================== */}
      {activeTab === 'overview' && (
        <div className="d-flex flex-column gap-4">
          {/* Main 4 Core Dashboard Cards */}
          <div className="row g-3">
            {/* Card 1: Attendance Card */}
            <div className="col-12 col-md-6 col-xl-3">
              <div className="erp-stat-card h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="text-muted small fw-semibold">Overall Attendance</span>
                    <span className={overallAttPct >= 75 ? 'status-badge-healthy' : 'status-badge-critical'}>
                      {overallAttPct >= 75 ? 'Healthy' : 'Shortage'}
                    </span>
                  </div>
                  <h2 className="fw-bold mb-1" style={{ color: overallAttPct >= 75 ? '#10b981' : '#ef4444' }}>
                    {overallAttPct}%
                  </h2>
                  <div className="attendance-progress my-2">
                    <div
                      className="attendance-progress-fill"
                      style={{
                        width: `${Math.min(100, overallAttPct)}%`,
                        backgroundColor: overallAttPct >= 75 ? '#10b981' : '#ef4444'
                      }}
                    />
                  </div>
                  <div className="d-flex justify-content-between text-muted small mt-2">
                    <span>Attended: <strong style={{ color: 'var(--text-primary)' }}>{attendedClasses}</strong></span>
                    <span>Missed: <strong className="text-danger">{missedClasses}</strong></span>
                    <span>Total: <strong style={{ color: 'var(--text-primary)' }}>{totalClasses}</strong></span>
                  </div>
                </div>
                <div className="pt-3 mt-3 border-top d-flex justify-content-between align-items-center">
                  <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                    {shortageSubjects.length > 0
                      ? `${shortageSubjects.length} subject(s) below 75%`
                      : 'All subjects satisfy 75% criteria'}
                  </span>
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

            {/* Card 2: Academic Performance Card */}
            <div className="col-12 col-md-6 col-xl-3">
              <div className="erp-stat-card h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="text-muted small fw-semibold">Academic Standing</span>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                      SGPA: {currentSgpa}
                    </span>
                  </div>
                  <h2 className="fw-bold mb-1 text-primary">
                    {currentCgpa} <span className="fs-6 fw-normal text-muted">CGPA</span>
                  </h2>
                  <div className="text-muted small my-2">
                    Highest SGPA: <strong style={{ color: 'var(--text-primary)' }}>{highestSgpa}</strong> • Previous: <strong style={{ color: 'var(--text-primary)' }}>{prevSgpa}</strong>
                  </div>
                  <div className="d-flex align-items-center gap-1 text-success small fw-semibold">
                    <i className="bi bi-graph-up"></i>
                    <span>Progression trend is positive (+0.32)</span>
                  </div>
                </div>
                <div className="pt-3 mt-3 border-top d-flex justify-content-between align-items-center">
                  <span className="text-muted" style={{ fontSize: '0.72rem' }}>Calculated over {sgpaTrend.length || 5} semesters</span>
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-decoration-none p-0 fw-semibold"
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => setActiveTab('cgpa')}
                  >
                    View Breakdown →
                  </button>
                </div>
              </div>
            </div>

            {/* Card 3: Fees & Dues Card */}
            <div className="col-12 col-md-6 col-xl-3">
              <div className="erp-stat-card h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="text-muted small fw-semibold">Tuition & Term Fees</span>
                    <span className={`badge ${feeStatus === 'PAID' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning border border-warning-subtle'}`}>
                      {feeStatus}
                    </span>
                  </div>
                  <h2 className="fw-bold mb-1" style={{ color: pendingFeeAmount === 0 ? '#10b981' : '#d97706' }}>
                    ₹{pendingFeeAmount.toLocaleString()} <span className="fs-6 fw-normal text-muted">Pending</span>
                  </h2>
                  <div className="d-flex justify-content-between text-muted small my-2">
                    <span>Total: ₹{totalFeeAmount.toLocaleString()}</span>
                    <span>Paid: ₹{paidFeeAmount.toLocaleString()}</span>
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    Installment Due: <strong className="text-danger">{feeDueDate}</strong>
                  </div>
                </div>
                <div className="pt-3 mt-3 border-top d-flex justify-content-between align-items-center">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary py-1 px-2"
                    style={{ fontSize: '0.75rem' }}
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

            {/* Card 4: Quick Schedule & Today */}
            <div className="col-12 col-md-6 col-xl-3">
              <div className="erp-stat-card h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="text-muted small fw-semibold">Today's Lectures</span>
                    <span className="badge bg-info-subtle text-info border border-info-subtle">
                      {todaySchedule.length} Classes
                    </span>
                  </div>
                  <div className="fw-bold fs-6 mb-1" style={{ color: 'var(--text-primary)' }}>
                    Next: {todaySchedule[1]?.title}
                  </div>
                  <div className="text-muted small">
                    <i className="bi bi-clock me-1"></i> {todaySchedule[1]?.time}
                  </div>
                  <div className="text-muted small mt-1">
                    <i className="bi bi-geo-alt me-1"></i> {todaySchedule[1]?.room}
                  </div>
                </div>
                <div className="pt-3 mt-3 border-top d-flex justify-content-between align-items-center">
                  <span className="text-muted" style={{ fontSize: '0.72rem' }}>Day: {new Date().toLocaleDateString('en-US', { weekday: 'long' })}</span>
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-decoration-none p-0 fw-semibold"
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => setActiveTab('schedule')}
                  >
                    Full Timetable →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Row: SGPA Trend Chart & Today's Schedule Timeline */}
          <div className="row g-3">
            {/* Left: SGPA Progression Line Chart */}
            <div className="col-12 col-lg-7">
              <div className="erp-card p-4 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                      <i className="bi bi-graph-up-arrow text-primary me-2"></i> Semester SGPA Progression
                    </h6>
                    <span className="text-muted small">Academic grade point average trajectory across semesters</span>
                  </div>
                  <span className="badge bg-light text-dark border">Target CGPA: {targetCgpa}</span>
                </div>
                <div style={{ height: '220px' }}>
                  <Line data={sgpaChartData} options={sgpaChartOptions} />
                </div>
              </div>
            </div>

            {/* Right: Today's Class Schedule Timeline */}
            <div className="col-12 col-lg-5">
              <div className="erp-card p-4 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                    <i className="bi bi-calendar-event text-primary me-2"></i> Today's Schedule
                  </h6>
                  <span className="badge bg-light text-dark border font-mono">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
                <div className="d-flex flex-column gap-3">
                  {todaySchedule.map((cls, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-3 border d-flex justify-content-between align-items-center"
                      style={{
                        backgroundColor: cls.status === 'IN_PROGRESS' ? 'rgba(79, 70, 229, 0.08)' : 'var(--surface-elevated)',
                        borderColor: cls.status === 'IN_PROGRESS' ? '#4f46e5' : 'var(--border-color)'
                      }}
                    >
                      <div>
                        <div className="fw-bold small" style={{ color: 'var(--text-primary)' }}>
                          {cls.title} <span className="text-muted font-mono" style={{ fontSize: '0.72rem' }}>({cls.code})</span>
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.73rem' }}>
                          <span>{cls.faculty}</span> • <span>{cls.room}</span>
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="font-mono small fw-semibold" style={{ color: 'var(--text-primary)' }}>{cls.time.split('-')[0]}</div>
                        <span className={`badge ${cls.status === 'COMPLETED' ? 'bg-secondary' : cls.status === 'IN_PROGRESS' ? 'bg-primary' : 'bg-light text-dark border'}`} style={{ fontSize: '0.65rem' }}>
                          {cls.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Latest Campus Notices */}
          <div className="erp-card p-4">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <h6 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                  <i className="bi bi-megaphone-fill text-primary me-2"></i> Important Campus Notices & Circulars
                </h6>
                <span className="text-muted small">Latest university notifications, deadlines, and advisories</span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                style={{ fontSize: '0.75rem' }}
                onClick={() => setActiveTab('notices')}
              >
                View All Notices ({noticesList.length})
              </button>
            </div>
            <div className="row g-3">
              {noticesList.slice(0, 3).map(n => (
                <div key={n.id} className="col-12 col-md-4">
                  <div className="p-3 rounded-3 border h-100 d-flex flex-column justify-content-between" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border-color)' }}>
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="badge bg-secondary text-white" style={{ fontSize: '0.65rem' }}>{n.category}</span>
                        <span className={`badge ${n.priority === 'HIGH' ? 'bg-danger-subtle text-danger border border-danger-subtle' : 'bg-light text-muted border'}`} style={{ fontSize: '0.65rem' }}>
                          {n.priority}
                        </span>
                      </div>
                      <div className="fw-bold small mb-1" style={{ color: 'var(--text-primary)' }}>{n.title}</div>
                      <p className="text-muted mb-2" style={{ fontSize: '0.75rem', lineHeight: '1.35' }}>
                        {n.description.slice(0, 100)}...
                      </p>
                    </div>
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top text-muted" style={{ fontSize: '0.7rem', borderColor: 'var(--border-color)' }}>
                      <span><i className="bi bi-calendar3 me-1"></i> {n.date}</span>
                      <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none" onClick={() => setActiveTab('notices')}>
                        Read More →
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
      {/* SUB-VIEW 2: ATTENDANCE MODULE (Subject-wise, Present/Absent/Needed) */}
      {/* =================================================================== */}
      {activeTab === 'attendance' && (
        <div className="d-flex flex-column gap-4">
          {/* Attendance KPI Banner */}
          <div className="row g-3">
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="erp-stat-card">
                <span className="text-muted small">Aggregate Attendance</span>
                <h3 className="fw-bold my-1" style={{ color: overallAttPct >= 75 ? '#10b981' : '#ef4444' }}>
                  {overallAttPct}%
                </h3>
                <span className={overallAttPct >= 75 ? 'status-badge-healthy' : 'status-badge-critical'}>
                  {overallAttPct >= 75 ? 'Eligible for Exams' : 'Debarment Notice'}
                </span>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="erp-stat-card">
                <span className="text-muted small">Total Lectures Conducted</span>
                <h3 className="fw-bold my-1" style={{ color: 'var(--text-primary)' }}>{totalClasses}</h3>
                <span className="badge bg-light text-muted border">Term Classes</span>
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
                <span className="badge bg-danger-subtle text-danger border border-danger-subtle">Absent Days</span>
              </div>
            </div>
          </div>

          {/* Subject-Wise Detailed Attendance Table */}
          <div className="erp-card p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-2 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <h5 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  <i className="bi bi-calendar-check-fill text-primary me-2"></i> Subject-Wise Attendance Roster
                </h5>
                <span className="text-muted small">Detailed record of lectures, laboratories, and minimum 75% statutory compliance</span>
              </div>

              {/* Semester Filter */}
              <div className="d-flex gap-2">
                <select
                  className="form-select form-select-sm"
                  value={attendanceSemFilter}
                  onChange={e => setAttendanceSemFilter(e.target.value)}
                  style={{ width: '160px' }}
                >
                  <option value="ALL">All Semesters</option>
                  <option value="5">Semester 5 (Current)</option>
                  <option value="4">Semester 4</option>
                  <option value="3">Semester 3</option>
                  <option value="2">Semester 2</option>
                  <option value="1">Semester 1</option>
                </select>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small">
                  <tr>
                    <th>Subject Code & Title</th>
                    <th>Term</th>
                    <th className="text-center">Present</th>
                    <th className="text-center">Absent</th>
                    <th className="text-center">Total</th>
                    <th className="text-center">Attendance %</th>
                    <th className="text-center">Compliance Status</th>
                    <th className="text-center">Classes Needed for 75%</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {subjectRecords
                    .filter(s => attendanceSemFilter === 'ALL' || String(s.semester) === attendanceSemFilter)
                    .map((s, idx) => {
                      const pct = Number(s.attendance_percentage || 0).toFixed(1);
                      const isLow = pct < 75.0;
                      const title = getSubjectTitle(s.subject_id) || s.subject_id;
                      const needed = s.classes_needed_for_75 || (isLow ? Math.max(0, Math.ceil((0.75 * s.total_classes - s.classes_attended) / 0.25)) : 0);

                      return (
                        <tr key={idx}>
                          <td>
                            <div className="fw-bold" style={{ color: 'var(--text-primary)' }}>{title}</div>
                            <span className="font-mono text-muted" style={{ fontSize: '0.72rem' }}>{s.subject_id}</span>
                          </td>
                          <td>Semester {s.semester || 5}</td>
                          <td className="text-center text-success fw-bold font-mono">{s.classes_attended}</td>
                          <td className="text-center text-danger fw-bold font-mono">{s.total_classes - s.classes_attended}</td>
                          <td className="text-center font-mono">{s.total_classes}</td>
                          <td className="text-center">
                            <div className="d-flex align-items-center justify-content-center gap-2">
                              <span className={`fw-bold font-mono ${isLow ? 'text-danger' : 'text-success'}`}>{pct}%</span>
                              <div style={{ width: '50px', height: '6px' }} className="attendance-progress">
                                <div
                                  className="attendance-progress-fill"
                                  style={{ width: `${Math.min(100, pct)}%`, backgroundColor: isLow ? '#ef4444' : '#10b981' }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="text-center">
                            <span className={!isLow ? 'status-badge-healthy' : pct >= 65 ? 'status-badge-warning' : 'status-badge-critical'}>
                              {!isLow ? 'Satisfied' : pct >= 65 ? 'Warning' : 'Critical Shortage'}
                            </span>
                          </td>
                          <td className="text-center">
                            {needed > 0 ? (
                              <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                                Attend next {needed} classes
                              </span>
                            ) : (
                              <span className="text-success small fw-semibold">
                                <i className="bi bi-check-circle-fill me-1"></i> Safe
                              </span>
                            )}
                          </td>
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
      {/* SUB-VIEW 3: MARKS & EXAMINATION MODULE (Internals, Midterm, Final) */}
      {/* =================================================================== */}
      {activeTab === 'marks' && (
        <div className="d-flex flex-column gap-4">
          <div className="erp-card p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-2 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <h5 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  <i className="bi bi-journal-bookmark-fill text-primary me-2"></i> Semester Examination Marks & Grades
                </h5>
                <span className="text-muted small">Internal assessments, mid-term examinations, final theory scores, and awarded letter grades</span>
              </div>

              {/* Semester Filter */}
              <select
                className="form-select form-select-sm"
                value={marksSemFilter}
                onChange={e => setMarksSemFilter(e.target.value)}
                style={{ width: '160px' }}
              >
                <option value="ALL">All Semesters</option>
                <option value="5">Semester 5</option>
                <option value="4">Semester 4</option>
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
                  {examRecords
                    .filter(ex => marksSemFilter === 'ALL' || String(ex.semester) === marksSemFilter)
                    .map((ex, idx) => {
                      const title = getSubjectTitle(ex.subject_id) || ex.subject_id;
                      const internal = ex.internal_marks_scored || ex.internal_marks || 22;
                      const midterm = ex.midterm_marks || Math.round(internal * 0.6);
                      const assignment = ex.assignment_marks || 9;
                      const endSem = ex.end_semester_marks_scored || ex.final_marks || 58;
                      const total = ex.total_marks || (internal + endSem);
                      const grade = ex.grade_letter || ex.grade || 'A';
                      const points = ex.grade_point || 8.0;

                      return (
                        <tr key={idx}>
                          <td>
                            <div className="fw-bold" style={{ color: 'var(--text-primary)' }}>{title}</div>
                            <span className="font-mono text-muted" style={{ fontSize: '0.72rem' }}>{ex.subject_id}</span>
                          </td>
                          <td>Semester {ex.semester || 1}</td>
                          <td className="text-center font-mono">{internal}</td>
                          <td className="text-center font-mono">{midterm}</td>
                          <td className="text-center font-mono">{assignment}</td>
                          <td className="text-center font-mono">{endSem}</td>
                          <td className="text-center font-mono fw-bold text-primary">{total}</td>
                          <td className="text-center">
                            <span className={`badge ${grade === 'O' || grade === 'A+' ? 'bg-success' : grade === 'A' || grade === 'B+' ? 'bg-primary' : grade === 'F' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                              {grade}
                            </span>
                          </td>
                          <td className="text-center font-mono fw-bold">{points}.0</td>
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
      {/* SUB-VIEW 4: SGPA / CGPA PROGRESSION MODULE */}
      {/* =================================================================== */}
      {activeTab === 'cgpa' && (
        <div className="d-flex flex-column gap-4">
          <div className="row g-3">
            <div className="col-12 col-lg-8">
              <div className="erp-card p-4 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                      <i className="bi bi-graph-up-arrow text-primary me-2"></i> Cumulative Academic Performance (CGPA)
                    </h5>
                    <span className="text-muted small">Semester-wise progression trajectory across all terms</span>
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
                    <div className="fw-bold fs-5 text-success font-mono">
                      {Math.min(10.0, Math.max(6.0, Number((targetCgpa * 8 - currentCgpa * (sgpaTrend.length || 5)) / Math.max(1, 8 - (sgpaTrend.length || 5))).toFixed(2)))}
                    </div>
                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                      Across {Math.max(1, 8 - (sgpaTrend.length || 5))} remaining semesters.
                    </span>
                  </div>
                </div>
                <div className="pt-3 border-top mt-3 text-muted small">
                  <strong>Grading Formula:</strong> CGPA = Σ(SGPA × Credits) / Σ(Credits)
                </div>
              </div>
            </div>
          </div>

          {/* Semester Performance History Table */}
          <div className="erp-card p-4">
            <h6 className="fw-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              Semester Performance History
            </h6>
            <div className="table-responsive">
              <table className="table table-bordered align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Term</th>
                    <th className="text-center">SGPA Scored</th>
                    <th className="text-center">Credits Registered</th>
                    <th className="text-center">Credits Earned</th>
                    <th className="text-center">Active Backlogs</th>
                    <th className="text-center">Standing</th>
                  </tr>
                </thead>
                <tbody>
                  {sgpaTrend.map((s, idx) => (
                    <tr key={idx}>
                      <td className="fw-bold" style={{ color: 'var(--text-primary)' }}>{s.semester}</td>
                      <td className="text-center font-mono fw-bold text-primary">{s.sgpa}</td>
                      <td className="text-center font-mono">24</td>
                      <td className="text-center font-mono text-success">24</td>
                      <td className="text-center font-mono">0</td>
                      <td className="text-center">
                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                          Passed (First Class)
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
      {/* SUB-VIEW 5: TIMETABLE & SCHEDULE MODULE */}
      {/* =================================================================== */}
      {activeTab === 'schedule' && (
        <div className="d-flex flex-column gap-4">
          <div className="erp-card p-4">
            <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <h5 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  <i className="bi bi-clock-history text-primary me-2"></i> Weekly Academic Timetable
                </h5>
                <span className="text-muted small">Semester {st.semester || 5} Course Timetable — Section A</span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                onClick={() => window.print()}
              >
                <i className="bi bi-printer"></i>
                <span>Print Timetable</span>
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
                      <td><div className="p-2 rounded border bg-primary-subtle border-primary-subtle text-primary fw-semibold small">{row.slots[4]}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-VIEW 6: FEES & BURSAR LEDGER MODULE */}
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
                <span className="text-muted small">Official record of tuition, laboratory, and examination fee transactions</span>
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
                    <th>Date</th>
                    <th>Transaction ID</th>
                    <th>Fee Component</th>
                    <th>Payment Mode</th>
                    <th className="text-end">Amount Paid</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Aug 14, 2026</td>
                    <td className="font-mono text-primary">TXN_2026_88192</td>
                    <td>Term 1 Tuition & Laboratory Fee</td>
                    <td>Online NetBanking (HDFC Bank)</td>
                    <td className="text-end font-mono fw-bold">₹{paidFeeAmount.toLocaleString()}</td>
                    <td className="text-center">
                      <span className="badge bg-success-subtle text-success border border-success-subtle">
                        CONFIRMED
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
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-VIEW 7: NOTICES & CIRCULARS MODULE */}
      {/* =================================================================== */}
      {activeTab === 'notices' && (
        <div className="d-flex flex-column gap-4">
          <div className="erp-card p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-2 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <h5 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  <i className="bi bi-megaphone-fill text-primary me-2"></i> University Notices & Announcements
                </h5>
                <span className="text-muted small">Official notices from Dean of Academic Affairs and Controller of Examinations</span>
              </div>

              {/* Category Filter */}
              <div className="d-flex gap-2">
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
      {/* SUB-VIEW 8: PRINTABLE DOCUMENTS & RESOURCES MODULE */}
      {/* =================================================================== */}
      {activeTab === 'documents' && (
        <div className="d-flex flex-column gap-4">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <div className="erp-card p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="fs-1 text-primary mb-3"><i className="bi bi-file-earmark-text-fill"></i></div>
                  <h5 className="fw-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Official Consolidated Grade Transcript
                  </h5>
                  <p className="text-muted small">
                    Certified statement of marks and credits earned across all completed semesters, verified by the Controller of Examinations.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary d-flex align-items-center justify-content-center gap-2"
                  onClick={() => setShowTranscriptModal(true)}
                >
                  <i className="bi bi-printer-fill"></i>
                  <span>View & Print Official Transcript</span>
                </button>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="erp-card p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="fs-1 text-warning mb-3"><i className="bi bi-card-checklist"></i></div>
                  <h5 className="fw-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    End-Semester Examination Hall Ticket
                  </h5>
                  <p className="text-muted small">
                    Official examination admit card with assigned seating center, timetable, and statutory candidate instructions.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-primary d-flex align-items-center justify-content-center gap-2"
                  onClick={() => setShowHallTicketModal(true)}
                >
                  <i className="bi bi-printer-fill"></i>
                  <span>View & Print Examination Hall Ticket</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-VIEW 9: STUDENT PROFILE MODULE */}
      {/* =================================================================== */}
      {activeTab === 'profile' && (
        <div className="erp-card p-4">
          <h5 className="fw-bold mb-4 pb-2 border-bottom" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
            <i className="bi bi-person-badge-fill text-primary me-2"></i> Student Official Profile Details
          </h5>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="text-muted small fw-semibold">Full Legal Name</label>
              <div className="p-2 rounded bg-light border fw-bold" style={{ color: 'var(--text-primary)' }}>{st.full_name}</div>
            </div>
            <div className="col-12 col-md-6">
              <label className="text-muted small fw-semibold">Institutional Registration ID</label>
              <div className="p-2 rounded bg-light border font-mono fw-bold text-primary">{st.student_id}</div>
            </div>
            <div className="col-12 col-md-6">
              <label className="text-muted small fw-semibold">Institutional Email</label>
              <div className="p-2 rounded bg-light border">{st.email}</div>
            </div>
            <div className="col-12 col-md-6">
              <label className="text-muted small fw-semibold">Contact Phone</label>
              <div className="p-2 rounded bg-light border font-mono">{st.phone || '+91-9876543210'}</div>
            </div>
            <div className="col-12 col-md-6">
              <label className="text-muted small fw-semibold">Department / School</label>
              <div className="p-2 rounded bg-light border">{st.department_name}</div>
            </div>
            <div className="col-12 col-md-6">
              <label className="text-muted small fw-semibold">Admission Batch Year</label>
              <div className="p-2 rounded bg-light border font-mono">{st.batch_year}</div>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showTranscriptModal && (
        <PrintableTranscriptModal
          student={st}
          exams={examRecords}
          summaryCards={{ cgpa: currentCgpa, totalCredits: exams.total_credits || 96, backlogs: exams.backlogs || 0 }}
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
