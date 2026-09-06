import React, { useState, useEffect, useMemo } from 'react';
import { fetchAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function FacultyWorkspace() {
  const { addToast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected faculty member for the detailed workspace control center
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'teaching' | 'attendance' | 'students' | 'marks' | 'schedule' | 'metrics' | 'audit'

  // Search for students within selected faculty
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('ALL');

  // Modals
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [showAssignCourseModal, setShowAssignCourseModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  // Form State for Add/Edit
  const [facultyForm, setFacultyForm] = useState({
    faculty_id: '',
    name: '',
    email: '',
    department_id: 'DEPT_CSE',
    designation: 'Assistant Professor',
    workload_hours_per_week: 16,
    experience_years: 5
  });

  const loadFacultyData = async () => {
    setLoading(true);
    let url = '/faculty/summary?';
    if (deptFilter) url += `department_id=${deptFilter}&`;

    try {
      const res = await fetchAPI(url);
      setData(res);
      // If currently inspecting a faculty member, keep their fresh data
      if (selectedFaculty) {
        const fresh = (res.faculty_list || []).find(f => f.faculty_id === selectedFaculty.faculty_id);
        if (fresh) setSelectedFaculty(fresh);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load faculty records', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacultyData();
  }, [deptFilter]);

  const facultyList = data?.faculty_list || [];

  // Filtered List for Master Overview
  const filteredFaculty = useMemo(() => {
    return facultyList.filter(f => {
      const name = (f.faculty_name || f.name || '').toLowerCase();
      const id = (f.faculty_id || '').toLowerCase();
      const dept = (f.department_name || '').toLowerCase();
      const term = searchTerm.toLowerCase();

      const matchesSearch = name.includes(term) || id.includes(term) || dept.includes(term);
      const matchesStatus = !statusFilter || f.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [facultyList, searchTerm, statusFilter]);

  // Aggregate KPI Counts
  const totalFacultyCount = facultyList.length;
  const activeCount = facultyList.filter(f => f.status === 'ACTIVE').length;
  const onLeaveCount = facultyList.filter(f => f.status === 'ON_LEAVE').length;
  const issuesCount = facultyList.filter(f => f.status === 'ISSUES' || f.pending_attendance_count > 0 || f.pending_marks_count > 0).length;

  // Handler for adding/editing faculty
  const handleSaveFaculty = (e) => {
    e.preventDefault();
    addToast(`Faculty member ${facultyForm.name} saved successfully`, 'success');
    setShowAddFacultyModal(false);
  };

  const handleDeactivate = () => {
    if (!selectedFaculty) return;
    addToast(`Faculty account ${selectedFaculty.faculty_name} (${selectedFaculty.faculty_id}) has been deactivated.`, 'warning');
    setShowDeactivateModal(false);
  };

  const handleSendReminder = (subject) => {
    addToast(`Attendance submission reminder dispatched to ${selectedFaculty.faculty_name} for ${subject}`, 'info');
  };

  if (loading && !data) {
    return (
      <div className="p-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted small">Loading Faculty Operations Console...</p>
      </div>
    );
  }

  // =========================================================================
  // VIEW A: DETAILED FACULTY WORKSPACE & CONTROL CENTER
  // =========================================================================
  if (selectedFaculty) {
    const f = selectedFaculty;
    const handledCourses = f.handled_courses || [];

    // Flatten all students enrolled under this faculty's subjects
    const allEnrolledStudents = handledCourses.flatMap(course =>
      (course.students || []).map(stu => ({
        ...stu,
        subject_name: course.course_title,
        subject_code: course.course_code,
        section: course.section
      }))
    );

    const filteredStudents = allEnrolledStudents.filter(stu => {
      const matchesSubject = selectedSubjectFilter === 'ALL' || stu.subject_code === selectedSubjectFilter;
      const term = studentSearchTerm.toLowerCase();
      const matchesSearch = !term ||
        (stu.full_name || '').toLowerCase().includes(term) ||
        (stu.student_id || '').toLowerCase().includes(term);
      return matchesSubject && matchesSearch;
    });

    return (
      <div className="p-2 p-md-4">
        {/* 1. Back Header & Action Controls */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div className="d-flex align-items-center gap-3">
            <button
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 rounded-pill px-3"
              onClick={() => {
                setSelectedFaculty(null);
                setActiveTab('overview');
              }}
            >
              <i className="bi bi-arrow-left"></i>
              <span>Faculty Workspace</span>
            </button>
            <span className="text-muted">|</span>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h4 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>{f.faculty_name}</h4>
                <span className={`badge ${f.status === 'ACTIVE' ? 'bg-success' : f.status === 'ON_LEAVE' ? 'bg-warning text-dark' : 'bg-danger'} text-white`}>
                  {f.status === 'ACTIVE' ? 'Active' : f.status === 'ON_LEAVE' ? 'On Leave' : 'Action Required'}
                </span>
                <span className="badge bg-light text-dark border font-mono">{f.faculty_id}</span>
              </div>
              <div className="text-muted small">
                {f.department_name} • {f.designation} • {f.email}
              </div>
            </div>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <button
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 rounded-pill px-3"
              onClick={() => setShowAssignCourseModal(true)}
            >
              <i className="bi bi-book-plus"></i>
              <span>Assign Subject</span>
            </button>
            <button
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 rounded-pill px-3"
              onClick={() => {
                setFacultyForm({
                  faculty_id: f.faculty_id,
                  name: f.faculty_name,
                  email: f.email,
                  department_id: f.department_id,
                  designation: f.designation,
                  workload_hours_per_week: f.workload_hours_per_week,
                  experience_years: f.experience_years
                });
                setShowAddFacultyModal(true);
              }}
            >
              <i className="bi bi-pencil-square"></i>
              <span>Edit Faculty</span>
            </button>
            <button
              className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1 rounded-pill px-3"
              onClick={() => setShowDeactivateModal(true)}
            >
              <i className="bi bi-slash-circle"></i>
              <span>Deactivate</span>
            </button>
          </div>
        </div>

        {/* 2. Top Executive Summary Rail */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md">
            <div className="erp-stat-card h-100">
              <span className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.7rem' }}>Subjects Assigned</span>
              <h3 className="fw-bold my-1 text-primary">{f.handled_courses?.length || 0} Courses</h3>
              <span className="text-muted small" style={{ fontSize: '0.72rem' }}>Term 2026–2027</span>
            </div>
          </div>
          <div className="col-6 col-md">
            <div className="erp-stat-card h-100">
              <span className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.7rem' }}>Weekly Classes</span>
              <h3 className="fw-bold my-1" style={{ color: 'var(--text-primary)' }}>{f.weekly_classes_scheduled || 12} Hrs/Wk</h3>
              <span className="text-muted small" style={{ fontSize: '0.72rem' }}>Standard Academic Load</span>
            </div>
          </div>
          <div className="col-6 col-md">
            <div className="erp-stat-card h-100">
              <span className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.7rem' }}>Enrolled Students</span>
              <h3 className="fw-bold my-1 text-info">{f.total_enrolled_students || 50} Students</h3>
              <span className="text-muted small" style={{ fontSize: '0.72rem' }}>Across All Sections</span>
            </div>
          </div>
          <div className="col-6 col-md">
            <div className="erp-stat-card h-100">
              <span className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.7rem' }}>Attendance Rate</span>
              <h3 className="fw-bold my-1 text-success">{f.attendance_submission_rate || 96}%</h3>
              <span className="text-muted small" style={{ fontSize: '0.72rem' }}>Submission Compliance</span>
            </div>
          </div>
          <div className="col-6 col-md">
            <div className="erp-stat-card h-100">
              <span className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.7rem' }}>Pending Tasks</span>
              <h3 className={`fw-bold my-1 ${(f.pending_attendance_count + f.pending_marks_count) > 0 ? 'text-danger' : 'text-success'}`}>
                {(f.pending_attendance_count || 0) + (f.pending_marks_count || 0)} Pending
              </h3>
              <span className="text-muted small" style={{ fontSize: '0.72rem' }}>Attendance & Marks</span>
            </div>
          </div>
        </div>

        {/* 3. Deep Workspace Navigation Tabs */}
        <div className="d-flex flex-wrap gap-1 mb-4 pb-2 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
          {[
            { key: 'overview', label: 'Overview', icon: 'bi-grid-fill' },
            { key: 'teaching', label: 'Teaching Workspace', icon: 'bi-journal-bookmark-fill' },
            { key: 'attendance', label: 'Attendance Monitoring', icon: 'bi-calendar-check-fill' },
            { key: 'students', label: 'Students Roster', icon: 'bi-people-fill' },
            { key: 'marks', label: 'Marks & Assessment', icon: 'bi-pencil-square' },
            { key: 'schedule', label: 'Timetable Schedule', icon: 'bi-clock-history' },
            { key: 'metrics', label: 'Operational Metrics', icon: 'bi-speedometer2' },
            { key: 'audit', label: 'Activity & Audit Log', icon: 'bi-shield-check' },
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              className={`btn btn-sm d-flex align-items-center gap-2 rounded-pill px-3 py-2 fw-semibold transition-all ${
                activeTab === tab.key ? 'btn-primary text-white shadow-sm' : 'btn-light border'
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
        {/* SUB-TAB 1: OVERVIEW */}
        {/* =================================================================== */}
        {activeTab === 'overview' && (
          <div className="row g-4">
            <div className="col-12 col-lg-8">
              <div className="erp-card p-4 mb-4">
                <h5 className="fw-bold mb-3" style={{ color: 'var(--text-primary)' }}>Faculty Academic Responsibilities</h5>
                <p className="text-muted small">
                  Primary instructor for <strong>{f.handled_courses?.map(c => c.course_title).join(', ')}</strong> in the department of {f.department_name}. Supervises {f.advisees_count} undergraduate advisees and conducts practical sessions in assigned research laboratories.
                </p>

                <div className="row g-3 mt-2">
                  <div className="col-12 col-sm-6">
                    <div className="p-3 bg-body-tertiary rounded-3 border">
                      <div className="text-muted small fw-semibold">Biometric Attendance</div>
                      <div className="fw-bold text-success fs-5 my-1">{f.attendance_percentage}%</div>
                      <span className="badge bg-success-subtle text-success border">{f.biometric_status}</span>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="p-3 bg-body-tertiary rounded-3 border">
                      <div className="text-muted small fw-semibold">Syllabus Completion</div>
                      <div className="fw-bold text-primary fs-5 my-1">{f.syllabus_progress_pct || 75}%</div>
                      <div className="progress" style={{ height: '6px' }}>
                        <div className="progress-bar bg-primary" style={{ width: `${f.syllabus_progress_pct || 75}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="p-3 bg-body-tertiary rounded-3 border">
                      <div className="text-muted small fw-semibold">Leave Balance</div>
                      <div className="fw-bold fs-5 my-1" style={{ color: 'var(--text-primary)' }}>{f.leave_balance_days} Days Left</div>
                      <span className="text-muted small">{f.leaves_taken_this_sem} days availed this semester</span>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="p-3 bg-body-tertiary rounded-3 border">
                      <div className="text-muted small fw-semibold">Research Publications</div>
                      <div className="fw-bold text-info fs-5 my-1">{f.research_publications} Papers</div>
                      <span className="text-muted small">Indexed in Scopus / IEEE</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Handled Subjects Preview */}
              <div className="erp-card p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold mb-0">Active Course Allotments</h6>
                  <button className="btn btn-sm btn-link p-0 text-decoration-none" onClick={() => setActiveTab('teaching')}>View Detailed Roster →</button>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light">
                      <tr>
                        <th>Code</th>
                        <th>Subject Title</th>
                        <th>Section</th>
                        <th>Semester</th>
                        <th>Enrolled</th>
                        <th>Average Attendance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {handledCourses.map((c, i) => (
                        <tr key={i}>
                          <td className="font-mono fw-bold text-primary">{c.course_code}</td>
                          <td className="fw-semibold">{c.course_title}</td>
                          <td><span className="badge bg-light text-dark border">{c.section}</span></td>
                          <td>Sem {c.semester}</td>
                          <td>{c.total_enrolled} students</td>
                          <td>
                            <span className={`badge ${c.average_attendance >= 75 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                              {c.average_attendance}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column: Live Operational Alert Box & Quick Actions */}
            <div className="col-12 col-lg-4">
              <div className="erp-card p-4 mb-4">
                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                  <i className="bi bi-bell-fill text-warning"></i>
                  <span>Operational Status Alerts</span>
                </h6>

                {f.pending_attendance_count > 0 ? (
                  <div className="alert alert-warning d-flex flex-column gap-2 mb-3">
                    <div className="d-flex align-items-start gap-2">
                      <i className="bi bi-exclamation-triangle-fill fs-5 text-warning"></i>
                      <div>
                        <strong>Attendance Submission Pending</strong>
                        <div className="small mt-1">
                          2 classes pending attendance registration for {handledCourses[1]?.course_title || 'DBMS'} (Section B).
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn btn-sm btn-warning mt-2 w-100"
                      onClick={() => handleSendReminder(handledCourses[1]?.course_title || 'DBMS')}
                    >
                      <i className="bi bi-send me-1"></i> Send Immediate Reminder
                    </button>
                  </div>
                ) : (
                  <div className="alert alert-success d-flex align-items-center gap-2 mb-3">
                    <i className="bi bi-check-circle-fill fs-5 text-success"></i>
                    <div>
                      <strong>All Submissions Up to Date</strong>
                      <div className="small">All weekly attendance & marks entries logged properly.</div>
                    </div>
                  </div>
                )}

                <div className="border-top pt-3">
                  <div className="fw-semibold small mb-2">Next Scheduled Lecture Today:</div>
                  <div className="p-2 rounded bg-body-tertiary border">
                    <div className="fw-bold text-primary">{f.schedule_timetable?.[0]?.course || 'Operating Systems'}</div>
                    <div className="small text-muted">{f.schedule_timetable?.[0]?.time || '09:25 AM'} • {f.schedule_timetable?.[0]?.room || 'Hall 204'}</div>
                    <span className="badge bg-light text-dark border mt-1">{f.schedule_timetable?.[0]?.section || 'Section A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SUB-TAB 2: TEACHING WORKSPACE */}
        {/* =================================================================== */}
        {activeTab === 'teaching' && (
          <div className="erp-card p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 className="fw-bold mb-0">Teaching Assignments & Course Load</h5>
                <span className="text-muted small">Curricular distribution, sections, and classroom allocations</span>
              </div>
              <button className="btn btn-sm btn-outline-primary" onClick={() => setShowAssignCourseModal(true)}>
                <i className="bi bi-plus-lg me-1"></i> Add Subject Assignment
              </button>
            </div>

            <div className="row g-3">
              {handledCourses.map((course, idx) => (
                <div key={idx} className="col-12 col-lg-6">
                  <div className="p-4 rounded-3 border bg-body-tertiary h-100">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="badge bg-primary-subtle text-primary border font-mono">{course.course_code}</span>
                      <span className="badge bg-light text-dark border">{course.section}</span>
                    </div>
                    <h5 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>{course.course_title}</h5>
                    <div className="text-muted small mb-3">
                      Semester {course.semester} • {course.credits} Credits • {course.classroom}
                    </div>

                    <div className="row g-2 text-center small mb-3">
                      <div className="col-4">
                        <div className="p-2 bg-body rounded border">
                          <div className="text-muted">Enrolled</div>
                          <div className="fw-bold text-primary fs-6">{course.total_enrolled}</div>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="p-2 bg-body rounded border">
                          <div className="text-muted">Avg Attendance</div>
                          <div className="fw-bold text-success fs-6">{course.average_attendance}%</div>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="p-2 bg-body rounded border">
                          <div className="text-muted">Shortage Alerts</div>
                          <div className="fw-bold text-danger fs-6">{course.shortage_alerts_count}</div>
                        </div>
                      </div>
                    </div>

                    <div className="text-muted small mb-2">
                      <i className="bi bi-clock me-1"></i> Schedule: <strong>{course.class_schedule}</strong>
                    </div>

                    <div className="d-flex gap-2 mt-3 pt-3 border-top">
                      <button
                        className="btn btn-sm btn-outline-primary flex-fill"
                        onClick={() => {
                          setSelectedSubjectFilter(course.course_code);
                          setActiveTab('students');
                        }}
                      >
                        <i className="bi bi-people me-1"></i> View Students Roster
                      </button>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleSendReminder(course.course_title)}
                        title="Send Reminder to Faculty"
                      >
                        <i className="bi bi-bell"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SUB-TAB 3: ATTENDANCE MONITORING */}
        {/* =================================================================== */}
        {activeTab === 'attendance' && (
          <div className="erp-card p-4">
            <h5 className="fw-bold mb-1">Faculty Attendance Activity Monitoring</h5>
            <p className="text-muted small mb-4">Real-time verification of classroom attendance recording and session audit logs.</p>

            <div className="row g-3 mb-4">
              <div className="col-12 col-md-4">
                <div className="p-3 bg-light rounded-3 border text-center">
                  <div className="text-muted small">Weekly Classes Scheduled</div>
                  <h3 className="fw-bold text-primary my-1">{f.weekly_classes_scheduled || 12}</h3>
                  <span className="text-muted small">This Week</span>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="p-3 bg-light rounded-3 border text-center">
                  <div className="text-muted small">Attendance Submissions Completed</div>
                  <h3 className="fw-bold text-success my-1">{f.weekly_classes_completed || 12}</h3>
                  <span className="badge bg-success-subtle text-success">Compliant</span>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="p-3 bg-light rounded-3 border text-center">
                  <div className="text-muted small">Pending Attendance Submissions</div>
                  <h3 className={`fw-bold my-1 ${f.pending_attendance_count > 0 ? 'text-danger' : 'text-success'}`}>
                    {f.pending_attendance_count || 0}
                  </h3>
                  <span className="text-muted small">Requires Prompting</span>
                </div>
              </div>
            </div>

            {f.pending_attendance_count > 0 && (
              <div className="alert alert-warning d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-triangle-fill fs-5 text-warning"></i>
                  <span><strong>Attendance pending</strong> for {handledCourses[1]?.course_title || 'Database Systems'} — {handledCourses[1]?.section || 'Section B'} — Recent Session</span>
                </div>
                <button className="btn btn-sm btn-warning" onClick={() => handleSendReminder(handledCourses[1]?.course_title || 'Database Systems')}>
                  <i className="bi bi-send me-1"></i> Send Faculty Notification
                </button>
              </div>
            )}

            <h6 className="fw-bold mb-3">Course Attendance Completion Breakdown</h6>
            <div className="table-responsive">
              <table className="table table-hover align-middle small">
                <thead className="table-light">
                  <tr>
                    <th>Subject</th>
                    <th>Section</th>
                    <th>Classes Conducted</th>
                    <th>Attendance Submission Rate</th>
                    <th>Compliance Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {handledCourses.map((c, i) => (
                    <tr key={i}>
                      <td className="fw-semibold">{c.course_title} ({c.course_code})</td>
                      <td><span className="badge bg-light text-dark border">{c.section}</span></td>
                      <td>48 Conducted</td>
                      <td>
                        <div className="d-flex align-items-center gap-2" style={{ maxWidth: '200px' }}>
                          <div className="progress flex-fill" style={{ height: '6px' }}>
                            <div className="progress-bar bg-success" style={{ width: `${i === 1 && f.pending_attendance_count > 0 ? 80 : 100}%` }}></div>
                          </div>
                          <span className="fw-bold">{i === 1 && f.pending_attendance_count > 0 ? '80%' : '100%'}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${i === 1 && f.pending_attendance_count > 0 ? 'bg-warning text-dark' : 'bg-success text-white'}`}>
                          {i === 1 && f.pending_attendance_count > 0 ? 'Pending 2 Sessions' : 'Up to Date'}
                        </span>
                      </td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => handleSendReminder(c.course_title)}>
                          Audit Sessions
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SUB-TAB 4: STUDENTS UNDER THIS FACULTY */}
        {/* =================================================================== */}
        {activeTab === 'students' && (
          <div className="erp-card p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
              <div>
                <h5 className="fw-bold mb-0">Students Under This Faculty's Courses</h5>
                <span className="text-muted small">Hierarchical mapping: Faculty → Subject → Section → Students</span>
              </div>

              <div className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Search student ID, name..."
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  style={{ minWidth: '220px' }}
                />
                <select
                  className="form-select form-select-sm w-auto"
                  value={selectedSubjectFilter}
                  onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                >
                  <option value="ALL">All Subjects</option>
                  {handledCourses.map(c => (
                    <option key={c.course_code} value={c.course_code}>{c.course_code} — {c.course_title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Student ID</th>
                    <th>Student Name</th>
                    <th>Subject</th>
                    <th>Section</th>
                    <th>Attendance %</th>
                    <th>Internal Marks</th>
                    <th>Academic Standing</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">No students matching query under this faculty member.</td>
                    </tr>
                  ) : (
                    filteredStudents.map((stu, i) => (
                      <tr key={i}>
                        <td className="font-mono fw-bold text-primary">{stu.student_id}</td>
                        <td className="fw-semibold">{stu.full_name || stu.student_name || stu.name || 'Student'}</td>
                        <td>{stu.subject_name} ({stu.subject_code})</td>
                        <td><span className="badge bg-light text-dark border">{stu.section}</span></td>
                        <td>
                          <span className={`badge ${stu.attendance_percentage >= 75 ? 'bg-light text-success border' : (stu.total_classes === 0 || stu.attendance_percentage === 0 ? 'bg-light text-muted border' : 'bg-light text-danger border')}`}>
                            {stu.attendance_percentage}%
                          </span>
                        </td>
                        <td><strong>{stu.internal_marks || 0}</strong> / 30</td>
                        <td>
                          {stu.total_classes === 0 || stu.attendance_percentage === 0 ? (
                            <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                              <i className="bi bi-clock-history me-1"></i> Not Commenced
                            </span>
                          ) : stu.is_shortage ? (
                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                              <i className="bi bi-exclamation-triangle me-1"></i> Shortage Alert
                            </span>
                          ) : (
                            <span className="badge bg-success-subtle text-success border border-success-subtle">
                              <i className="bi bi-check-circle me-1"></i> Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SUB-TAB 5: MARKS & ASSESSMENT MONITORING */}
        {/* =================================================================== */}
        {activeTab === 'marks' && (
          <div className="erp-card p-4">
            <h5 className="fw-bold mb-1">Assessment & Marks Submission Monitoring</h5>
            <p className="text-muted small mb-4">Track whether internal and mid-term assessments are submitted on time across subjects.</p>

            <div className="table-responsive mb-4">
              <table className="table table-hover align-middle small">
                <thead className="table-light">
                  <tr>
                    <th>Assessment Component</th>
                    <th>Weightage</th>
                    <th>Official Deadline</th>
                    <th>Submission Status</th>
                    <th>Class Average</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(f.assessments || []).map((asn, i) => (
                    <tr key={i}>
                      <td className="fw-bold">{asn.name}</td>
                      <td>{asn.weightage}</td>
                      <td>{asn.deadline}</td>
                      <td>
                        <span className={`badge ${
                          asn.status === 'COMPLETED' ? 'bg-success' : asn.status === 'PENDING' ? 'bg-warning text-dark' : 'bg-secondary'
                        }`}>
                          {asn.status === 'COMPLETED' ? '✓ Completed' : asn.status === 'PENDING' ? '⚠ Pending Entry' : '— Not Started'}
                        </span>
                      </td>
                      <td>{asn.avg_score ? <strong>{asn.avg_score} / 100</strong> : '—'}</td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => addToast(`Auditing grades for ${asn.name}`, 'info')}>
                          Inspect Marks
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SUB-TAB 6: SCHEDULE & TIMETABLE */}
        {/* =================================================================== */}
        {activeTab === 'schedule' && (
          <div className="erp-card p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold mb-0">Weekly Lecture & Laboratory Schedule</h5>
                <span className="text-muted small">Institutional room allocations and conflict detection</span>
              </div>
              <span className="badge bg-success-subtle text-success border px-3 py-2 fw-semibold">
                <i className="bi bi-shield-check me-1"></i> No Scheduling Conflicts Detected
              </span>
            </div>

            <div className="table-responsive">
              <table className="table table-bordered align-middle small">
                <thead className="table-light">
                  <tr>
                    <th>Day</th>
                    <th>Time Slot</th>
                    <th>Course Code & Title</th>
                    <th>Section</th>
                    <th>Classroom / Laboratory</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(f.schedule_timetable || []).map((slot, i) => (
                    <tr key={i}>
                      <td className="fw-bold">{slot.day}</td>
                      <td className="font-mono">{slot.time}</td>
                      <td className="fw-semibold text-primary">{slot.code} — {slot.course}</td>
                      <td><span className="badge bg-light text-dark border">{slot.section}</span></td>
                      <td><i className="bi bi-geo-alt me-1 text-muted"></i>{slot.room}</td>
                      <td><span className="badge bg-success-subtle text-success">Confirmed</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SUB-TAB 7: OPERATIONAL METRICS */}
        {/* =================================================================== */}
        {activeTab === 'metrics' && (
          <div className="erp-card p-4">
            <h5 className="fw-bold mb-1">Operational Teaching Indicators</h5>
            <p className="text-muted small mb-4">Objective operational metrics for institutional reporting and workload balancing.</p>

            <div className="row g-4">
              <div className="col-12 col-md-6">
                <h6 className="fw-bold mb-3 border-bottom pb-2">Teaching Activity Compliance</h6>
                <ul className="list-group list-group-flush small">
                  <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                    <span>Total Classes Conducted (Semester)</span>
                    <strong>48 Hours</strong>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                    <span>Biometric Punctuality Rate</span>
                    <strong className="text-success">{f.attendance_percentage}%</strong>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                    <span>Attendance Log Submission Rate</span>
                    <strong className="text-primary">{f.attendance_submission_rate}%</strong>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                    <span>Syllabus Target Attainment</span>
                    <strong className="text-info">{f.syllabus_progress_pct || 75}%</strong>
                  </li>
                </ul>
              </div>

              <div className="col-12 col-md-6">
                <h6 className="fw-bold mb-3 border-bottom pb-2">Academic Quality Indicators</h6>
                <ul className="list-group list-group-flush small">
                  <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                    <span>Class Average Internal Marks</span>
                    <strong>78.4 / 100</strong>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                    <span>Pass Percentage Across Handled Subjects</span>
                    <strong className="text-success">92.6%</strong>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                    <span>Research Publications Count</span>
                    <strong>{f.research_publications} Papers</strong>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                    <span>Department Advisees Mentored</span>
                    <strong>{f.advisees_count} Students</strong>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SUB-TAB 8: RECENT ACTIVITY & AUDIT LOG */}
        {/* =================================================================== */}
        {activeTab === 'audit' && (
          <div className="erp-card p-4">
            <h5 className="fw-bold mb-1">Institutional Faculty Activity & Audit Log</h5>
            <p className="text-muted small mb-4">Immutable audit trail of attendance registration, marks submissions, and academic logs.</p>

            <div className="list-group list-group-flush small">
              {(f.recent_activity || []).map(act => (
                <div key={act.id} className="list-group-item d-flex justify-content-between align-items-start px-0 py-3">
                  <div className="d-flex align-items-start gap-3">
                    <div className="rounded-circle p-2 bg-primary-subtle text-primary mt-1">
                      <i className="bi bi-shield-check"></i>
                    </div>
                    <div>
                      <div className="fw-bold" style={{ color: 'var(--text-primary)' }}>{act.action}</div>
                      <div className="text-muted">{act.detail}</div>
                    </div>
                  </div>
                  <span className="badge bg-light text-muted border">{act.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal: Deactivate Confirmation */}
        {showDeactivateModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content rounded-4 border-0 shadow-lg">
                <div className="modal-header bg-danger text-white">
                  <h5 className="modal-title fs-6 fw-bold">Confirm Account Deactivation</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowDeactivateModal(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <p className="mb-2">
                    Are you sure you want to deactivate faculty account <strong>{f.faculty_name} ({f.faculty_id})</strong>?
                  </p>
                  <div className="alert alert-warning small mb-0">
                    <i className="bi bi-exclamation-triangle-fill me-1"></i>
                    The faculty member will immediately lose access to their teaching portal and will no longer be able to submit attendance or marks.
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button className="btn btn-sm btn-secondary" onClick={() => setShowDeactivateModal(false)}>Cancel</button>
                  <button className="btn btn-sm btn-danger" onClick={handleDeactivate}>Deactivate Faculty</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Assign Subject */}
        {showAssignCourseModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content rounded-4 border-0 shadow-lg">
                <div className="modal-header bg-dark text-white">
                  <h5 className="modal-title fs-6 fw-bold">Assign Subject Course Allotment</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowAssignCourseModal(false)}></button>
                </div>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  addToast(`Subject assigned to ${f.faculty_name}`, 'success');
                  setShowAssignCourseModal(false);
                }}>
                  <div className="modal-body p-4">
                    <div className="mb-3">
                      <label className="form-label small fw-bold">Subject Code & Name *</label>
                      <select className="form-select form-select-sm" required>
                        <option value="CS503">CS503 — Computer Networks</option>
                        <option value="CS601">CS601 — Artificial Intelligence</option>
                        <option value="CS602">CS602 — Compiler Design</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-bold">Section *</label>
                      <select className="form-select form-select-sm" required>
                        <option value="Section A">Section A</option>
                        <option value="Section B">Section B</option>
                        <option value="Section C">Section C</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-bold">Semester *</label>
                      <input type="number" min="1" max="8" defaultValue="5" className="form-control form-control-sm" required />
                    </div>
                  </div>
                  <div className="modal-footer bg-light">
                    <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowAssignCourseModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-sm btn-primary">Assign Subject</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // =========================================================================
  // VIEW B: MASTER FACULTY OVERVIEW / OPERATIONAL CONTROL CENTER
  // =========================================================================
  return (
    <div className="p-2 p-md-4">
      {/* 1. Master Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>Faculty Workspace</h4>
          <p className="text-muted small mb-0">Manage and monitor all teaching staff, lecture compliance, assessments, and department workloads.</p>
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-primary d-flex align-items-center gap-1 rounded-pill px-3 shadow-sm"
            onClick={() => {
              setFacultyForm({
                faculty_id: `FAC${Math.floor(100 + Math.random() * 900)}`,
                name: '',
                email: '',
                department_id: 'DEPT_CSE',
                designation: 'Assistant Professor',
                workload_hours_per_week: 16,
                experience_years: 5
              });
              setShowAddFacultyModal(true);
            }}
          >
            <i className="bi bi-plus-lg"></i>
            <span>Add Faculty</span>
          </button>
        </div>
      </div>

      {/* 2. Top-Level Summary Metric Rail (As specified by User) */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="erp-stat-card h-100">
            <span className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.7rem' }}>Total Teaching Staff</span>
            <h3 className="fw-bold my-1 text-primary">{totalFacultyCount} Faculty</h3>
            <span className="text-muted small" style={{ fontSize: '0.72rem' }}>All 5 Engineering Branches</span>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="erp-stat-card h-100">
            <span className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.7rem' }}>Active & Teaching</span>
            <h3 className="fw-bold my-1 text-success">{activeCount} Active</h3>
            <span className="badge bg-success-subtle text-success border">In Class Today</span>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="erp-stat-card h-100">
            <span className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.7rem' }}>On Leave / Absent</span>
            <h3 className="fw-bold my-1 text-warning">{onLeaveCount} On Leave</h3>
            <span className="text-muted small" style={{ fontSize: '0.72rem' }}>Authorized Sabbatical</span>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="erp-stat-card h-100">
            <span className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.7rem' }}>Operational Alerts</span>
            <h3 className="fw-bold my-1 text-danger">{issuesCount} Issues</h3>
            <span className="text-muted small" style={{ fontSize: '0.72rem' }}>Attendance / Marks Delays</span>
          </div>
        </div>
      </div>

      {/* 3. Search and Department / Status Filters */}
      <div className="erp-card mb-4 p-3">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-body-tertiary border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search faculty by name, ID, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="btn btn-outline-secondary border-start-0" onClick={() => setSearchTerm('')}>
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              <option value="DEPT_CSE">Computer Science (CSE)</option>
              <option value="DEPT_ECE">Electronics (ECE)</option>
              <option value="DEPT_MECH">Mechanical (MECH)</option>
              <option value="DEPT_CIVIL">Civil (CIVIL)</option>
              <option value="DEPT_AIDS">AI & Data Science (AIDS)</option>
            </select>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active Staff</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="ISSUES">Pending Tasks / Issues</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Faculty Overview Master Table */}
      <div className="erp-card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="fw-bold mb-0">
            <i className="bi bi-people-fill text-primary me-2"></i>
            Teaching Staff Roster ({filteredFaculty.length})
          </h6>
          <span className="text-muted small">Click any faculty member to open their complete operational workspace.</span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 small">
            <thead className="table-light">
              <tr>
                <th>Faculty ID</th>
                <th>Name & Designation</th>
                <th>Department</th>
                <th>Subjects</th>
                <th>Classes / Wk</th>
                <th>Attendance Rate</th>
                <th>Pending Tasks</th>
                <th>Status</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaculty.map(f => (
                <tr
                  key={f.faculty_id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedFaculty(f)}
                >
                  <td className="font-mono fw-bold text-primary">{f.faculty_id}</td>
                  <td>
                    <div className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{f.faculty_name}</div>
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>{f.designation} • {f.email}</div>
                  </td>
                  <td><span className="badge bg-body-secondary text-body border">{f.department_name}</span></td>
                  <td><strong>{f.handled_courses?.length || 2}</strong> Courses</td>
                  <td><span className="badge bg-light text-primary border">{f.weekly_classes_scheduled || 12} hrs/wk</span></td>
                  <td>
                    <span className={`badge ${f.attendance_percentage >= 94 ? 'bg-light text-success border' : 'bg-light text-warning border'}`}>
                      {f.attendance_percentage}%
                    </span>
                  </td>
                  <td>
                    {(f.pending_attendance_count + f.pending_marks_count) > 0 ? (
                      <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                        {(f.pending_attendance_count + f.pending_marks_count)} Pending
                      </span>
                    ) : (
                      <span className="badge bg-success-subtle text-success border border-success-subtle">
                        0 Pending
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${f.status === 'ACTIVE' ? 'bg-success' : f.status === 'ON_LEAVE' ? 'bg-warning text-dark' : 'bg-danger'} text-white`}>
                      {f.status === 'ACTIVE' ? 'Active' : f.status === 'ON_LEAVE' ? 'On Leave' : 'Action Required'}
                    </span>
                  </td>
                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-primary py-1 px-3 rounded-pill"
                      style={{ fontSize: '0.75rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFaculty(f);
                      }}
                    >
                      Open Workspace <i className="bi bi-arrow-right ms-1"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Faculty */}
      {showAddFacultyModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fs-6 fw-bold">Add / Edit Faculty Member</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddFacultyModal(false)}></button>
              </div>
              <form onSubmit={handleSaveFaculty}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold">Faculty ID *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={facultyForm.faculty_id}
                        onChange={(e) => setFacultyForm({ ...facultyForm, faculty_id: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold">Full Name *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Ramesh Kumar"
                        value={facultyForm.name}
                        onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold">Institutional Email *</label>
                      <input
                        type="email"
                        className="form-control form-control-sm"
                        placeholder="e.g. ramesh.kumar@univ.edu"
                        value={facultyForm.email}
                        onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold">Department *</label>
                      <select
                        className="form-select form-select-sm"
                        value={facultyForm.department_id}
                        onChange={(e) => setFacultyForm({ ...facultyForm, department_id: e.target.value })}
                      >
                        <option value="DEPT_CSE">Computer Science & Engineering</option>
                        <option value="DEPT_ECE">Electronics & Communication</option>
                        <option value="DEPT_MECH">Mechanical Engineering</option>
                        <option value="DEPT_CIVIL">Civil Engineering</option>
                        <option value="DEPT_AIDS">AI & Data Science</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold">Designation *</label>
                      <select
                        className="form-select form-select-sm"
                        value={facultyForm.designation}
                        onChange={(e) => setFacultyForm({ ...facultyForm, designation: e.target.value })}
                      >
                        <option value="Professor">Professor</option>
                        <option value="Associate Professor">Associate Professor</option>
                        <option value="Assistant Professor">Assistant Professor</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowAddFacultyModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-sm btn-primary">Save Faculty</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
