import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../services/api';

export default function StudentPortal() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [targetCgpa, setTargetCgpa] = useState(8.5);

  const studentId = user?.student_id || 'STU20210001';

  useEffect(() => {
    setLoading(true);
    fetchAPI(`/student/portal-summary?student_id=${studentId}`)
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading || !data) {
    return (
      <div className="p-4 text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted small">Loading your personalized academic profile...</p>
      </div>
    );
  }

  const st = data.student || {};
  const cards = data.summary_cards || {};
  const subjects = data.subject_attendance || [];
  const exams = data.examination_records || [];
  const fees = data.fee_transactions || [];
  const recs = data.personalized_recommendations || [];

  // Goal Planner Calculation
  const currentCgpa = cards.cgpa || 8.0;
  const currentSem = st.semester || 5;
  const remainingSems = Math.max(1, 8 - currentSem);
  const requiredSgpa = Number((((targetCgpa * 8) - (currentCgpa * currentSem)) / remainingSems).toFixed(2));

  return (
    <div className="p-3 p-md-4">
      {/* Student Welcome Banner */}
      <div className="p-4 rounded-4 text-white mb-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)' }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <span className="badge bg-white text-primary mb-2 fw-semibold">Personal Student 360 Workspace</span>
            <h3 className="fw-bold mb-1">Welcome back, {st.full_name}!</h3>
            <p className="mb-0 text-white-50 small">
              ID: <span className="text-white font-mono">{st.student_id}</span> | Department: <span className="text-white">{st.department_name}</span> | Semester: <span className="text-white">{st.semester}</span>
            </p>
          </div>

          <div className="d-flex gap-2">
            <button className="btn btn-light btn-sm fw-semibold" onClick={() => window.print()}>
              <i className="bi bi-printer me-1"></i> Print Transcript
            </button>
          </div>
        </div>
      </div>

      {/* 4 Summary Cards */}
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
            <span className="badge bg-light text-muted border">Backlogs: {cards.backlogs_count}</span>
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
                    <th>Subject</th>
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

          {/* Examination Marks */}
          <div className="metric-card">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold mb-0">Semester Examination Records & Grades</h6>
              <span className="badge bg-light text-dark border">Academic Transcript</span>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Subject</th>
                    <th>Internal (30)</th>
                    <th>End-Sem (70)</th>
                    <th>Total (100)</th>
                    <th>Grade</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.slice(0, 6).map((ex, idx) => (
                    <tr key={idx}>
                      <td className="fw-bold font-mono">{ex.subject_id}</td>
                      <td>{ex.internal_marks_scored} / 30</td>
                      <td>{ex.end_semester_marks_scored} / 70</td>
                      <td className="fw-bold">{ex.total_marks} / 100</td>
                      <td><span className="badge bg-light text-dark border font-mono">{ex.grade_letter}</span></td>
                      <td>
                        <span className={`badge ${ex.is_passed ? 'bg-light text-success border' : 'badge-risk-high'}`}>
                          {ex.is_passed ? 'Passed' : 'Backlog'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              Plan your required Semester Grade Point Average (SGPA) for upcoming semesters to achieve your graduation goal.
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
    </div>
  );
}
