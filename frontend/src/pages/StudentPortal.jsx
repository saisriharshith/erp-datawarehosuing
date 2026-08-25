import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchAPI } from '../services/api';
import PrintableTranscriptModal from '../components/PrintableTranscriptModal';
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

  // State for Dean's Student List & Filter View
  const [studentsList, setStudentsList] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [listLoading, setListLoading] = useState(false);

  // State for active Student 360 Inspection
  const [inspectedStudentId, setInspectedStudentId] = useState(isDean ? null : (user?.student_id || 'STU20210001'));
  const [studentData, setStudentData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [targetCgpa, setTargetCgpa] = useState(8.5);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);

  // Debounced Search for Dean List
  useEffect(() => {
    if (!isDean) return;
    const handler = setTimeout(() => {
      loadStudentsList();
    }, 200);
    return () => clearTimeout(handler);
  }, [searchTerm, deptFilter, riskFilter, page, isDean]);

  const loadStudentsList = async () => {
    setListLoading(true);
    let url = `/students?page=${page}&limit=15&search=${encodeURIComponent(searchTerm)}&`;
    if (deptFilter) url += `department_id=${deptFilter}&`;
    if (riskFilter) url += `risk_level=${riskFilter}&`;

    try {
      const res = await fetchAPI(url);
      setStudentsList(res.students || []);
      setTotalStudents(res.total || 0);
    } catch (err) {
      console.error(err);
      addToast('Failed to load students directory', 'danger');
    } finally {
      setListLoading(false);
    }
  };

  // Load individual student 360 profile when selected (or for student user)
  useEffect(() => {
    const stuId = isDean ? inspectedStudentId : (user?.student_id || 'STU20210001');
    if (!stuId) return;

    setProfileLoading(true);
    fetchAPI(`/student/portal-summary?student_id=${stuId}`)
      .then(res => setStudentData(res))
      .catch(err => {
        console.error(err);
        addToast('Failed to load student 360 record', 'danger');
      })
      .finally(() => setProfileLoading(false));
  }, [inspectedStudentId, user, isDean]);

  const handleOpenStudent360 = (stuId, name) => {
    setInspectedStudentId(stuId);
    addToast(`Loaded Student 360 Hub for ${name || stuId}`, 'info');
  };

  const handleBackToList = () => {
    setInspectedStudentId(null);
    setStudentData(null);
  };

  const st = studentData?.student || {};
  const cards = studentData?.summary_cards || {};
  const subjects = studentData?.subject_attendance || [];
  const exams = studentData?.examination_records || [];
  const recs = studentData?.personalized_recommendations || [];
  const sgpaTrend = studentData?.sgpa_trend || [];

  // Goal Planner Calculation
  const currentCgpa = cards.cgpa || 8.0;
  const currentSem = st.semester || 5;
  const remainingSems = Math.max(1, 8 - currentSem);
  const requiredSgpa = Number((((targetCgpa * 8) - (currentCgpa * currentSem)) / remainingSems).toFixed(2));

  // SGPA Line Chart Data
  const sgpaChartData = {
    labels: sgpaTrend.length ? sgpaTrend.map(t => t.semester) : ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', `Sem ${currentSem}`],
    datasets: [
      {
        label: 'Semester SGPA',
        data: sgpaTrend.length ? sgpaTrend.map(t => t.sgpa) : [7.8, 8.1, 7.9, 8.4, currentCgpa],
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.12)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#4f46e5',
        pointRadius: 4
      }
    ]
  };

  // -------------------------------------------------------------
  // VIEW 1: DEAN ALL STUDENTS LIST (When no single student is selected)
  // -------------------------------------------------------------
  if (isDean && !inspectedStudentId) {
    return (
      <div className="p-3 p-md-4">
        {/* Dean Header Banner */}
        <div className="p-4 rounded-4 text-white mb-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <span className="badge bg-primary text-white mb-2 fw-semibold"><i className="bi bi-shield-check me-1"></i> Dean Institutional View</span>
              <h3 className="fw-bold mb-1">Student 360 Master Directorate</h3>
              <p className="mb-0 text-white-50 small">
                Complete roster of all {totalStudents || 600} students across 5 engineering departments. Click any student to launch their personalized 360 profile.
              </p>
            </div>
            <div>
              <span className="badge bg-white text-dark p-2 px-3 fs-6 shadow-sm">
                <i className="bi bi-people-fill text-primary me-1"></i> {totalStudents} Active Students
              </span>
            </div>
          </div>
        </div>

        {/* Filter & Live Search Bar */}
        <div className="metric-card mb-4">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-5">
              <div className="input-group input-group-sm shadow-sm rounded overflow-hidden">
                <span className="input-group-text bg-white"><i className="bi bi-search text-muted"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Type name, ID (e.g. STU20210001), or email..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                />
              </div>
            </div>

            <div className="col-6 col-md-4">
              <select className="form-select form-select-sm" value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}>
                <option value="">All 5 Academic Departments</option>
                <option value="DEPT_CSE">Computer Science & Engineering</option>
                <option value="DEPT_ECE">Electronics & Communication</option>
                <option value="DEPT_MECH">Mechanical Engineering</option>
                <option value="DEPT_CIVIL">Civil Engineering</option>
                <option value="DEPT_AIDS">Artificial Intelligence & Data Science</option>
              </select>
            </div>

            <div className="col-6 col-md-3">
              <select className="form-select form-select-sm" value={riskFilter} onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}>
                <option value="">All Risk Standings</option>
                <option value="HIGH">🔴 High Risk Standing</option>
                <option value="MEDIUM">🟡 Medium Risk</option>
                <option value="LOW">🟢 Low Risk Standing</option>
              </select>
            </div>
          </div>
        </div>

        {/* Master Student List Table */}
        <div className="metric-card">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light">
                <tr>
                  <th>Student ID</th>
                  <th>Full Name</th>
                  <th>Department</th>
                  <th>Term</th>
                  <th>Attendance Rate</th>
                  <th>CGPA</th>
                  <th>Risk Tier</th>
                  <th className="text-end">360 Inspection</th>
                </tr>
              </thead>
              <tbody>
                {listLoading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5 text-muted">
                      <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                      Loading university student list...
                    </td>
                  </tr>
                ) : studentsList.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5 text-muted">
                      <i className="bi bi-person-x fs-3 d-block mb-1"></i>
                      No students found matching your search.
                    </td>
                  </tr>
                ) : (
                  studentsList.map(s => (
                    <tr key={s.student_id} style={{ cursor: 'pointer' }} onClick={() => handleOpenStudent360(s.student_id, s.full_name)}>
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
                      <td className="fw-bold font-mono">{s.cgpa}</td>
                      <td>
                        <span className={`badge ${s.risk_level === 'HIGH' ? 'badge-risk-high' : s.risk_level === 'MEDIUM' ? 'badge-risk-med' : 'badge-risk-low'}`}>
                          {s.risk_level}
                        </span>
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-primary py-1 px-3 shadow-sm rounded-pill"
                          style={{ fontSize: '0.75rem', background: '#4f46e5', borderColor: '#4f46e5' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenStudent360(s.student_id, s.full_name);
                          }}
                        >
                          <i className="bi bi-person-bounding-box me-1"></i> Open 360 Hub
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top small text-muted">
            <span>Showing {studentsList.length} of {totalStudents} records (Page {page})</span>
            <div className="d-flex gap-2">
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page <= 1 || listLoading}
                onClick={() => setPage(p => p - 1)}
              >
                <i className="bi bi-chevron-left"></i> Previous
              </button>
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={studentsList.length < 15 || listLoading}
                onClick={() => setPage(p => p + 1)}
              >
                Next <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: INDIVIDUAL STUDENT 360 DRILLDOWN HUB
  // -------------------------------------------------------------
  if (profileLoading || !studentData) {
    return (
      <div className="p-4 text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted small">Loading Student 360 Workspace...</p>
      </div>
    );
  }

  return (
    <div className="p-3 p-md-4">
      {/* Back Button for Dean */}
      {isDean && (
        <div className="mb-3">
          <button className="btn btn-sm btn-outline-dark d-flex align-items-center gap-1 shadow-sm" onClick={handleBackToList}>
            <i className="bi bi-arrow-left"></i>
            <span>Back to All Students Directory</span>
          </button>
        </div>
      )}

      {/* Student Banner */}
      <div className="p-4 rounded-4 text-white mb-4 shadow-sm" style={{ background: isDean ? 'linear-gradient(135deg, #0f172a 0%, #334155 100%)' : 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)' }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <span className="badge bg-white text-dark mb-2 fw-semibold">
              {isDean ? 'Dean Student 360 Inspection' : 'Personal Student 360 Workspace'}
            </span>
            <h3 className="fw-bold mb-1">{isDean ? `Student Record: ${st.full_name}` : `Welcome back, ${st.full_name}!`}</h3>
            <p className="mb-0 text-white-50 small">
              ID: <span className="text-white font-mono">{st.student_id}</span> | Department: <span className="text-white">{st.department_name}</span> | Semester: <span className="text-white">{st.semester}</span> | Batch: <span className="text-white">{st.batch_year || '2021-2025'}</span>
            </p>
          </div>

          <div className="d-flex gap-2">
            <button className="btn btn-light btn-sm fw-semibold shadow-sm" onClick={() => setShowTranscriptModal(true)}>
              <i className="bi bi-printer-fill text-primary me-1"></i> Official Grade Transcript
            </button>
          </div>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="metric-card">
            <div className="d-flex justify-content-between text-muted small mb-1">
              <span>Overall Attendance</span>
              <i className="bi bi-calendar-check text-primary"></i>
            </div>
            <h3 className={`fw-bold mb-1 ${cards.attendance_percentage >= 75 ? 'text-success' : 'text-danger'}`}>
              {cards.attendance_percentage}%
            </h3>
            <span className={`badge ${cards.is_exam_eligible ? 'bg-light text-success border' : 'badge-risk-high'}`}>
              {cards.is_exam_eligible ? 'Exam Eligible' : 'Debarment Warning'}
            </span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="metric-card">
            <div className="d-flex justify-content-between text-muted small mb-1">
              <span>Cumulative CGPA</span>
              <i className="bi bi-award text-warning"></i>
            </div>
            <h3 className="fw-bold mb-1 text-primary">{cards.cgpa} / 10</h3>
            <span className="badge bg-light text-muted border">Backlogs: {cards.backlogs_count || 0}</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="metric-card">
            <div className="d-flex justify-content-between text-muted small mb-1">
              <span>Tuition Fee Status</span>
              <i className="bi bi-credit-card text-success"></i>
            </div>
            <h3 className="fw-bold mb-1">{cards.fee_status}</h3>
            <span className="badge bg-light text-muted border">
              Outstanding: ₹{cards.fee_outstanding?.toLocaleString() || 0}
            </span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="metric-card">
            <div className="d-flex justify-content-between text-muted small mb-1">
              <span>Academic Risk Level</span>
              <i className="bi bi-shield-check text-info"></i>
            </div>
            <h3 className="fw-bold mb-1">{cards.risk_level}</h3>
            <span className={`badge ${cards.risk_level === 'HIGH' ? 'badge-risk-high' : cards.risk_level === 'MEDIUM' ? 'badge-risk-med' : 'badge-risk-low'}`}>
              {cards.risk_level === 'LOW' ? 'Healthy Standing' : 'Advisory Support'}
            </span>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {/* Left: Subject Attendance Roster & Debarment Buffer */}
        <div className="col-12 col-lg-8">
          <div className="metric-card mb-3">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold mb-0">Enrolled Courses & Class Attendance Compliance</h6>
              <span className="badge bg-light text-dark border">Threshold: 75%</span>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Course Code</th>
                    <th>Conducted</th>
                    <th>Attended</th>
                    <th>Compliance</th>
                    <th>Action Required</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((sub, idx) => (
                    <tr key={idx}>
                      <td className="fw-bold font-mono">{sub.subject_id}</td>
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
                        {sub.classes_needed_for_75 > 0 ? (
                          <span className="badge badge-risk-high">Attend next {sub.classes_needed_for_75} classes</span>
                        ) : (
                          <span className="badge bg-light text-success border"><i className="bi bi-check"></i> Safe</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SGPA Progression Chart */}
          <div className="metric-card mb-3">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold mb-0">Longitudinal SGPA Performance Trajectory</h6>
              <span className="badge bg-light text-primary border">Semester-on-Semester</span>
            </div>
            <div style={{ height: '220px' }}>
              <Line data={sgpaChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>

        {/* Right: Interactive Target CGPA Goal Planner */}
        <div className="col-12 col-lg-4">
          <div className="metric-card mb-3 border-primary">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold mb-0 text-primary"><i className="bi bi-calculator me-1"></i> Target CGPA Goal Planner</h6>
              <span className="badge bg-primary text-white">Interactive</span>
            </div>

            <p className="text-muted small">
              Plan required Semester Grade Point Average (SGPA) for upcoming semesters to achieve graduation goal.
            </p>

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

            <div className="p-3 bg-light rounded border text-center mb-3">
              <div className="text-muted small">Required Average SGPA in Next {remainingSems} Semesters:</div>
              <h2 className={`fw-bold my-1 ${requiredSgpa > 10 ? 'text-danger' : requiredSgpa > 8.5 ? 'text-warning' : 'text-success'}`}>
                {requiredSgpa > 10 ? 'Mathematically Unattainable' : `${requiredSgpa} / 10`}
              </h2>
              <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                Current CGPA: {currentCgpa} (Sem {currentSem})
              </span>
            </div>

            <div className="small text-muted">
              {requiredSgpa <= 10 && requiredSgpa >= 8.5 && (
                <div className="alert alert-warning py-2 mb-0 small">
                  <i className="bi bi-info-circle me-1"></i> Requires consistent A+ grades across major 4-credit courses.
                </div>
              )}
              {requiredSgpa <= 8.5 && (
                <div className="alert alert-success py-2 mb-0 small">
                  <i className="bi bi-check-circle me-1"></i> Attainable with standard study hours and attendance consistency.
                </div>
              )}
            </div>
          </div>

          {/* Academic Advisory Recommendations */}
          <div className="metric-card">
            <h6 className="fw-bold mb-3"><i className="bi bi-lightbulb text-warning me-1"></i> Academic Advisories</h6>
            <div className="list-group list-group-flush small">
              {recs.map((r, idx) => (
                <div key={idx} className="list-group-item px-0 bg-transparent text-muted py-2 border-bottom">
                  <i className="bi bi-arrow-right-short text-primary me-1"></i> {r}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showTranscriptModal && (
        <PrintableTranscriptModal
          student={st}
          exams={exams}
          summaryCards={cards}
          onClose={() => setShowTranscriptModal(false)}
        />
      )}
    </div>
  );
}
