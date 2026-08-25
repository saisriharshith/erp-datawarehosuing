import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../services/api';

export default function FacultyPortal() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentForWarning, setSelectedStudentForWarning] = useState(null);

  const deptId = user?.department_id || 'DEPT_CSE';

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchAPI(`/faculty/summary?department_id=${deptId}`),
      fetchAPI(`/students?department_id=${deptId}&limit=50`)
    ])
      .then(([facRes, stuRes]) => {
        setData(facRes);
        setStudents(stuRes.students || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [deptId]);

  if (loading || !data) {
    return (
      <div className="p-4 text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted small">Loading faculty department dashboard...</p>
      </div>
    );
  }

  const facList = data.faculty_list || [];
  const shortageStudents = students.filter(s => (s.attendance_percentage || 0) < 75.0);
  const highRiskAdvisees = students.filter(s => s.risk_level === 'HIGH');

  return (
    <div className="p-3 p-md-4">
      {/* Faculty Department Header Banner */}
      <div className="p-4 rounded-4 text-white mb-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)' }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <span className="badge bg-info text-dark mb-2 fw-semibold">Faculty & Department Command Portal</span>
            <h3 className="fw-bold mb-1">Welcome, {user?.name || 'Department Faculty'}</h3>
            <p className="mb-0 text-white-50 small">
              Department: <span className="text-white">{user?.department_name || 'Computer Science & Engineering'}</span> | Role: <span className="text-white">{user?.role}</span>
            </p>
          </div>

          <div className="d-flex gap-2">
            <span className="badge bg-white text-dark p-2 fs-6">
              <i className="bi bi-person-video3 text-primary me-1"></i> {data.total_faculty} Faculty Members
            </span>
          </div>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="metric-card">
            <div className="d-flex justify-content-between text-muted small mb-1">
              <span>Department Students</span>
              <i className="bi bi-people text-primary"></i>
            </div>
            <h3 className="fw-bold mb-1">{students.length}</h3>
            <span className="badge bg-light text-muted border">Enrolled Advisees</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="metric-card">
            <div className="d-flex justify-content-between text-muted small mb-1">
              <span>Attendance Shortages</span>
              <i className="bi bi-clock-history text-danger"></i>
            </div>
            <h3 className="fw-bold mb-1 text-danger">{shortageStudents.length}</h3>
            <span className="badge badge-risk-high">&lt; 75% Debarment Risk</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="metric-card">
            <div className="d-flex justify-content-between text-muted small mb-1">
              <span>High Risk Advisees</span>
              <i className="bi bi-exclamation-octagon text-warning"></i>
            </div>
            <h3 className="fw-bold mb-1 text-warning">{highRiskAdvisees.length}</h3>
            <span className="badge badge-risk-med">Counseling Required</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="metric-card">
            <div className="d-flex justify-content-between text-muted small mb-1">
              <span>Avg Teaching Workload</span>
              <i className="bi bi-book text-success"></i>
            </div>
            <h3 className="fw-bold mb-1">{data.average_weekly_workload_hours} hrs/wk</h3>
            <span className="badge bg-light text-success border">Standard Academic Load</span>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {/* Attendance Shortage & Warning Generator */}
        <div className="col-12 col-lg-7">
          <div className="metric-card">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold mb-0 text-danger"><i className="bi bi-envelope-exclamation me-1"></i> Attendance Shortage Notices (&lt; 75%)</h6>
              <span className="badge badge-risk-high">{shortageStudents.length} Alert Cases</span>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Student Name</th>
                    <th>ID</th>
                    <th>Attendance</th>
                    <th>CGPA</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {shortageStudents.slice(0, 8).map(s => (
                    <tr key={s.student_id}>
                      <td className="fw-semibold">{s.full_name}</td>
                      <td className="font-mono">{s.student_id}</td>
                      <td>
                        <span className="fw-bold text-danger">{s.attendance_percentage}%</span>
                      </td>
                      <td>{s.cgpa}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-danger py-0 px-2"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => setSelectedStudentForWarning(s)}
                        >
                          <i className="bi bi-file-earmark-text me-1"></i> Generate Notice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Department Faculty List */}
        <div className="col-12 col-lg-5">
          <div className="metric-card">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold mb-0"><i className="bi bi-person-video3 me-1"></i> Department Faculty Staff</h6>
              <span className="badge bg-light text-dark border">Workload</span>
            </div>

            <div className="list-group list-group-flush small">
              {facList.slice(0, 6).map(f => (
                <div key={f.faculty_id} className="list-group-item px-0 bg-transparent d-flex justify-content-between align-items-center py-2 border-bottom">
                  <div>
                    <div className="fw-semibold">{f.faculty_name}</div>
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>{f.designation} ({f.experience_years} yrs exp)</div>
                  </div>
                  <span className="badge bg-light text-primary border">{f.workload_hours_per_week} hrs/wk</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Warning Notice Generator Modal */}
      {selectedStudentForWarning && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fs-6"><i className="bi bi-exclamation-triangle-fill me-2"></i> Official Attendance Warning Notice</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedStudentForWarning(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="border p-3 rounded bg-light font-mono small mb-3">
                  <div className="text-center fw-bold border-bottom pb-2 mb-2">OFFICE OF ACADEMIC AFFAIRS</div>
                  <div><strong>To:</strong> {selectedStudentForWarning.full_name} ({selectedStudentForWarning.student_id})</div>
                  <div><strong>Department:</strong> {selectedStudentForWarning.department_name}</div>
                  <div><strong>Current Attendance:</strong> <span className="text-danger fw-bold">{selectedStudentForWarning.attendance_percentage}%</span></div>
                  <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                  <hr />
                  <p className="mb-0 text-muted" style={{ fontSize: '0.8rem' }}>
                    Notice: Your class attendance has fallen below the mandatory institutional threshold of 75.0%. Failure to attend upcoming lectures will result in end-semester debarment under Regulation Sec. 4.2.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedStudentForWarning(null)}>Close</button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => { alert(`Official Warning Notice dispatched to ${selectedStudentForWarning.full_name}'s email!`); setSelectedStudentForWarning(null); }}>
                  <i className="bi bi-send me-1"></i> Dispatch Notice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
