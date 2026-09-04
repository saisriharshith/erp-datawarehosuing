import React from 'react';
import { getSubjectTitle } from '../utils/subjectMap';

export default function PrintableHallTicketModal({ student, exams, onClose }) {
  const handlePrint = () => {
    window.print();
  };

  const st = student || {};
  const examList = exams || [];

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
              <i className="bi bi-card-checklist text-warning me-2"></i>
              End-Semester Examination Hall Ticket & Admit Card
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4 p-md-5 bg-white text-dark printable-area">
            {/* Letterhead */}
            <div className="text-center border-bottom pb-3 mb-4">
              <div className="fs-3 text-primary mb-1"><i className="bi bi-mortarboard-fill"></i></div>
              <h4 className="fw-bold text-uppercase mb-0">University Institute of Technology</h4>
              <p className="text-muted small mb-0">Office of the Controller of Examinations</p>
              <div className="badge bg-primary text-white mt-2 px-3 py-1">OFFICIAL EXAMINATION ADMIT CARD</div>
            </div>

            {/* Student Metadata Card */}
            <div className="row g-3 mb-4 p-3 bg-light rounded-3 border small">
              <div className="col-8">
                <div><strong>Candidate Name:</strong> {st.full_name}</div>
                <div><strong>Registration / Roll No:</strong> <span className="font-mono text-primary fw-bold">{st.student_id}</span></div>
                <div><strong>Department:</strong> {st.department_name}</div>
                <div><strong>Semester:</strong> Semester {st.semester}</div>
                <div><strong>Exam Center:</strong> Main Campus, Block C (Hall 302)</div>
              </div>
              <div className="col-4 text-center d-flex flex-column align-items-center justify-content-center border-start">
                <div className="bg-white p-2 border rounded shadow-sm mb-1" style={{ width: '80px', height: '80px' }}>
                  <i className="bi bi-qr-code text-dark" style={{ fontSize: '3.5rem' }}></i>
                </div>
                <span className="text-muted font-mono" style={{ fontSize: '0.65rem' }}>VERIFIED ADMISSION</span>
              </div>
            </div>

            {/* Examination Schedule Table */}
            <div className="table-responsive mb-4">
              <table className="table table-bordered align-middle mb-0 small">
                <thead className="table-light text-center">
                  <tr>
                    <th>Course Code</th>
                    <th>Course Title</th>
                    <th>Exam Date</th>
                    <th>Timing</th>
                    <th>Invigilator Sign</th>
                  </tr>
                </thead>
                <tbody>
                  {examList.map((e, idx) => (
                    <tr key={idx}>
                      <td className="fw-bold font-mono text-primary">{e.subject_id}</td>
                      <td className="fw-semibold">{e.subject_name || getSubjectTitle(e.subject_id, st.department_name)}</td>
                      <td className="text-center font-mono">2026-11-{10 + idx * 3}</td>
                      <td className="text-center">10:00 AM - 01:00 PM</td>
                      <td className="text-center text-muted" style={{ height: '35px' }}>__________</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Candidate Instructions */}
            <div className="p-3 bg-light rounded-3 border small mb-4">
              <h6 className="fw-bold mb-1"><i className="bi bi-info-circle text-primary me-1"></i> Mandatory Candidate Instructions:</h6>
              <ul className="mb-0 ps-3 text-muted" style={{ fontSize: '0.75rem' }}>
                <li>Candidates must carry this Admit Card along with their official University Identity Card.</li>
                <li>Entry to the examination hall will not be permitted 15 minutes after the commencement of the exam.</li>
                <li>Electronic devices, smartwatches, and programmable calculators are strictly prohibited.</li>
              </ul>
            </div>

            {/* Signatures */}
            <div className="row pt-4 text-center text-muted small">
              <div className="col-6">
                <div style={{ height: '30px' }}></div>
                <div className="border-top pt-1">Candidate's Signature</div>
              </div>
              <div className="col-6">
                <div style={{ height: '30px' }}></div>
                <div className="border-top pt-1">Controller of Examinations</div>
              </div>
            </div>
          </div>

          <div className="modal-footer bg-light p-3 d-print-none">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handlePrint} style={{ background: '#4f46e5', borderColor: '#4f46e5' }}>
              <i className="bi bi-printer-fill me-1"></i> Print Admit Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
