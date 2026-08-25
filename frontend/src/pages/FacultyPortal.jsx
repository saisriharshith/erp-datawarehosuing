import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchAPI } from '../services/api';

export default function FacultyPortal() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState(user?.department_id || '');
  const [searchFaculty, setSearchFaculty] = useState('');
  const [selectedFacultyModal, setSelectedFacultyModal] = useState(null);

  const [mentorshipLogs, setMentorshipLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('FACULTY_MENTORSHIP_LOGS');
      return saved ? JSON.parse(saved) : [
        {
          id: 1,
          faculty_name: 'Dr. R. Ramanujan',
          student_id: 'STU20210016',
          student_name: 'Rohan Verma',
          date: '2026-08-24',
          topic: 'Attendance Shortage & Lab Make-up',
          action: 'Agreed to attend 4 Saturday make-up laboratory sessions.',
          status: 'IN_PROGRESS'
        },
        {
          id: 2,
          faculty_name: 'Dr. Meenakshi Sundaram',
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

  const [newLog, setNewLog] = useState({ student_id: '', student_name: '', topic: '', action: '' });
  const [showLogModal, setShowLogModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    let url = '/faculty/summary?';
    if (deptFilter) url += `department_id=${deptFilter}&`;

    fetchAPI(url)
      .then(res => setData(res))
      .catch(err => {
        console.error(err);
        addToast('Failed to load faculty records', 'danger');
      })
      .finally(() => setLoading(false));
  }, [deptFilter]);

  const handleSaveLog = (e) => {
    e.preventDefault();
    if (!newLog.student_id || !newLog.topic) {
      addToast('Please enter student ID and discussion topic', 'warning');
      return;
    }

    const entry = {
      id: Date.now(),
      faculty_name: user?.name || 'Department Faculty',
      student_id: newLog.student_id,
      student_name: newLog.student_name || 'Advisee Student',
      date: new Date().toISOString().split('T')[0],
      topic: newLog.topic,
      action: newLog.action || 'Counseling notes recorded.',
      status: 'OPEN'
    };

    const updated = [entry, ...mentorshipLogs];
    setMentorshipLogs(updated);
    localStorage.setItem('FACULTY_MENTORSHIP_LOGS', JSON.stringify(updated));
    addToast(`Counseling note recorded for ${entry.student_name}`, 'success');
    setNewLog({ student_id: '', student_name: '', topic: '', action: '' });
    setShowLogModal(false);
  };

  if (loading && !data) {
    return (
      <div className="p-4 text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted small">Loading Faculty & Academic Leadership analytics...</p>
      </div>
    );
  }

  const facList = data?.faculty_list || [];
  const filteredFaculty = facList.filter(f =>
    f.faculty_name.toLowerCase().includes(searchFaculty.toLowerCase()) ||
    f.designation.toLowerCase().includes(searchFaculty.toLowerCase()) ||
    f.faculty_id.toLowerCase().includes(searchFaculty.toLowerCase())
  );

  return (
    <div className="p-3 p-md-4">
      {/* Faculty Command Header Banner */}
      <div className="p-4 rounded-4 text-white mb-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <span className="badge bg-info text-dark mb-2 fw-semibold">Faculty & Academic Leadership Hub</span>
            <h3 className="fw-bold mb-1">
              {user?.role === 'ADMIN' ? 'University Faculty & Teaching Staff Directorate' : `Welcome, ${user?.name || 'Faculty Member'}`}
            </h3>
            <p className="mb-0 text-white-50 small">
              Department: <span className="text-white">{user?.department_name || 'All University Departments'}</span> | Total Active Faculty: <span className="text-white">{data?.total_faculty || 30}</span>
            </p>
          </div>

          <div className="d-flex gap-2">
            <button className="btn btn-light btn-sm fw-semibold shadow-sm" onClick={() => setShowLogModal(true)}>
              <i className="bi bi-journal-plus text-primary me-1"></i> Log Mentorship Note
            </button>
          </div>
        </div>
      </div>

      {/* 4 Faculty Summary KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="metric-card">
            <div className="d-flex justify-content-between text-muted small mb-1">
              <span>Faculty Biometric Attendance</span>
              <i className="bi bi-fingerprint text-success"></i>
            </div>
            <h3 className="fw-bold mb-1 text-success">{data?.average_faculty_attendance || 95.8}%</h3>
            <span className="badge bg-light text-success border">Biometric Punctuality</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="metric-card">
            <div className="d-flex justify-content-between text-muted small mb-1">
              <span>Avg Teaching Workload</span>
              <i className="bi bi-mortarboard-fill text-primary"></i>
            </div>
            <h3 className="fw-bold mb-1 text-primary">{data?.average_weekly_workload_hours || 16.0} hrs/wk</h3>
            <span className="badge bg-light text-muted border">Lectures & Labs</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="metric-card">
            <div className="d-flex justify-content-between text-muted small mb-1">
              <span>Research Publications</span>
              <i className="bi bi-journal-bookmark-fill text-info"></i>
            </div>
            <h3 className="fw-bold mb-1 text-info">{data?.total_research_publications || 128}</h3>
            <span className="badge bg-light text-info border">Scopus / IEEE Indexed</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="metric-card">
            <div className="d-flex justify-content-between text-muted small mb-1">
              <span>Staff on Approved Leave</span>
              <i className="bi bi-calendar-event text-warning"></i>
            </div>
            <h3 className="fw-bold mb-1 text-warning">{data?.faculty_on_leave_count || 2}</h3>
            <span className="badge bg-light text-muted border">Substitute Covered</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="metric-card mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light"><i className="bi bi-search"></i></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search faculty by name, designation, or ID..."
                value={searchFaculty}
                onChange={(e) => setSearchFaculty(e.target.value)}
              />
            </div>
          </div>

          <div className="col-12 col-md-6">
            <select className="form-select form-select-sm" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="">All 5 Academic Departments</option>
              <option value="DEPT_CSE">Computer Science & Engineering</option>
              <option value="DEPT_ECE">Electronics & Communication</option>
              <option value="DEPT_MECH">Mechanical Engineering</option>
              <option value="DEPT_CIVIL">Civil Engineering</option>
              <option value="DEPT_AIDS">Artificial Intelligence & Data Science</option>
            </select>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {/* Left: Department Faculty Roster Table */}
        <div className="col-12 col-lg-8">
          <div className="metric-card">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold mb-0"><i className="bi bi-person-video3 text-primary me-1"></i> Faculty Teaching Staff Roster (dim_faculty)</h6>
              <span className="badge bg-light text-dark border">{filteredFaculty.length} Professors</span>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Faculty ID</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Attendance</th>
                    <th>Workload</th>
                    <th>Research</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFaculty.map(f => (
                    <tr key={f.faculty_id} style={{ cursor: 'pointer' }} onClick={() => setSelectedFacultyModal(f)}>
                      <td className="font-mono fw-bold text-primary">{f.faculty_id}</td>
                      <td>
                        <div className="fw-semibold text-dark">{f.faculty_name}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>{f.email}</div>
                      </td>
                      <td><span className="badge bg-light text-dark border">{f.department_name}</span></td>
                      <td>{f.designation}</td>
                      <td>
                        <span className={`badge ${f.attendance_percentage >= 94 ? 'bg-light text-success border' : 'bg-light text-warning border'}`}>
                          {f.attendance_percentage}% ({f.biometric_status})
                        </span>
                      </td>
                      <td><span className="badge bg-light text-primary border">{f.workload_hours_per_week} hrs/wk</span></td>
                      <td><span className="badge bg-light text-info text-dark border">{f.research_publications} papers</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Faculty Mentorship & Counseling Activity Log */}
        <div className="col-12 col-lg-4">
          <div className="metric-card">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold mb-0"><i className="bi bi-journal-text text-primary me-1"></i> Advisee Counseling Sessions</h6>
              <button className="btn btn-sm btn-outline-primary py-0 px-2" onClick={() => setShowLogModal(true)}>
                + New Log
              </button>
            </div>

            <div className="list-group list-group-flush small">
              {mentorshipLogs.slice(0, 5).map(log => (
                <div key={log.id} className="list-group-item px-0 bg-transparent py-2 border-bottom">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-bold text-dark">{log.student_name} (<span className="font-mono">{log.student_id}</span>)</span>
                    <span className="badge bg-light text-muted border">{log.date}</span>
                  </div>
                  <div className="text-muted small"><strong>Counselor:</strong> {log.faculty_name}</div>
                  <div className="text-muted small"><strong>Topic:</strong> {log.topic}</div>
                  <div className="text-muted small"><strong>Action:</strong> {log.action}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Single Faculty Profile Modal */}
      {selectedFacultyModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-dark text-white p-3 px-4">
                <h5 className="modal-title fs-6 fw-bold"><i className="bi bi-person-badge me-2"></i> Faculty Profile: {selectedFacultyModal.faculty_name}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedFacultyModal(null)}></button>
              </div>
              <div className="modal-body p-4 bg-light">
                <div className="bg-white p-3 rounded-3 border mb-3">
                  <h5 className="fw-bold mb-1">{selectedFacultyModal.faculty_name}</h5>
                  <div className="text-muted small mb-2">{selectedFacultyModal.designation} - {selectedFacultyModal.department_name}</div>
                  <div className="text-muted small font-mono">{selectedFacultyModal.email} | ID: {selectedFacultyModal.faculty_id}</div>
                </div>

                <div className="row g-2 text-center small mb-3">
                  <div className="col-4">
                    <div className="p-2 bg-white rounded border">
                      <div className="text-muted">Biometric Attendance</div>
                      <div className="fw-bold text-success fs-6">{selectedFacultyModal.attendance_percentage}%</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-2 bg-white rounded border">
                      <div className="text-muted">Weekly Load</div>
                      <div className="fw-bold text-primary fs-6">{selectedFacultyModal.workload_hours_per_week} hrs</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-2 bg-white rounded border">
                      <div className="text-muted">Research Papers</div>
                      <div className="fw-bold text-info fs-6">{selectedFacultyModal.research_publications}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-3 border small">
                  <div className="d-flex justify-content-between mb-1">
                    <span>Assigned Advisees:</span>
                    <strong>{selectedFacultyModal.advisees_count} Students</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span>Monthly Classes Conducted:</span>
                    <strong>{selectedFacultyModal.monthly_classes_conducted} Sessions</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Casual Leave Balance:</span>
                    <strong>{selectedFacultyModal.leave_balance_days} Days</strong>
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-white p-3">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedFacultyModal(null)}>Close</button>
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
                <h5 className="modal-title fs-6"><i className="bi bi-journal-plus me-2"></i> Log Advisee Counseling Session</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowLogModal(false)}></button>
              </div>
              <form onSubmit={handleSaveLog}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Advisee Student ID</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. STU20210016"
                      value={newLog.student_id}
                      onChange={(e) => setNewLog({ ...newLog, student_id: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Student Name</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Rohan Verma"
                      value={newLog.student_name}
                      onChange={(e) => setNewLog({ ...newLog, student_name: e.target.value })}
                      required
                    />
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
                    Save Counseling Note
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
