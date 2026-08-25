import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';

export default function FeePaymentModal({ student, summaryCards, onClose, onPaymentSuccess }) {
  const { addToast } = useToast();
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState(null);

  const outstanding = summaryCards?.fee_outstanding || 65000;

  const handlePay = (e) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      const receipt = {
        txn_id: `TXN_${Date.now()}`,
        date: new Date().toLocaleDateString(),
        amount: outstanding,
        mode: paymentMode,
        student_id: student.student_id,
        student_name: student.full_name,
        semester: student.semester
      };
      setPaymentReceipt(receipt);
      addToast(`Payment of ₹${outstanding.toLocaleString()} successful!`, 'success');
      if (onPaymentSuccess) onPaymentSuccess();
    }, 1200);
  };

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)' }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div className="modal-header bg-dark text-white p-3 px-4 d-print-none">
            <h5 className="modal-title fs-6 fw-bold">
              <i className="bi bi-credit-card-2-front-fill text-success me-2"></i>
              Online Tuition Fee Payment Portal
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4 bg-white">
            {paymentReceipt ? (
              <div className="text-center printable-area p-3">
                <div className="fs-1 text-success mb-2"><i className="bi bi-check-circle-fill"></i></div>
                <h5 className="fw-bold mb-1">Fee Payment Receipt</h5>
                <p className="text-muted small mb-3">University Accounts Directorate</p>

                <div className="bg-light p-3 rounded-3 border text-start small mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Transaction ID:</span>
                    <strong className="font-mono">{paymentReceipt.txn_id}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Student:</span>
                    <strong>{paymentReceipt.student_name} ({paymentReceipt.student_id})</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Semester:</span>
                    <strong>Semester {paymentReceipt.semester}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Amount Remitted:</span>
                    <strong className="text-success fs-6">₹{paymentReceipt.amount.toLocaleString()}</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Payment Mode:</span>
                    <span className="badge bg-light text-dark border">{paymentReceipt.mode}</span>
                  </div>
                </div>

                <div className="d-flex gap-2 justify-content-center d-print-none">
                  <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>Close</button>
                  <button className="btn btn-sm btn-primary" onClick={() => window.print()} style={{ background: '#4f46e5', borderColor: '#4f46e5' }}>
                    <i className="bi bi-printer me-1"></i> Print Receipt
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePay}>
                <div className="p-3 bg-light rounded-3 border text-center mb-3">
                  <div className="text-muted small">Outstanding Tuition Balance</div>
                  <h3 className="fw-bold text-danger my-1">₹{outstanding.toLocaleString()}</h3>
                  <span className="badge bg-light text-muted border">Semester {student.semester} Tuition & Examination Fee</span>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Select Payment Method</label>
                  <div className="d-flex gap-2">
                    {['UPI / QR', 'Credit / Debit Card', 'Net Banking'].map(mode => (
                      <button
                        key={mode}
                        type="button"
                        className={`btn btn-sm flex-grow-1 ${paymentMode === mode ? 'btn-primary' : 'btn-outline-secondary'}`}
                        style={paymentMode === mode ? { background: '#4f46e5', borderColor: '#4f46e5' } : {}}
                        onClick={() => setPaymentMode(mode)}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Card / UPI ID</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    defaultValue="student@upi"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-success btn-sm w-100 py-2 fw-semibold shadow-sm"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <span><span className="spinner-border spinner-border-sm me-2"></span> Processing Gateway...</span>
                  ) : (
                    <span><i className="bi bi-lock-fill me-1"></i> Pay ₹{outstanding.toLocaleString()} Instantly</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
