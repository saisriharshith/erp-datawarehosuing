import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';

export default function LineageModal({ onClose }) {
  const [lineage, setLineage] = useState([]);
  const [selectedKpi, setSelectedKpi] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchAPI('/analytics/lineage')
      .then(data => {
        setLineage(data || []);
        if (data && data.length > 0) setSelectedKpi(data[0]);
      })
      .catch(err => console.error(err));
  }, []);

  const handleCopy = () => {
    if (selectedKpi && selectedKpi.mongo_aggregation_pipeline) {
      navigator.clipboard.writeText(selectedKpi.mongo_aggregation_pipeline);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.6)' }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-dark text-white">
            <h5 className="modal-title d-flex align-items-center gap-2">
              <i className="bi bi-diagram-3-fill text-indigo"></i>
              <span>Visual Data Lineage & MongoDB Query Inspector</span>
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <div className="modal-body p-4">
            <div className="row g-3">
              <div className="col-md-4 border-end">
                <h6 className="fw-bold small text-muted text-uppercase mb-3">Enterprise KPIs</h6>
                <div className="list-group list-group-flush">
                  {lineage.map(kpi => (
                    <button
                      key={kpi.metric_key}
                      className={`list-group-item list-group-item-action text-start p-2 rounded mb-1 border-0 ${selectedKpi?.metric_key === kpi.metric_key ? 'bg-primary text-white' : ''}`}
                      onClick={() => setSelectedKpi(kpi)}
                    >
                      <div className="fw-semibold small">{kpi.display_name}</div>
                      <div className={selectedKpi?.metric_key === kpi.metric_key ? 'text-light small' : 'text-muted small'} style={{ fontSize: '0.75rem' }}>
                        Category: {kpi.category}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-md-8">
                {selectedKpi && (
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div>
                        <h5 className="mb-0 fw-bold">{selectedKpi.display_name}</h5>
                        <span className="badge bg-light text-dark border small mt-1">{selectedKpi.category}</span>
                      </div>
                      <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" onClick={handleCopy}>
                        <i className={`bi ${copied ? 'bi-check-lg text-success' : 'bi-clipboard'}`}></i>
                        <span>{copied ? 'Copied Pipeline!' : 'Copy Aggregation'}</span>
                      </button>
                    </div>

                    {/* Flowchart Boxes */}
                    <div className="p-3 bg-light rounded border mb-3">
                      <div className="row text-center g-2 align-items-center">
                        <div className="col-4">
                          <div className="p-2 bg-white rounded border shadow-sm">
                            <span className="badge bg-warning text-dark mb-1" style={{ fontSize: '0.65rem' }}>RAW SOURCE</span>
                            <div className="fw-semibold small font-mono text-truncate">{selectedKpi.source_collection}</div>
                          </div>
                        </div>
                        <div className="col-1 text-muted fs-5"><i className="bi bi-arrow-right"></i></div>
                        <div className="col-3">
                          <div className="p-2 bg-white rounded border shadow-sm">
                            <span className="badge bg-info text-dark mb-1" style={{ fontSize: '0.65rem' }}>ETL PROCESS</span>
                            <div className="small fw-semibold">Cleanse & Star Schema</div>
                          </div>
                        </div>
                        <div className="col-1 text-muted fs-5"><i className="bi bi-arrow-right"></i></div>
                        <div className="col-3">
                          <div className="p-2 bg-white rounded border shadow-sm">
                            <span className="badge bg-success mb-1" style={{ fontSize: '0.65rem' }}>WAREHOUSE</span>
                            <div className="fw-semibold small font-mono text-truncate">{selectedKpi.warehouse_collection}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Calculation Logic & Transformations */}
                    <div className="mb-3">
                      <h6 className="fw-bold small text-muted mb-1">Mathematical Formula:</h6>
                      <div className="p-2 bg-white rounded border font-mono small text-primary">{selectedKpi.calculation_logic}</div>
                    </div>

                    <div className="mb-3">
                      <h6 className="fw-bold small text-muted mb-1">Data Transformations:</h6>
                      <ul className="small text-muted mb-0 ps-3">
                        {(selectedKpi.etl_transformations || []).map((t, idx) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    </div>

                    {/* PyMongo Aggregation Pipeline Code */}
                    <div>
                      <h6 className="fw-bold small text-muted mb-1">MongoDB Aggregation Pipeline Query:</h6>
                      <pre className="p-3 bg-dark text-success rounded font-mono small mb-0" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                        {selectedKpi.mongo_aggregation_pipeline}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
