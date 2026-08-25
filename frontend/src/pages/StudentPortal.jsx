import React, { useState, useEffect } from 'react';
import { useAuth, DEMO_PRESETS } from '../context/AuthContext';
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

  // For students, lock to their ID; for Dean, allow inspecting ANY student
  const [selectedStudentId, setSelectedStudentId] = useState(user?.student_id || 'STU20210001');
  const [studentSearch, setStudentSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [targetCgpa, setTargetCgpa] = useState(8.5);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);

  // Sync when user changes
  useEffect(() => {
    if (!isDean && user?.student_id) {
      setSelectedStudentId(user.student_id);
    }
  }, [user, isDean]);

  // Load student profile
  useEffect(() => {
    setLoading(true);
    fetchAPI(`/student/portal-summary?student_id=${selectedStudentId}`)
      .then(res => setData(res))
      .catch(err => {
        console.error(err);
        addToast('Failed to load student profile', 'danger');
      })
      .finally(() => setLoading(false));
  }, [selectedStudentId]);

  // Debounced search for Dean student selector
  useEffect(() => {
    if (!isDean || !studentSearch.trim()) {
      setSearchResults([]);
      return;
    }

    const handler = setTimeout(() => {
      fetchAPI(`/students/search?q=${encodeURIComponent(studentSearch)}`)
        .then(res => setSearchResults(res.results || []))
        .catch(err => console.error(err));
    }, 200);

    return () => clearTimeout(handler);
  }, [studentSearch, isDean]);

  const handleSelectStudent = (stuId, name) => {
    setSelectedStudentId(stuId);
    setStudentSearch('');
    setSearchResults([]);
    addToast(`Inspecting 360 profile for ${name || stuId}`, 'info');
  };

  if (loading && !data) {
    return (
      <div className="p-4 text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted small">Loading Student 360 profile...</p>
      </div>
    );
  }

  const st = data?.student || {};
  const cards = data?.summary_cards || {};
  const subjects = data?.subject_attendance || [];
  const exams = data?.examination_records || [];
  const recs = data?.personalized_recommendations || [];
  const sgpaTrend = data?.sgpa_trend || [];

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

  const demoStudents = DEMO_PRESETS.filter(p => p.role === 'STUDENT');

  return (
    <div className="p-3 p-md-4">
      {/* Dean Student 360 Selector Bar */}
      {isDean && (
        <div className="metric-card mb-4 bg-white border-primary shadow-sm">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <span className="badge bg-primary text-white mb-1"><i className="bi bi-shield-lock-fill me-1"></i> Dean Institutional 360 View</span>
              <h5 className="fw-bold mb-0">Select Any University Student to Inspect</h5>
              <p className="text-muted small mb-0">Search all 600 students across 5 engineering departments or pick a quick profile.</p>
            </div>

            {/* Instant Search Input */}
            <div className="position-relative" style={{ minWidth: '280px' }}>
              <div className="input-group input-group-sm shadow-sm rounded overflow-hidden">
                <span className="input-group-text bg-white"><i className="bi bi-search text-muted"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search student ID, name, or dept..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
              </div>

              {/* Autocomplete Dropdown */}
              {searchResults.length > 0 && (
                <div
                  className="position-absolute start-0 end-0 bg-white border rounded-3 shadow-lg mt-1 p-1"
                  style={{ zIndex: 1050, maxHeight: '240px', overflowY: 'auto' }}
                >
                  {searchResults.map(res => (
                    <button
                      key={res.student_id}
                      type="button"
                      className="dropdown-item p-2 small rounded text-start d-flex justify-content-between align-items-center"
                      onClick={() => handleSelectStudent(res.student_id, res.full_name)}
                    >
                      <div>
                        <strong>{res.full_name}</strong>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>{res.department_name} (Sem {res.current_semester})</div>
                      </div>
                      <span className="font-mono text-primary fw-semibold">{res.student_id}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Pick Demo Students */}
          <div className="d-flex flex-wrap gap-2 mt-3 pt-2 border-top">
            <span className="text-muted small align-self-center me-1">Quick Select:</span>
            {demoStudents.map(p => (
              <button
                key={p.email}
                type="button"
                className={`btn btn-sm rounded-pill px-3 py-1 ${selectedStudentId === p.student_id ? 'btn-primary shadow-sm' : 'btn-light border text-dark'}`}
                style={selectedStudentId === p.student_id ? { background: '#4f46e5', borderColor: '#4f46e5' } : {}}
                onClick={() => handleSelectStudent(p.student_id, p.name)}
              >
                {p.name} ({p.dept})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Student Banner */}
      <div className="p-4 rounded-4 text-white mb-4 shadow-sm" style={{ background: isDean ? 'linear-gradient(135deg, #0f172a 0%, #334155 100%)' : 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)' }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <span className="badge bg-white text-dark mb-2 fw-semibold">
              {isDean ? 'Institutional 360 Student Drilldown' : 'Personal Student 360 Workspace'}
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
