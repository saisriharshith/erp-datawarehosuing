import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchAPI } from '../services/api';

export default function FacultyPortal() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentForWarning, setSelectedStudentForWarning] = useState(null);
  const [mentorshipLogs, setMentorshipLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('FACULTY_MENTORSHIP_LOGS');
      return saved ? JSON.parse(saved) : [
        {
          id: 1,
          student_id: 'STU20210016',
          student_name: 'Rohan Verma',
          date: '2026-08-24',
          topic: 'Attendance Shortage & Lab Make-up',
          action: 'Agreed to attend 4 Saturday make-up laboratory sessions.',
          status: 'IN_PROGRESS'
        },
        {
          id: 2,
          student_id: 'STU20220017',
          student_name: 'Priya Patel',
          date: '2026-08-22',
          topic: 'Remedial Tutorial for Database Systems',
          action: 'Assigned peer tutor Karthik Nair for unit test revision.',
          status: 'RESOLVED'
        }
      ];
    } catch {
      return [];
    }
  });

  const [newLog, setNewLog] = useState({ student_id: '', topic: '', action: '' });
  const [showLogModal, setShowLogModal] = useState(false);

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
      .catch(err => {
        console.error(err);
        addToast('Failed to load faculty data', 'danger');
      })
      .finally(() => setLoading(false));
  }, [deptId]);

  const handleSaveLog = (e) => {
    e.preventDefault();
    if (!newLog.student_id || !newLog.topic) {
      addToast('Please enter student ID and discussion topic', 'warning');
      return;
    }

    const matchedStu = students.find(s => s.student_id === newLog.student_id) || { full_name: 'Advisee Student' };
    const entry = {
      id: Date.now(),
      student_id: newLog.student_id,
      student_name: matchedStu.full_name,
      date: new Date().toISOString().split('T')[0],
      topic: newLog.topic,
      action: newLog.action || 'Counseling notes recorded.',
      status: 'OPEN'
    };

    const updated = [entry, ...mentorshipLogs];
    setMentorshipLogs(updated);
    localStorage.setItem('FACULTY_MENTORSHIP_LOGS', JSON.stringify(updated));
    addToast(`Mentorship session recorded for ${matchedStu.full_name}`, 'success');
    setNewLog({ student_id: '', topic: '', action: '' });
    setShowLogModal(false);
  };

  const handleDispatchWarning = (stu) => {
    addToast(`Official Attendance Warning Notice dispatched to ${stu.full_name} (${stu.email})`, 'success');
    setSelectedStudentForWarning(null);
  };

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
            <button className="btn btn-light btn-sm fw-semibold shadow-sm" onClick={() => setShowLogModal(true)}>
              <i className="bi bi-journal-plus text-primary me-1"></i> Record Mentorship Session
            </button>
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
          <div className="metric-card mb-3">
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
                  {shortageStudents.slice(0, 6).map(s => (
                    <tr key={s.student_id}>
                      <td className="fw-semibold">{s.full_name}</td>
                      <td className="font-mono">{s.student_id}</td>
                      <td>
                        <span className="fw-bold text-danger">{s.attendance_percentage}%</span>
                      </td>
                      <td>{s.cgpa}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-danger py-0 px-2 shadow-sm"
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

          {/* Faculty Advisee Mentorship Counseling Log */}
          <div className="metric-card">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold mb-0"><i className="bi bi-journal-text text-primary me-1"></i> Advisee Mentorship & Counseling Log</h6>
              <button className="btn btn-sm btn-outline-primary py-0 px-2" onClick={() => setShowLogModal(true)}>
                + New Entry
              </button>
            </div>

            <div className="list-group list-group-flush small">
              {mentorshipLogs.slice(0, 4).map(log => (
                <div key={log.id} className="list-group-item px-0 bg-transparent py-2 border-bottom">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-bold text-dark">{log.student_name} (<span className="font-mono">{log.student_id}</span>)</span>
                    <span className="badge bg-light text-muted border">{log.date}</span>
                  </div>
                  <div className="text-muted small"><strong>Topic:</strong> {log.topic}</div>
                  <div className="text-muted small"><strong>Action:</strong> {log.action}</div>
                </div>
              ))}
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
              {facList.slice(0, 7).map(f => (
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
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fs-6"><i className="bi bi-exclamation-triangle-fill me-2"></i> Official Attendance Warning Notice</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedStudentForWarning(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="border p-3 rounded-3 bg-light font-mono small mb-3">
                  <div className="text-center fw-bold border-bottom pb-2 mb-2">OFFICE OF ACADEMIC AFFAIRS</div>
                  <div><strong>To:</strong> {selectedStudentForWarning.full_name} ({selectedStudentForWarning.student_id})</div>
                  <div><strong>Department:</strong> {selectedStudentForWarning.department_name}</div>
                  <div><strong>Current Attendance:</strong> <span className="text-danger fw-bold">{selectedStudentForWarning.attendance_percentage}%</span></div>
                  <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                  <hr />
                  <p className="mb-0 text-muted" style={{ fontSize: '0.8rem' }}>
                    Notice: Your class attendance has fallen below the mandatory institutional threshold of 75.0%. Failure to attend upcoming lectures will result in end-semester debarment under Academic Regulation Sec. 4.2.
                  </p>
                </div>
              </div>
              <div className="modal-footer bg-light p-3">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedStudentForWarning(null)}>Cancel</button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDispatchWarning(selectedStudentForWarning)}>
                  <i className="bi bi-send me-1"></i> Dispatch Warning Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Mentorship Session Modal */}
      {showLogModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-primary text-white" style={{ background: '#4f46e5' }}>
                <h5 className="modal-title fs-6"><i className="bi bi-journal-plus me-2"></i> Record Advisee Counseling Session</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowLogModal(false)}></button>
              </div>
              <form onSubmit={handleSaveLog}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Select Advisee Student</label>
                    <select
                      className="form-select form-select-sm"
                      value={newLog.student_id}
                      onChange={(e) => setNewLog({ ...newLog, student_id: e.target.value })}
                      required
                    >
                      <option value="">-- Choose Advisee --</option>
                      {students.slice(0, 15).map(s => (
                        <option key={s.student_id} value={s.student_id}>{s.full_name} ({s.student_id}) - {s.attendance_percentage}% Att</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Discussion Topic</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Mid-term remedial classes / Backlog clearing strategy"
                      value={newLog.topic}
                      onChange={(e) => setNewLog({ ...newLog, topic: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Agreed Action Items / Next Steps</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="3"
                      placeholder="e.g. Advisee agreed to submit 2 pending lab assignments and attend peer tutoring."
                      value={newLog.action}
                      onChange={(e) => setNewLog({ ...newLog, action: e.target.value })}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer bg-light p-3">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowLogModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ background: '#4f46e5', borderColor: '#4f46e5' }}>
                    Save Session Note
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
