import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchAPI } from '../services/api';
import PrintableTranscriptModal from '../components/PrintableTranscriptModal';
import PrintableHallTicketModal from '../components/PrintableHallTicketModal';
import FeePaymentModal from '../components/FeePaymentModal';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function StudentPortal() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const isDean = user?.role === 'ADMIN';

  // For Student: locked to own student ID.
  // For Dean: null initially (showing all-student master list), or set to specific student ID when inspecting.
  const [inspectedStudentId, setInspectedStudentId] = useState(
    isDean ? null : (user?.student_id || 'STU20220001')
  );

  // Master Student List State (for Dean view)
  const [masterStudents, setMasterStudents] = useState([]);
  const [masterTotal, setMasterTotal] = useState(0);
  const [masterPage, setMasterPage] = useState(1);
  const [masterTotalPages, setMasterTotalPages] = useState(1);
  const [deptFilter, setDeptFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [masterLoading, setMasterLoading] = useState(false);

  // Single Student 360 Profile State
  const [studentData, setStudentData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Modals
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [showHallTicketModal, setShowHallTicketModal] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);

  // Target CGPA Planner
  const [targetCgpa, setTargetCgpa] = useState(8.5);

  // If student persona, keep inspectedStudentId tied to logged-in user
  useEffect(() => {
    if (!isDean && user?.student_id) {
      setInspectedStudentId(user.student_id);
    }
  }, [user, isDean]);

  // Load All Students Directory for Dean
  const loadMasterStudents = () => {
    if (!isDean) return;
    setMasterLoading(true);
    let url = `/students?page=${masterPage}&limit=12&`;
    if (deptFilter) url += `department_id=${deptFilter}&`;
    if (riskFilter) url += `risk_level=${riskFilter}&`;
    if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;

    fetchAPI(url)
      .then(res => {
        setMasterStudents(res.students || []);
        setMasterTotal(res.total || 0);
        setMasterTotalPages(res.total_pages || 1);
      })
      .catch(err => {
        console.error(err);
        addToast('Failed to load students directory', 'danger');
      })
      .finally(() => setMasterLoading(false));
  };

  useEffect(() => {
    if (isDean) {
      loadMasterStudents();
    }
  }, [isDean, masterPage, deptFilter, riskFilter, searchTerm]);

  // Load Specific Student 360 Profile
  const loadStudent360 = (sId) => {
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
      loadStudent360(inspectedStudentId);
    } else {
      setStudentData(null);
    }
  }, [inspectedStudentId]);

  // ==========================================
  // VIEW 1: DEAN ALL-STUDENTS DIRECTORY MASTER
  // ==========================================
  if (isDean && !inspectedStudentId) {
    return (
      <div className="p-3 p-md-4">
        {/* Header */}
        <div className="p-4 rounded-4 text-white mb-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <span className="badge bg-success text-white mb-2 fw-semibold">
                <i className="bi bi-people-fill me-1"></i> Dean Directorate: Student 360 Hub
              </span>
              <h3 className="fw-bold mb-1">University Student Roster ({masterTotal} Enrolled Students)</h3>
              <p className="mb-0 text-white-50 small">
                Search and click on any student across all 5 engineering departments to open their complete 360-degree academic hub.
              </p>
            </div>

            <div className="d-flex gap-2">
              <span className="badge bg-white text-dark p-2 px-3 align-self-center">
                Total: <strong>{masterTotal}</strong> Students
              </span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="metric-card mb-4">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-5">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white"><i className="bi bi-search text-muted"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by student name, ID (e.g. STU20220001), email..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setMasterPage(1); }}
                />
                {searchTerm && (
                  <button className="btn btn-outline-secondary" onClick={() => setSearchTerm('')}>Clear</button>
                )}
              </div>
            </div>

            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={deptFilter}
                onChange={(e) => { setDeptFilter(e.target.value); setMasterPage(1); }}
              >
                <option value="">All Departments</option>
                <option value="DEPT_CSE">Computer Science (CSE)</option>
                <option value="DEPT_ECE">Electronics (ECE)</option>
                <option value="DEPT_MECH">Mechanical (MECH)</option>
                <option value="DEPT_CIVIL">Civil (CIVIL)</option>
                <option value="DEPT_AIDS">AI & Data Science (AIDS)</option>
              </select>
            </div>

            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={riskFilter}
                onChange={(e) => { setRiskFilter(e.target.value); setMasterPage(1); }}
              >
                <option value="">All Risk Levels</option>
                <option value="HIGH">High Risk Only</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="LOW">Low Risk Only</option>
              </select>
            </div>

            <div className="col-12 col-md-2 text-md-end">
              <button className="btn btn-sm btn-outline-primary w-100" onClick={loadMasterStudents}>
                <i className="bi bi-arrow-clockwise me-1"></i> Refresh List
              </button>
            </div>
          </div>
        </div>

        {/* Master Students Table */}
        <div className="metric-card mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold mb-0">Enrolled Student Directory</h6>
            <span className="text-muted small">Showing Page {masterPage} of {masterTotalPages} ({masterTotal} total)</span>
          </div>

          {masterLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2 text-muted small">Loading student records...</p>
            </div>
          ) : masterStudents.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-person-x fs-1"></i>
              <p className="mt-2 mb-0">No students matched your filter criteria.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Student ID</th>
                    <th>Candidate Name</th>
                    <th>Department</th>
                    <th>Semester</th>
                    <th>Attendance</th>
                    <th>CGPA</th>
                    <th>Fee Status</th>
                    <th>Academic Risk</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {masterStudents.map((s) => (
                    <tr
                      key={s.student_id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setInspectedStudentId(s.student_id)}
                    >
                      <td className="font-mono fw-bold text-primary">{s.student_id}</td>
                      <td>
                        <div className="fw-semibold text-dark">{s.full_name}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>{s.email}</div>
                      </td>
                      <td><span className="badge bg-light text-dark border">{s.department_name}</span></td>
                      <td>Sem {s.current_semester}</td>
                      <td>
                        <span className={`fw-bold ${s.attendance_percentage >= 75 ? 'text-success' : 'text-danger'}`}>
                          {s.attendance_percentage}%
                        </span>
                      </td>
                      <td className="font-mono fw-bold text-primary">{s.cgpa}</td>
                      <td>
                        <span className={`badge ${s.fee_status === 'PAID' ? 'bg-light text-success border' : 'badge-risk-high'}`}>
                          {s.fee_status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${s.risk_level === 'LOW' ? 'bg-success text-white' : s.risk_level === 'MEDIUM' ? 'bg-warning text-dark' : 'badge-risk-high'}`}>
                          {s.risk_level}
                        </span>
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-primary py-1 px-2 rounded-pill"
                          style={{ fontSize: '0.72rem', background: '#4f46e5', borderColor: '#4f46e5' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectedStudentId(s.student_id);
                          }}
                        >
                          <i className="bi bi-person-bounding-box me-1"></i> Open 360 Hub
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {masterTotalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={masterPage <= 1}
                onClick={() => setMasterPage(p => Math.max(1, p - 1))}
              >
                ← Previous
              </button>
              <span className="small text-muted">Page {masterPage} of {masterTotalPages}</span>
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={masterPage >= masterTotalPages}
                onClick={() => setMasterPage(p => Math.min(masterTotalPages, p + 1))}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: INDIVIDUAL STUDENT 360-DEGREE HUB
  // ==========================================
  if (profileLoading || !studentData) {
    return (
      <div className="p-4 text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted small">Loading Student 360 Hub...</p>
      </div>
    );
  }

  const st = studentData?.student || {};
  const cards = studentData?.summary_cards || {};
  const subjects = studentData?.subject_attendance || [];
  const exams = studentData?.examination_records || [];
  const sgpaTrend = studentData?.sgpa_trend || [];
  const feeTxns = studentData?.fee_transactions || [];
  const libInfo = studentData?.library_summary || {};
  const issuedBooks = libInfo.issued_books || [];

  const currentAttPct = cards.attendance_percentage || 78.4;
  const totalConducted = subjects.reduce((sum, s) => sum + (s.total_classes || 0), 0) || 240;
  const totalAttended = subjects.reduce((sum, s) => sum + (s.classes_attended || 0), 0) || 192;

  const classesNeededFor75 = currentAttPct < 75.0
    ? Math.max(1, Math.ceil((0.75 * totalConducted - totalAttended) / 0.25))
    : 0;

  const safeMissableClasses = currentAttPct >= 75.0
    ? Math.max(0, Math.floor((totalAttended - 0.75 * totalConducted) / 0.75))
    : 0;

  const sgpaChartData = {
    labels: sgpaTrend.length ? sgpaTrend.map(t => t.semester) : [`Sem ${st.semester || 1}`],
    datasets: [
      {
        label: 'Semester SGPA',
        data: sgpaTrend.length ? sgpaTrend.map(t => t.sgpa) : [cards.cgpa || 7.5],
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.12)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#4f46e5',
        pointRadius: 5
      }
    ]
  };

  const currentCgpa = cards.cgpa || 7.8;
  const currentSem = st.semester || 1;
  const remainingSems = Math.max(1, 8 - currentSem);
  const requiredFutureSgpa = Number((((targetCgpa * 8) - (currentCgpa * currentSem)) / remainingSems).toFixed(2));

  const projectionScenarios = [
    { scorePct: '75% Marks', futureSgpa: 7.5, projectedCgpa: Number(((currentCgpa * currentSem + 7.5 * remainingSems) / 8).toFixed(2)) },
    { scorePct: '80% Marks', futureSgpa: 8.0, projectedCgpa: Number(((currentCgpa * currentSem + 8.0 * remainingSems) / 8).toFixed(2)) },
    { scorePct: '85% Marks', futureSgpa: 8.5, projectedCgpa: Number(((currentCgpa * currentSem + 8.5 * remainingSems) / 8).toFixed(2)) },
    { scorePct: '90%+ Marks', futureSgpa: 9.2, projectedCgpa: Number(((currentCgpa * currentSem + 9.2 * remainingSems) / 8).toFixed(2)) }
  ];

  const isLowRisk = cards.risk_level === 'LOW';

  return (
    <div className="p-3 p-md-4">
      {/* Dean Back-To-List Navigation Bar */}
      {isDean && (
        <div className="d-flex justify-content-between align-items-center mb-3">
          <button className="btn btn-sm btn-outline-dark fw-semibold" onClick={() => setInspectedStudentId(null)}>
            <i className="bi bi-arrow-left me-1"></i> Back to All Students List
          </button>
          <span className="badge bg-primary text-white">Dean Inspection: {st.full_name} ({st.student_id})</span>
        </div>
      )}

      {/* 1. Header Banner & Profile Snapshot */}
      <div className="p-4 rounded-4 text-white mb-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)' }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <span className="badge bg-white text-dark mb-2 fw-semibold">
              <i className="bi bi-mortarboard-fill text-primary me-1"></i> My Academic Portal ("How Am I Doing?")
            </span>
            <h3 className="fw-bold mb-1">Welcome, {st.full_name}</h3>
            <div className="d-flex flex-wrap gap-2 text-white-50 small mt-2">
              <span><strong>Semester:</strong> <span className="text-white">{st.semester}</span></span>
              <span>•</span>
              <span><strong>Department:</strong> <span className="text-white">{st.department_name}</span></span>
              <span>•</span>
              <span><strong>CGPA:</strong> <span className="text-white font-mono">{cards.cgpa}</span></span>
              <span>•</span>
              <span><strong>Attendance:</strong> <span className="text-white">{cards.attendance_percentage}%</span></span>
              <span>•</span>
              <span><strong>Fee Status:</strong> <span className="badge bg-light text-dark">{cards.fee_status}</span></span>
              <span>•</span>
              <span>
                <strong>Academic Risk:</strong>{' '}
                <span className={`badge ${isLowRisk ? 'bg-success text-white' : 'badge-risk-high'}`}>
                  {cards.risk_level}
                </span>
              </span>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <button className="btn btn-light btn-sm fw-semibold shadow-sm" onClick={() => setShowHallTicketModal(true)}>
              <i className="bi bi-card-checklist text-primary me-1"></i> Exam Hall Ticket
            </button>
            <button className="btn btn-light btn-sm fw-semibold shadow-sm" onClick={() => setShowTranscriptModal(true)}>
              <i className="bi bi-printer-fill text-primary me-1"></i> Grade Transcript
            </button>
            {cards.fee_outstanding > 0 && (
              <button className="btn btn-warning btn-sm fw-bold shadow-sm" onClick={() => setShowFeeModal(true)}>
                <i className="bi bi-credit-card-fill me-1"></i> Pay Tuition Fee
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Four Core Snapshot Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="metric-card">
            <div className="d-flex justify-content-between text-muted small mb-1">
              <span>Overall Attendance</span>
              <i className="bi bi-calendar-check text-primary"></i>
            </div>
            <h2 className={`fw-bold mb-1 ${currentAttPct >= 75 ? 'text-success' : 'text-danger'}`}>
              {currentAttPct}%
            </h2>
            <span className={`badge ${cards.is_exam_eligible ? 'bg-light text-success border' : 'badge-risk-high'}`}>
              {cards.is_exam_eligible ? '✓ Exam Eligible (>= 75%)' : '⚠ Debarment Warning'}
            </span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="metric-card">
            <div className="d-flex justify-content-between text-muted small mb-1">
              <span>Current CGPA</span>
              <i className="bi bi-award text-warning"></i>
            </div>
            <h2 className="fw-bold mb-1 text-primary">{cards.cgpa} / 10</h2>
            <span className="badge bg-light text-muted border">Scale: 10.0 Grading</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="metric-card">
            <div className="d-flex justify-content-between text-muted small mb-1">
              <span>Tuition Fee Balance</span>
              <i className="bi bi-credit-card text-success"></i>
            </div>
            <h2 className="fw-bold mb-1 text-dark">₹{(cards.fee_outstanding || 0).toLocaleString()}</h2>
            <span className={`badge ${cards.fee_outstanding > 0 ? 'badge-risk-high' : 'bg-light text-success border'}`}>
              {cards.fee_status || 'PAID IN FULL'}
            </span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="metric-card">
            <div className="d-flex justify-content-between text-muted small mb-1">
              <span>Active Backlogs</span>
              <i className="bi bi-journal-x text-info"></i>
            </div>
            <h2 className="fw-bold mb-1 text-dark">{cards.backlogs_count || 0}</h2>
            <span className="badge bg-light text-muted border">
              {(cards.backlogs_count || 0) === 0 ? '✓ Zero Standing Arrears' : 'Clearance Required'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Section: My Profile & Academic Registration */}
      <div className="metric-card mb-4">
        <h6 className="fw-bold mb-3"><i className="bi bi-person-lines-fill text-primary me-2"></i> 1. My Profile & Institutional Enrollment</h6>
        <div className="row g-3 small">
          <div className="col-12 col-sm-6 col-md-3">
            <div className="p-3 bg-light rounded-3 border">
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>Full Candidate Name</div>
              <div className="fw-bold text-dark">{st.full_name}</div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-md-3">
            <div className="p-3 bg-light rounded-3 border">
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>Student Registration ID</div>
              <div className="fw-bold font-mono text-primary">{st.student_id}</div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-md-3">
            <div className="p-3 bg-light rounded-3 border">
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>Academic Department</div>
              <div className="fw-bold text-dark">{st.department_name}</div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-md-3">
            <div className="p-3 bg-light rounded-3 border">
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>Batch & Term</div>
              <div className="fw-bold text-dark">{st.batch_year} (Semester {st.semester})</div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-md-4">
            <div className="p-3 bg-light rounded-3 border">
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>Official University Email</div>
              <div className="fw-bold text-dark font-mono">{st.email}</div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-md-4">
            <div className="p-3 bg-light rounded-3 border">
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>Admission Year</div>
              <div className="fw-bold text-dark">{st.admission_year}</div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-md-4">
            <div className="p-3 bg-light rounded-3 border">
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>Admission Category / Quota</div>
              <div className="fw-bold text-dark">{st.admission_quota}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Section: Attendance & "How Many Classes Must I Attend?" */}
      <div className="metric-card mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-2">
          <div>
            <h6 className="fw-bold mb-0"><i className="bi bi-calendar2-check-fill text-primary me-2"></i> 2. Attendance & Course Compliance</h6>
            <span className="text-muted small">Overall Attendance: <strong>{currentAttPct}%</strong> across registered courses</span>
          </div>
          <span className="badge bg-light text-dark border">Mandatory Threshold: 75.0%</span>
        </div>

        <div className={`p-3 rounded-3 border mb-3 small ${currentAttPct >= 75 ? 'bg-light border-success' : 'bg-light border-danger'}`}>
          <h6 className="fw-bold mb-1">
            <i className={`bi ${currentAttPct >= 75 ? 'bi-shield-check text-success' : 'bi-exclamation-triangle-fill text-danger'} me-1`}></i>
            How many classes must I attend?
          </h6>
          {currentAttPct < 75 ? (
            <p className="mb-0 text-danger fw-semibold">
              Current attendance: <strong>{currentAttPct}%</strong> | Required: <strong>75%</strong>
              <br />
              <span className="text-dark fw-normal">
                You need to attend the next <strong>{classesNeededFor75} consecutive classes</strong> without being absent to reach the mandatory 75% exam eligibility threshold.
              </span>
            </p>
          ) : (
            <p className="mb-0 text-success fw-semibold">
              Current attendance: <strong>{currentAttPct}%</strong> | Status: <strong>Safe & Exam Eligible</strong>
              <br />
              <span className="text-muted fw-normal">
                You can safely miss up to <strong>{safeMissableClasses} classes</strong> across the remainder of the semester without falling below the 75% attendance threshold.
              </span>
            </p>
          )}
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 small">
            <thead className="table-light">
              <tr>
                <th>Course / Subject</th>
                <th>Classes Conducted</th>
                <th>Classes Attended</th>
                <th>Subject Attendance</th>
                <th>Eligibility Status</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((sub, idx) => (
                <tr key={idx}>
                  <td className="fw-bold font-mono text-primary">{sub.subject_id}</td>
                  <td>{sub.total_classes} classes</td>
                  <td>{sub.classes_attended} attended</td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div className="progress flex-grow-1" style={{ height: '6px' }}>
                        <div
                          className={`progress-bar ${sub.attendance_percentage >= 75 ? 'bg-success' : 'bg-danger'}`}
                          style={{ width: `${Math.min(100, sub.attendance_percentage)}%` }}
                        ></div>
                      </div>
                      <span className="fw-bold">{sub.attendance_percentage}%</span>
                    </div>
                  </td>
                  <td>
                    {sub.attendance_percentage >= 75 ? (
                      <span className="badge bg-light text-success border">✓ Eligible</span>
                    ) : (
                      <span className="badge badge-risk-high">⚠ Attend next {sub.classes_needed_for_75 || 4} classes</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Section: Examination / CGPA & Target CGPA Planner */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-7">
          <div className="metric-card h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="fw-bold mb-0"><i className="bi bi-graph-up-arrow text-primary me-2"></i> 3. Examination / SGPA History</h6>
                <span className="text-muted small">Semester-by-semester academic performance trajectory</span>
              </div>
              <span className="badge bg-light text-primary border">CGPA: {cards.cgpa}</span>
            </div>

            <div style={{ height: '220px' }}>
              <Line data={sgpaChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>

            <div className="row g-2 mt-3 pt-2 border-top text-center small">
              {sgpaTrend.map((t, idx) => (
                <div key={idx} className="col">
                  <div className="p-2 bg-light rounded border">
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>{t.semester}</div>
                    <div className="fw-bold text-primary">{t.sgpa}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="metric-card h-100 border-primary">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-bold mb-0 text-primary"><i className="bi bi-calculator me-1"></i> Target CGPA Planner (What-If)</h6>
              <span className="badge bg-primary text-white">Interactive</span>
            </div>
            <p className="text-muted small mb-3">Calculate required future SGPA to achieve graduation targets.</p>

            <div className="mb-3">
              <label className="form-label small fw-semibold">Target Graduation CGPA: <strong className="text-primary">{targetCgpa}</strong></label>
              <input
                type="range"
                className="form-range"
                min="6.0"
                max="10.0"
                step="0.1"
                value={targetCgpa}
                onChange={(e) => setTargetCgpa(parseFloat(e.target.value))}
              />
            </div>

            <div className="p-3 bg-light rounded-3 border text-center mb-3">
              <div className="text-muted small">Estimated Required Future SGPA in Next {remainingSems} Terms:</div>
              <h3 className={`fw-bold my-1 ${requiredFutureSgpa > 10 ? 'text-danger' : requiredFutureSgpa >= 8.5 ? 'text-warning' : 'text-success'}`}>
                {requiredFutureSgpa > 10 ? 'Mathematically Unattainable' : `${requiredFutureSgpa} / 10`}
              </h3>
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>Current CGPA: {currentCgpa} (Sem {currentSem})</span>
            </div>

            <div className="table-responsive">
              <table className="table table-sm table-bordered text-center align-middle mb-0" style={{ fontSize: '0.75rem' }}>
                <thead className="table-light">
                  <tr>
                    <th>If You Score</th>
                    <th>Future SGPA</th>
                    <th>Projected CGPA</th>
                  </tr>
                </thead>
                <tbody>
                  {projectionScenarios.map((sc, idx) => (
                    <tr key={idx}>
                      <td>{sc.scorePct}</td>
                      <td>{sc.futureSgpa}</td>
                      <td className="fw-bold text-primary">{sc.projectedCgpa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Section: Fees & Payment History */}
      <div className="metric-card mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-2">
          <div>
            <h6 className="fw-bold mb-0"><i className="bi bi-wallet2 text-success me-2"></i> 4. Tuition Fees & Remittance Ledger</h6>
            <span className="text-muted small">Academic Year: 2025–2026 | Term Installments</span>
          </div>

          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-outline-secondary" onClick={() => window.print()}>
              <i className="bi bi-printer me-1"></i> Print Fee Receipt
            </button>
            {cards.fee_outstanding > 0 && (
              <button className="btn btn-sm btn-success" onClick={() => setShowFeeModal(true)}>
                <i className="bi bi-credit-card me-1"></i> Pay Online
              </button>
            )}
          </div>
        </div>

        <div className="row g-3 mb-3 small">
          <div className="col-12 col-sm-6 col-md-3">
            <div className="p-3 bg-light rounded-3 border">
              <div className="text-muted">Total Annual Demand</div>
              <h5 className="fw-bold text-dark mb-0">₹{(cards.total_fee_due || 85000).toLocaleString()}</h5>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-md-3">
            <div className="p-3 bg-light rounded-3 border">
              <div className="text-muted">Total Remitted / Paid</div>
              <h5 className="fw-bold text-success mb-0">₹{(cards.total_fee_paid || 85000).toLocaleString()}</h5>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-md-3">
            <div className="p-3 bg-light rounded-3 border">
              <div className="text-muted">Outstanding Balance</div>
              <h5 className="fw-bold text-danger mb-0">₹{(cards.fee_outstanding || 0).toLocaleString()}</h5>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-md-3">
            <div className="p-3 bg-light rounded-3 border">
              <div className="text-muted">Payment Standing</div>
              <span className={`badge mt-1 ${cards.fee_outstanding > 0 ? 'badge-risk-high' : 'bg-success text-white'}`}>
                {cards.fee_status || 'PAID IN FULL'}
              </span>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 small">
            <thead className="table-light">
              <tr>
                <th>Payment Date</th>
                <th>Transaction Ref</th>
                <th>Payment Description</th>
                <th>Amount Remitted</th>
                <th>Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {feeTxns.map((t, idx) => (
                <tr key={idx}>
                  <td>{t.payment_date || '2025-08-10'}</td>
                  <td className="font-mono">{t.txn_id || `TXN_${idx + 1}`}</td>
                  <td>{t.description || 'Semester Tuition Fee Installment'}</td>
                  <td>₹{(t.amount || 42500).toLocaleString()}</td>
                  <td><span className="badge bg-light text-success border">✓ Paid Online</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Section: Library & Books Issued */}
      <div className="metric-card mb-4">
        <h6 className="fw-bold mb-3"><i className="bi bi-book text-info me-2"></i> 5. University Library & Circulations</h6>
        <div className="row g-3 mb-3 small">
          <div className="col-6 col-md-3">
            <div className="p-3 bg-light rounded-3 border">
              <div className="text-muted">Books Borrowed</div>
              <h5 className="fw-bold text-dark mb-0">{libInfo.total_books_borrowed || 12} Books</h5>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-3 bg-light rounded-3 border">
              <div className="text-muted">Currently Issued</div>
              <h5 className="fw-bold text-primary mb-0">{libInfo.active_borrowed_count || 2} Books</h5>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-3 bg-light rounded-3 border">
              <div className="text-muted">Overdue Count</div>
              <h5 className="fw-bold text-warning mb-0">{libInfo.overdue_books_count || 0} Books</h5>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-3 bg-light rounded-3 border">
              <div className="text-muted">Outstanding Fine</div>
              <h5 className="fw-bold text-success mb-0">₹{libInfo.unpaid_fines || 0}</h5>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 small">
            <thead className="table-light">
              <tr>
                <th>Accession No</th>
                <th>Book Title & Author</th>
                <th>Issued Date</th>
                <th>Due Return Date</th>
                <th>Circulation Status</th>
              </tr>
            </thead>
            <tbody>
              {issuedBooks.map((b, idx) => (
                <tr key={idx}>
                  <td className="font-mono fw-bold">{b.accession_no}</td>
                  <td>{b.title}</td>
                  <td>{b.issue_date}</td>
                  <td>{b.due_date}</td>
                  <td><span className="badge bg-light text-primary border">{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 8. Section: Academic Risk Standing (Plain English) */}
      <div className="metric-card">
        <h6 className="fw-bold mb-3"><i className="bi bi-shield-check text-primary me-2"></i> 6. Academic Health & Standing</h6>
        {isLowRisk ? (
          <div className="p-3 bg-light rounded-3 border border-success">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge bg-success text-white px-3 py-1 fs-6">🟢 LOW RISK</span>
              <span className="fw-bold text-success">Healthy Academic Standing</span>
            </div>
            <p className="text-muted small mb-2">Why is your risk low?</p>
            <ul className="list-unstyled small text-muted mb-0">
              <li className="mb-1"><i className="bi bi-check-circle-fill text-success me-2"></i> Attendance is maintained above the mandatory 75% requirement ({currentAttPct}%)</li>
              <li className="mb-1"><i className="bi bi-check-circle-fill text-success me-2"></i> Zero standing backlogs / arrears across previous semesters</li>
              <li className="mb-1"><i className="bi bi-check-circle-fill text-success me-2"></i> Consistent internal assessment scores and laboratory coursework submissions</li>
              <li><i className="bi bi-check-circle-fill text-success me-2"></i> Stable GPA performance trajectory ({cards.cgpa} / 10)</li>
            </ul>
          </div>
        ) : (
          <div className="p-3 bg-light rounded-3 border border-danger">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge bg-danger text-white px-3 py-1 fs-6">🔴 HIGH RISK ADVISORY</span>
              <span className="fw-bold text-danger">Immediate Academic Intervention Required</span>
            </div>
            <p className="text-muted small mb-1">Key Contributing Risk Factors:</p>
            <ul className="small text-danger mb-2">
              {currentAttPct < 75 && <li>Attendance ({currentAttPct}%) is currently below the mandatory 75.0% threshold.</li>}
              {(cards.backlogs_count || 0) > 0 && <li>{cards.backlogs_count} standing course backlogs requiring clearance.</li>}
              <li>Low internal assessment marks in enrolled theory courses.</li>
            </ul>
            <p className="text-muted small mb-1">Recommended Action Steps:</p>
            <ul className="small text-dark mb-0">
              <li>Schedule an advisee mentoring meeting with your faculty counselor.</li>
              <li>Attend mandatory Saturday make-up sessions to restore attendance above 75%.</li>
              <li>Register for department peer tutoring and remedial tutorials.</li>
            </ul>
          </div>
        )}
      </div>

      {/* Modals */}
      {showTranscriptModal && (
        <PrintableTranscriptModal
          student={st}
          exams={exams}
          summaryCards={cards}
          onClose={() => setShowTranscriptModal(false)}
        />
      )}

      {showHallTicketModal && (
        <PrintableHallTicketModal
          student={st}
          exams={exams}
          onClose={() => setShowHallTicketModal(false)}
        />
      )}

      {showFeeModal && (
        <FeePaymentModal
          student={st}
          summaryCards={cards}
          onClose={() => setShowFeeModal(false)}
          onPaymentSuccess={() => loadStudent360(st.student_id)}
        />
      )}
    </div>
  );
}
