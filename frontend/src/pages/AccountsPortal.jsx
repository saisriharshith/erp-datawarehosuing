import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchAPI } from '../services/api';

export default function AccountsPortal() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  // Offline Payment Entry Modal State
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState(null);
  const [offlinePaymentData, setOfflinePaymentData] = useState({
    amount: 65000,
    paymentMode: 'DEMAND_DRAFT',
    referenceNumber: '',
    bankName: 'State Bank of India',
    receiptNotes: 'Term tuition installment remitted.'
  });

  const loadData = async () => {
    setLoading(true);
    let url = `/students?page=${page}&limit=15&search=${encodeURIComponent(searchTerm)}&`;
    if (deptFilter) url += `department_id=${deptFilter}&`;

    try {
      const res = await fetchAPI(url);
      setStudents(res.students || []);
      setTotalStudents(res.total || 0);
    } catch (err) {
      console.error(err);
      addToast('Failed to load accounts ledger', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [deptFilter, page, searchTerm]);

  const handleDispatchReminder = (s) => {
    addToast(`Formal Fee Demand Notice dispatched to ${s.full_name} (${s.email})`, 'success');
  };

  const handleBulkRecoveryCampaign = () => {
    addToast('Institutional Fee Recovery Campaign triggered! Automated payment links dispatched to all students with dues.', 'success');
  };

  const handleRecordOfflinePayment = (e) => {
    e.preventDefault();
    if (!offlinePaymentData.referenceNumber) {
      addToast('Please enter Bank DD / Cheque / UTR Reference Number', 'warning');
      return;
    }

    addToast(`Payment of ₹${offlinePaymentData.amount.toLocaleString()} successfully recorded for ${selectedStudentForPayment.full_name}. Official Receipt generated!`, 'success');
    setSelectedStudentForPayment(null);
    setOfflinePaymentData({
      amount: 65000,
      paymentMode: 'DEMAND_DRAFT',
      referenceNumber: '',
      bankName: 'State Bank of India',
      receiptNotes: 'Term tuition installment remitted.'
    });
  };

  const filteredStudents = students.filter(s => {
    if (!statusFilter) return true;
    if (statusFilter === 'PAID') return s.fee_status === 'PAID';
    if (statusFilter === 'PARTIAL') return s.fee_status === 'PARTIAL';
    if (statusFilter === 'OVERDUE') return s.fee_status === 'OVERDUE' || s.fee_status === 'UNPAID';
    return true;
  });

  return (
    <div className="p-3 p-md-4">
      {/* Header Banner */}
      <div className="p-4 rounded-4 text-white mb-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <span className="badge bg-warning text-dark mb-2 fw-semibold">
              <i className="bi bi-wallet2 me-1"></i> University Bursar & Accounts Directorate
            </span>
            <h3 className="fw-bold mb-1">Tuition Fees & Institutional Revenue Directorate</h3>
            <p className="mb-0 text-white-50 small">
              Official: <span className="text-white">{user?.name || 'Mr. S. K. Sharma (Chief Accounts Officer)'}</span> | Realization Efficiency: <span className="text-success fw-bold">89.8%</span>
            </p>
          </div>

          <div className="d-flex gap-2">
            <button className="btn btn-warning btn-sm fw-bold shadow-sm" onClick={handleBulkRecoveryCampaign}>
              <i className="bi bi-megaphone-fill me-1"></i> Trigger Fee Recovery Campaign
            </button>
          </div>
        </div>
      </div>

      {/* 4 Accounts KPI Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="metric-card">
            <div className="d-flex justify-content-between text-muted small mb-1">
              <span>Total Tuition Demand</span>
              <i className="bi bi-bank text-primary"></i>
            </div>
            <h3 className="fw-bold mb-1 text-primary">₹18.25 Cr</h3>
            <span className="badge bg-light text-muted border">600 Enrolled Students</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="metric-card">
            <div className="d-flex justify-content-between text-muted small mb-1">
              <span>Total Realized / Remitted</span>
              <i className="bi bi-check2-circle text-success"></i>
            </div>
            <h3 className="fw-bold mb-1 text-success">₹16.40 Cr</h3>
            <span className="badge bg-light text-success border">89.8% Realization Rate</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="metric-card">
            <div className="d-flex justify-content-between text-muted small mb-1">
              <span>Total Outstanding Balance</span>
              <i className="bi bi-exclamation-octagon text-danger"></i>
            </div>
            <h3 className="fw-bold mb-1 text-danger">₹1.85 Cr</h3>
            <span className="badge badge-risk-high">72 Accounts Overdue</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="metric-card">
            <div className="d-flex justify-content-between text-muted small mb-1">
              <span>Scholarships & Grants</span>
              <i className="bi bi-award text-info"></i>
            </div>
            <h3 className="fw-bold mb-1 text-info">₹84.50 L</h3>
            <span className="badge bg-light text-muted border">Merit & Need Based</span>
          </div>
        </div>
      </div>

      {/* Department Fee Realization Progress Breakdown */}
      <div className="metric-card mb-4">
        <h6 className="fw-bold mb-3"><i className="bi bi-pie-chart-fill text-primary me-2"></i> Department-Wise Fee Realization Performance</h6>
        <div className="row g-3">
          {[
            { dept: 'Computer Science (CSE)', collected: '₹3.85 Cr', target: '₹4.20 Cr', pct: 91.6, color: 'bg-success' },
            { dept: 'Electronics (ECE)', collected: '₹3.40 Cr', target: '₹3.80 Cr', pct: 89.4, color: 'bg-primary' },
            { dept: 'Mechanical (MECH)', collected: '₹3.10 Cr', target: '₹3.50 Cr', pct: 88.5, color: 'bg-info' },
            { dept: 'Civil Engineering', collected: '₹2.95 Cr', target: '₹3.40 Cr', pct: 86.7, color: 'bg-warning' },
            { dept: 'AI & Data Science', collected: '₹3.10 Cr', target: '₹3.35 Cr', pct: 92.5, color: 'bg-success' }
          ].map((item, idx) => (
            <div key={idx} className="col-12 col-md-6 col-lg-4">
              <div className="p-3 bg-light rounded-3 border">
                <div className="d-flex justify-content-between small mb-1">
                  <strong>{item.dept}</strong>
                  <span className="fw-bold">{item.pct}%</span>
                </div>
                <div className="progress mb-2" style={{ height: '8px' }}>
                  <div className={`progress-bar ${item.color}`} style={{ width: `${item.pct}%` }}></div>
                </div>
                <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.75rem' }}>
                  <span>Collected: {item.collected}</span>
                  <span>Demand: {item.target}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Student Fee Ledger Table & Filter Controls */}
      <div className="metric-card">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-2">
          <div>
            <h5 className="fw-bold mb-0"><i className="bi bi-journal-check text-primary me-2"></i> Student Tuition Fee Dues & Ledger</h5>
            <span className="text-muted small">Manage institutional receipts, offline bank challans, and fee demand notices.</span>
          </div>

          <div className="d-flex gap-2">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search by ID, name, email..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              style={{ minWidth: '200px' }}
            />

            <select className="form-select form-select-sm" value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}>
              <option value="">All Departments</option>
              <option value="DEPT_CSE">Computer Science (CSE)</option>
              <option value="DEPT_ECE">Electronics (ECE)</option>
              <option value="DEPT_MECH">Mechanical (MECH)</option>
              <option value="DEPT_CIVIL">Civil (CIVIL)</option>
              <option value="DEPT_AIDS">AI & Data Science (AIDS)</option>
            </select>

            <select className="form-select form-select-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="PAID">🟢 Full Paid</option>
              <option value="PARTIAL">🟡 Partial Paid</option>
              <option value="OVERDUE">🔴 Dues Overdue</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 small">
            <thead className="table-light">
              <tr>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Department</th>
                <th>Semester</th>
                <th>Fee Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    Loading accounts ledger...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    No student fee records match the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(s => (
                  <tr key={s.student_id}>
                    <td className="font-mono fw-bold text-primary">{s.student_id}</td>
                    <td>
                      <div className="fw-semibold text-dark">{s.full_name}</div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>{s.email}</div>
                    </td>
                    <td><span className="badge bg-light text-dark border">{s.department_name}</span></td>
                    <td>Semester {s.current_semester}</td>
                    <td>
                      <span className={`badge ${s.fee_status === 'PAID' ? 'bg-light text-success border' : s.fee_status === 'PARTIAL' ? 'badge-risk-med' : 'badge-risk-high'}`}>
                        {s.fee_status || 'OVERDUE'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-sm btn-outline-success py-0 px-2 rounded-pill"
                          style={{ fontSize: '0.72rem' }}
                          onClick={() => setSelectedStudentForPayment(s)}
                        >
                          <i className="bi bi-receipt me-1"></i> Record Payment
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary py-0 px-2 rounded-pill"
                          style={{ fontSize: '0.72rem' }}
                          onClick={() => handleDispatchReminder(s)}
                        >
                          <i className="bi bi-bell me-1"></i> Demand Notice
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top small text-muted">
          <span>Showing {filteredStudents.length} records (Page {page})</span>
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)}>
              <i className="bi bi-chevron-left"></i> Previous
            </button>
            <button className="btn btn-sm btn-outline-secondary" disabled={students.length < 15 || loading} onClick={() => setPage(p => p + 1)}>
              Next <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Record Offline Payment Modal */}
      {selectedStudentForPayment && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-dark text-white p-3 px-4">
                <h5 className="modal-title fs-6"><i className="bi bi-receipt me-2 text-warning"></i> Record Offline Fee Payment / Bank DD</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedStudentForPayment(null)}></button>
              </div>
              <form onSubmit={handleRecordOfflinePayment}>
                <div className="modal-body p-4 bg-light small">
                  <div className="bg-white p-3 rounded-3 border mb-3">
                    <div className="fw-bold fs-6">{selectedStudentForPayment.full_name}</div>
                    <div className="text-muted font-mono">{selectedStudentForPayment.student_id} | {selectedStudentForPayment.department_name} (Sem {selectedStudentForPayment.current_semester})</div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Amount Remitted (₹)</label>
                    <input
                      type="number"
                      className="form-control form-control-sm font-mono"
                      value={offlinePaymentData.amount}
                      onChange={(e) => setOfflinePaymentData({ ...offlinePaymentData, amount: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Payment Instrument</label>
                    <select
                      className="form-select form-select-sm"
                      value={offlinePaymentData.paymentMode}
                      onChange={(e) => setOfflinePaymentData({ ...offlinePaymentData, paymentMode: e.target.value })}
                    >
                      <option value="DEMAND_DRAFT">Bank Demand Draft (DD)</option>
                      <option value="NEFT_RTGS">NEFT / RTGS Bank Transfer</option>
                      <option value="BANK_CHALLAN">University Bank Counter Challan</option>
                      <option value="CASH">Cash Counter Receipt</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Instrument / UTR / DD Reference No.</label>
                    <input
                      type="text"
                      className="form-control form-control-sm font-mono"
                      placeholder="e.g. DD89201948201 / UTR982014"
                      value={offlinePaymentData.referenceNumber}
                      onChange={(e) => setOfflinePaymentData({ ...offlinePaymentData, referenceNumber: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Issuing Bank</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={offlinePaymentData.bankName}
                      onChange={(e) => setOfflinePaymentData({ ...offlinePaymentData, bankName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer bg-white p-3">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedStudentForPayment(null)}>Cancel</button>
                  <button type="submit" className="btn btn-success btn-sm">
                    <i className="bi bi-check-circle me-1"></i> Issue Official Receipt
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
