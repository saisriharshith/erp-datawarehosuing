import React, { useState } from 'react';
import { fetchAPI } from '../services/api';

export default function ETLModal({ onClose }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRunETL = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const data = await fetchAPI('/etl/trigger', { method: 'POST' });
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to trigger live ETL');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.6)' }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-dark text-white">
            <h5 className="modal-title d-flex align-items-center gap-2">
              <i className="bi bi-lightning-charge-fill text-warning"></i>
              <span>Live Institutional ETL Pipeline Execution</span>
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <div className="modal-body p-4">
            <p className="text-muted small">
              Triggers the end-to-end data ingestion pipeline: extracts from raw heterogeneous MongoDB <code>erp_source</code> collections, applies schema transformations & deduplication, computes 5-dimension quality scores, and bulk upserts into <code>erp_warehouse</code>.
            </p>

            {!running && !result && !error && (
              <div className="text-center py-4 bg-light rounded border">
                <i className="bi bi-cpu text-primary display-4 d-block mb-3"></i>
                <h6>Ready to execute pipeline in real time</h6>
                <button className="btn btn-primary px-4 py-2 mt-2 fw-semibold" onClick={handleRunETL} style={{ background: '#4f46e5', borderColor: '#4f46e5' }}>
                  <i className="bi bi-play-circle me-2"></i> Start Pipeline Ingestion
                </button>
              </div>
            )}

            {running && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status"></div>
                <h5>Running Data Warehouse ETL Pipeline...</h5>
                <p className="text-muted small">Sanitizing anomalies, validating referential integrity, and scoring data quality.</p>
              </div>
            )}

            {error && (
              <div className="alert alert-danger">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <strong>Pipeline Error:</strong> {error}
              </div>
            )}

            {result && (
              <div className="bg-light p-3 rounded border">
                <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                  <span className="badge bg-success fs-6"><i className="bi bi-check-circle me-1"></i> {result.pipeline_status}</span>
                  <span className="text-muted small font-mono">Execution: {result.execution_time_seconds}s</span>
                </div>

                <div className="row g-2 text-center mb-3">
                  <div className="col-3">
                    <div className="p-2 bg-white rounded border">
                      <div className="text-muted small">Extracted</div>
                      <div className="fw-bold">{result.records_extracted?.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className="p-2 bg-white rounded border">
                      <div className="text-muted small">Cleaned & Loaded</div>
                      <div className="fw-bold text-success">{result.records_cleaned_and_loaded?.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className="p-2 bg-white rounded border">
                      <div className="text-muted small">DQ Score</div>
                      <div className="fw-bold text-primary">{result.data_quality_score}%</div>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className="p-2 bg-white rounded border">
                      <div className="text-muted small">ML Accuracy</div>
                      <div className="fw-bold text-indigo">{result.model_accuracy}%</div>
                    </div>
                  </div>
                </div>

                <h6 className="fw-bold small mb-2">Executed Steps:</h6>
                <div className="list-group list-group-flush small">
                  {(result.steps_executed || []).map((step, idx) => (
                    <div key={idx} className="list-group-item bg-transparent d-flex justify-content-between align-items-center py-1 px-0">
                      <div>
                        <strong>{step.name}</strong>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{step.detail}</div>
                      </div>
                      <span className="badge bg-light text-success border"><i className="bi bi-check me-1"></i>{step.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
