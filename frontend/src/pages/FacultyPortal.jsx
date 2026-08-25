import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchAPI } from '../services/api';

export default function FacultyPortal() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const isDean = user?.role === 'ADMIN';

  const [facultySummary, setFacultySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFacultyId, setSelectedFacultyId] = useState(user?.faculty_id || 'FAC101');
  const [selectedCourseIndex, setSelectedCourseIndex] = useState(0);
  const [selectedStudentForWarning, setSelectedStudentForWarning] = useState(null);
  const [deptFilter, setDeptFilter] = useState(user?.department_id || '');

  const [mentorshipLogs, setMentorshipLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('FACULTY_MENTORSHIP_LOGS');
      return saved ? JSON.parse(saved) : [
        {
          id: 1,
          faculty_name: 'Dr. R. Ramanujan',
          student_id: 'STU20210016',
          student_name: 'Rohan Verma',
          course_code: 'CS501',
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
          course_code: 'EC301',
          date: '2026-08-22',
          topic: 'Remedial Tutorial for Signals & Systems',
          action: 'Assigned peer tutor for unit test revision.',
          status: 'RESOLVED'
        }
      ];
    } catch {
      return [];
    }
  });

  const [newLog, setNewLog] = useState({ student_id: '', student_name: '', course_code: '', topic: '', action: '' });
  const [showLogModal, setShowLogModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    let url = '/faculty/summary?';
    if (deptFilter) url += `department_id=${deptFilter}&`;

    fetchAPI(url)
      .then(res => {
        setFacultySummary(res);
        // Default to first faculty if current ID is not in filtered list
        const list = res.faculty_list || [];
        if (list.length > 0 && (!selectedFacultyId || !list.some(f => f.faculty_id === selectedFacultyId))) {
          setSelectedFacultyId(list[0].faculty_id);
        }
      })
      .catch(err => {
        console.error(err);
        addToast('Failed to load faculty records', 'danger');
      })
      .finally(() => setLoading(false));
  }, [deptFilter]);

  const facultyList = facultySummary?.faculty_list || [];
  const currentFaculty = facultyList.find(f => f.faculty_id === selectedFacultyId) || facultyList[0] || {};
  const handledCourses = currentFaculty.handled_courses || [];
  const activeCourse = handledCourses[selectedCourseIndex] || handledCourses[0] || {};
  const enrolledStudents = activeCourse.students || [];

  const handleSaveLog = (e) => {
    e.preventDefault();
    if (!newLog.student_id || !newLog.topic) {
      addToast('Please fill in required student ID and topic', 'warning');
      return;
    }

    const entry = {
      id: Date.now(),
      faculty_name: currentFaculty.faculty_name || 'Faculty Member',
      student_id: newLog.student_id,
      student_name: newLog.student_name || 'Advisee Student',
      course_code: newLog.course_code || activeCourse.course_code || 'GEN101',
      date: new Date().toISOString().split('T')[0],
      topic: newLog.topic,
      action: newLog.action || 'Counseling notes recorded.',
      status: 'OPEN'
    };

    const updated = [entry, ...mentorshipLogs];
    setMentorshipLogs(updated);
    localStorage.setItem('FACULTY_MENTORSHIP_LOGS', JSON.stringify(updated));
    addToast(`Counseling note recorded for ${entry.student_name}`, 'success');
    setNewLog({ student_id: '', student_name: '', course_code: '', topic: '', action: '' });
    setShowLogModal(false);
  };

  const handleDispatchWarning = (stu) => {
    addToast(`Official Attendance Notice dispatched to ${stu.student_name} (${stu.email}) for ${activeCourse.course_code}`, 'success');
    setSelectedStudentForWarning(null);
  };

  if (loading && !facultySummary) {
    return (
      <div className="p-4 text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted small">Loading Faculty Courses & Class Roster...</p>
      </div>
    );
  }

  return (
    <div className="p-3 p-md-4">
      {/* Header Banner */}
      <div className="p-4 rounded-4 text-white mb-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <span className="badge bg-info text-dark mb-2 fw-semibold">Faculty Teaching & Course Directorate</span>
            <h3 className="fw-bold mb-1">{currentFaculty.faculty_name || 'Faculty Teaching Hub'}</h3>
            <p className="mb-0 text-white-50 small">
              Department: <span className="text-white">{currentFaculty.department_name}</span> | Designation: <span className="text-white">{currentFaculty.designation}</span> | ID: <span className="text-white font-mono">{currentFaculty.faculty_id}</span>
            </p>
          </div>

          <div className="d-flex gap-2">
            <button className="btn btn-light btn-sm fw-semibold shadow-sm" onClick={() => setShowLogModal(true)}>
              <i className="bi bi-journal-plus text-primary me-1"></i> Log Advisee Session
            </button>
          </div>
        </div>
      </div>

      {/* Dean Faculty Switcher Dropdown (If logged in as Dean/Admin) */}
      {isDean && (
        <div className="metric-card mb-4 bg-white border-primary shadow-sm">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <span className="badge bg-primary text-white mb-1"><i className="bi bi-shield-lock-fill me-1"></i> Dean Faculty Inspector</span>
              <h6 className="fw-bold mb-0">Switch Faculty Member to Inspect Teaching Courses & Class Rosters</h6>
            </div>

            <div className="d-flex gap-2">
              <select
                className="form-select form-select-sm"
                value={selectedFacultyId}
                onChange={(e) => {
                  setSelectedFacultyId(e.target.value);
                  setSelectedCourseIndex(0);
                }}
              >
                {facultyList.map(f => (
                  <option key={f.faculty_id} value={f.faculty_id}>
                    {f.faculty_name} ({f.department_name} - {f.designation})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 4 Core Faculty Overview Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="metric-card">
            <div className="d-flex justify-content-between text-muted small mb-1">
              <span>Biometric Attendance</span>
              <i className="bi bi-fingerprint text-success"></i>
            </div>
            <h3 className="fw-bold mb-1 text-success">{currentFaculty.attendance_percentage}%</h3>
            <span className="badge bg-light text-success border">Status: {currentFaculty.biometric_status}</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="metric-card">
            <div className="d-flex justify-content-between text-muted small mb-1">
              <span>Weekly Teaching Load</span>
              <i className="bi bi-clock-history text-primary"></i>
            </div>
            <h3 className="fw-bold mb-1 text-primary">{currentFaculty.workload_hours_per_week} hrs/wk</h3>
            <span className="badge bg-light text-primary border">{handledCourses.length} Courses Assigned</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="metric-card">
            <div className="d-flex justify-content-between text-muted small mb-1">
              <span>Assigned Advisees</span>
              <i className="bi bi-people-fill text-info"></i>
            </div>
            <h3 className="fw-bold mb-1 text-info">{currentFaculty.advisees_count} Students</h3>
            <span className="badge bg-light text-info border">Mentorship Directorate</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="metric-card">
            <div className="d-flex justify-content-between text-muted small mb-1">
              <span>Research Publications</span>
              <i className="bi bi-journal-check text-warning"></i>
            </div>
            <h3 className="fw-bold mb-1 text-dark">{currentFaculty.research_publications} Papers</h3>
            <span className="badge bg-light text-muted border">Experience: {currentFaculty.experience_years} Years</span>
          </div>
        </div>
      </div>

      {/* Courses Handled by this Faculty */}
      <div className="metric-card mb-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h5 className="fw-bold mb-0"><i className="bi bi-book-half text-primary me-2"></i> Assigned Courses & Teaching Sections</h5>
            <span className="text-muted small">Select a course to view classroom schedule and enrolled student roster.</span>
          </div>
          <span className="badge bg-light text-dark border">{handledCourses.length} Assigned Subjects</span>
        </div>

        <div className="row g-3">
          {handledCourses.map((course, idx) => {
            const isSelected = selectedCourseIndex === idx;
            return (
              <div key={course.course_code} className="col-12 col-md-6">
                <div
                  className={`p-3 rounded-4 border transition-all ${
                    isSelected
                      ? 'border-primary bg-white shadow-sm ring-2'
                      : 'bg-light hover-shadow'
                  }`}
                  style={{
                    cursor: 'pointer',
                    borderColor: isSelected ? '#4f46e5' : '#e2e8f0',
                    borderWidth: isSelected ? '2px' : '1px'
                  }}
                  onClick={() => setSelectedCourseIndex(idx)}
                >
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <span className="badge bg-primary text-white font-mono me-2">{course.course_code}</span>
                      <span className="badge bg-light text-dark border">{course.section}</span>
                    </div>
                    <span className="badge bg-light text-success border">Sem {course.semester} ({course.credits} Credits)</span>
                  </div>

                  <h6 className="fw-bold mb-1 text-dark">{course.course_title}</h6>

                  <div className="small text-muted mb-2">
                    <div><i className="bi bi-calendar-event me-1 text-primary"></i> <strong>Schedule:</strong> {course.class_schedule}</div>
                    <div><i className="bi bi-geo-alt me-1 text-danger"></i> <strong>Location:</strong> {course.classroom}</div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center pt-2 border-top small">
                    <span>Enrolled: <strong>{course.total_enrolled} Students</strong></span>
                    <span>Avg Att: <strong className="text-success">{course.average_attendance}%</strong></span>
                    {course.shortage_alerts_count > 0 && (
                      <span className="badge badge-risk-high">{course.shortage_alerts_count} Shortages</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enrolled Students Roster for Active Course */}
      <div className="metric-card mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-2">
          <div>
            <h5 className="fw-bold mb-0">
              <i className="bi bi-people text-primary me-2"></i>
              Enrolled Student Roster: <span className="text-primary font-mono">{activeCourse.course_code}</span> - {activeCourse.course_title} ({activeCourse.section})
            </h5>
            <span className="text-muted small">
              Managing {enrolledStudents.length} enrolled students | Conducted: {activeCourse.total_classes_conducted} lectures
            </span>
          </div>

          <div className="badge bg-light text-dark border p-2">
            Classroom: {activeCourse.classroom}
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 small">
            <thead className="table-light">
              <tr>
                <th>Student ID</th>
                <th>Student Name & Email</th>
                <th>Section</th>
                <th>Lectures Attended</th>
                <th>Course Attendance</th>
                <th>Internal Marks (30)</th>
                <th>Grade</th>
                <th>Risk Level</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {enrolledStudents.map(s => (
                <tr key={s.student_id}>
                  <td className="font-mono fw-bold text-primary">{s.student_id}</td>
                  <td>
                    <div className="fw-semibold text-dark">{s.student_name}</div>
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>{s.email}</div>
                  </td>
                  <td><span className="badge bg-light text-dark border">{s.section}</span></td>
                  <td>{s.classes_attended} / {s.total_classes}</td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div className="progress flex-grow-1" style={{ height: '6px', minWidth: '70px' }}>
                        <div
                          className={`progress-bar ${s.attendance_percentage >= 75 ? 'bg-success' : 'bg-danger'}`}
                          style={{ width: `${Math.min(100, s.attendance_percentage)}%` }}
                        ></div>
                      </div>
                      <span className={`fw-bold ${s.attendance_percentage >= 75 ? 'text-success' : 'text-danger'}`}>
                        {s.attendance_percentage}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <strong className="font-mono">{s.internal_marks}</strong> / 30
                  </td>
                  <td><span className="badge bg-light text-dark border font-mono">{s.grade_letter}</span></td>
                  <td>
                    <span className={`badge ${s.risk_level === 'HIGH' ? 'badge-risk-high' : 'badge-risk-low'}`}>
                      {s.risk_level}
                    </span>
                  </td>
                  <td className="text-end">
                    {s.is_shortage ? (
                      <button
                        className="btn btn-sm btn-outline-danger py-1 px-2 shadow-sm rounded-pill"
                        style={{ fontSize: '0.72rem' }}
                        onClick={() => setSelectedStudentForWarning(s)}
                      >
                        <i className="bi bi-exclamation-triangle me-1"></i> Send Warning
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-outline-primary py-1 px-2 rounded-pill"
                        style={{ fontSize: '0.72rem' }}
                        onClick={() => {
                          setNewLog({
                            student_id: s.student_id,
                            student_name: s.student_name,
                            course_code: activeCourse.course_code,
                            topic: `Academic Progress in ${activeCourse.course_code}`,
                            action: ''
                          });
                          setShowLogModal(true);
                        }}
                      >
                        <i className="bi bi-pencil-square me-1"></i> Log Note
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Faculty Mentorship Counseling Log */}
      <div className="metric-card">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h6 className="fw-bold mb-0"><i className="bi bi-journal-text text-primary me-2"></i> Advisee Mentorship & Counseling History</h6>
            <span className="text-muted small">Recorded counseling sessions across assigned advisees.</span>
          </div>
          <button className="btn btn-sm btn-outline-primary" onClick={() => setShowLogModal(true)}>
            + Log New Session
          </button>
        </div>

        <div className="list-group list-group-flush small">
          {mentorshipLogs.map(log => (
            <div key={log.id} className="list-group-item px-0 bg-transparent py-2 border-bottom">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="fw-bold text-dark">
                  {log.student_name} (<span className="font-mono">{log.student_id}</span>) - <span className="badge bg-light text-primary border">{log.course_code || 'CS501'}</span>
                </span>
                <span className="badge bg-light text-muted border">{log.date}</span>
              </div>
              <div className="text-muted small"><strong>Counselor:</strong> {log.faculty_name}</div>
              <div className="text-muted small"><strong>Discussion:</strong> {log.topic}</div>
              <div className="text-muted small"><strong>Agreed Action Plan:</strong> {log.action}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Warning Notice Dispatch Modal */}
      {selectedStudentForWarning && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-danger text-white p-3 px-4">
                <h5 className="modal-title fs-6"><i className="bi bi-exclamation-triangle-fill me-2"></i> Official Course Attendance Warning Notice</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedStudentForWarning(null)}></button>
              </div>
              <div className="modal-body p-4 bg-light">
                <div className="border p-3 rounded-3 bg-white font-mono small mb-3">
                  <div className="text-center fw-bold border-bottom pb-2 mb-2">OFFICIAL COURSE DEBARMENT ADVISORY</div>
                  <div><strong>Student:</strong> {selectedStudentForWarning.student_name} ({selectedStudentForWarning.student_id})</div>
                  <div><strong>Course:</strong> {activeCourse.course_code} - {activeCourse.course_title} ({activeCourse.section})</div>
                  <div><strong>Instructor:</strong> {currentFaculty.faculty_name}</div>
                  <div><strong>Current Attendance:</strong> <span className="text-danger fw-bold">{selectedStudentForWarning.attendance_percentage}%</span> (Classes: {selectedStudentForWarning.classes_attended}/{selectedStudentForWarning.total_classes})</div>
                  <hr />
                  <p className="mb-0 text-muted" style={{ fontSize: '0.8rem' }}>
                    Warning: Your attendance in {activeCourse.course_code} is below the mandatory 75.0% requirement. Failure to attend mandatory classes will lead to end-semester examination debarment.
                  </p>
                </div>
              </div>
              <div className="modal-footer bg-white p-3">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedStudentForWarning(null)}>Cancel</button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDispatchWarning(selectedStudentForWarning)}>
                  <i className="bi bi-send me-1"></i> Dispatch Official Notice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Counseling Session Modal */}
      {showLogModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-primary text-white p-3 px-4" style={{ background: '#4f46e5' }}>
                <h5 className="modal-title fs-6"><i className="bi bi-journal-plus me-2"></i> Log Advisee Mentorship Session</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowLogModal(false)}></button>
              </div>
              <form onSubmit={handleSaveLog}>
                <div className="modal-body p-4 bg-light">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Student ID</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. STU20210001"
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
                      placeholder="e.g. Aarav Sharma"
                      value={newLog.student_name}
                      onChange={(e) => setNewLog({ ...newLog, student_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Course Code</label>
                    <input
                      type="text"
                      className="form-control form-control-sm font-mono"
                      placeholder="e.g. CS501"
                      value={newLog.course_code || activeCourse.course_code || ''}
                      onChange={(e) => setNewLog({ ...newLog, course_code: e.target.value.toUpperCase() })}
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

                <div className="modal-footer bg-white p-3">
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
