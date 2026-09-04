import React from 'react';
import { getSubjectTitle } from '../utils/subjectMap';

export default function PrintableTranscriptModal({ student, exams, summaryCards, onClose }) {
  const handlePrint = () => {
    window.print();
  };

  const st = student || {};
  const examList = exams || [];
  const cards = summaryCards || {};

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)' }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div className="modal-header bg-dark text-white p-3 px-4 d-print-none">
            <h5 className="modal-title fs-6 fw-bold">
              <i className="bi bi-file-earmark-text-fill text-warning me-2"></i>
              Official Grade Transcript (Printable)
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4 p-md-5 bg-white text-dark printable-area">
            {/* University Letterhead */}
            <div className="text-center border-bottom pb-3 mb-4">
              <div className="fs-3 text-primary mb-1"><i className="bi bi-mortarboard-fill"></i></div>
              <h4 className="fw-bold text-uppercase mb-0" style={{ letterSpacing: '0.05em' }}>
                University Institute of Technology & Research
              </h4>
              <p className="text-muted small mb-0">Office of Academic Affairs & Controller of Examinations</p>
              <div className="badge bg-light text-dark border mt-2">OFFICIAL CONSOLIDATED GRADE REPORT</div>
            </div>

            {/* Student Metadata Card */}
            <div className="row g-2 mb-4 p-3 bg-light rounded-3 border small">
              <div className="col-6">
                <div><strong>Student Name:</strong> {st.full_name}</div>
                <div><strong>Registration / ID:</strong> <span className="font-mono">{st.student_id}</span></div>
                <div><strong>Admission Batch:</strong> {st.batch_year}</div>
              </div>
              <div className="col-6 text-md-end">
                <div><strong>Department:</strong> {st.department_name}</div>
                <div><strong>Current Term:</strong> Semester {st.semester}</div>
                <div><strong>Date of Issue:</strong> {new Date().toLocaleDateString()}</div>
              </div>
            </div>

            {/* Academic Coursework Table */}
            <div className="table-responsive mb-4">
              <table className="table table-bordered align-middle mb-0 small">
                <thead className="table-light text-center">
                  <tr>
                    <th>Code</th>
                    <th>Course Title</th>
                    <th>Credits</th>
                    <th>Internal (30)</th>
                    <th>End-Sem (70)</th>
                    <th>Total (100)</th>
                    <th>Grade</th>
                    <th>Points</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {examList.map((e, idx) => (
                    <tr key={idx} className="text-center">
                      <td className="fw-bold font-mono text-start text-primary">{e.subject_id}</td>
                      <td className="text-start fw-semibold">{e.subject_name || getSubjectTitle(e.subject_id, st.department_name)}</td>
                      <td>{e.credits || 4}</td>
                      <td>{e.internal_marks_scored ?? e.internal_marks ?? 25}</td>
                      <td>{e.end_semester_marks_scored ?? e.external_marks ?? 55}</td>
                      <td className="fw-bold">{e.total_marks ?? ((e.internal_marks_scored ?? 25) + (e.end_semester_marks_scored ?? 55))}</td>
                      <td><span className="badge bg-light text-dark border font-mono">{e.grade_letter || 'A'}</span></td>
                      <td className="font-mono">{e.grade_point !== undefined ? Number(e.grade_point).toFixed(1) : (e.grade_points !== undefined ? Number(e.grade_points).toFixed(1) : '8.0')}</td>
                      <td>
                        <span className={`badge ${e.is_passed !== false ? 'bg-success' : 'bg-danger'}`}>
                          {e.is_passed !== false ? 'PASSED' : 'BACKLOG'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cumulative Summary */}
            <div className="row g-2 text-center mb-4 p-3 bg-light rounded-3 border">
              <div className="col-4">
                <div className="text-muted small">Cumulative GPA</div>
                <h4 className="fw-bold text-primary mb-0">{cards.cgpa} / 10.0</h4>
              </div>
              <div className="col-4">
                <div className="text-muted small">Active Backlogs</div>
                <h4 className="fw-bold text-success mb-0">{cards.backlogs_count || 0}</h4>
              </div>
              <div className="col-4">
                <div className="text-muted small">Overall Attendance</div>
                <h4 className="fw-bold text-dark mb-0">{cards.attendance_percentage}%</h4>
              </div>
            </div>

            {/* Official Signatures */}
            <div className="row pt-4 mt-4 border-top text-center text-muted small">
              <div className="col-4">
                <div style={{ height: '30px' }}></div>
                <div className="border-top pt-1">Prepared By (Registrar)</div>
              </div>
              <div className="col-4">
                <div style={{ height: '30px' }}></div>
                <div className="border-top pt-1">Verified (Department HOD)</div>
              </div>
              <div className="col-4">
                <div style={{ height: '30px' }}></div>
                <div className="border-top pt-1">Controller of Examinations</div>
              </div>
            </div>
          </div>

          <div className="modal-footer bg-light p-3 d-print-none">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Close
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handlePrint} style={{ background: '#4f46e5', borderColor: '#4f46e5' }}>
              <i className="bi bi-printer-fill me-1"></i> Print / Save PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
