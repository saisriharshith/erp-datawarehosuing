"""
ERP Data Warehouse & Decision Support System - Flask Application
----------------------------------------------------------------
Production REST API server entrypoint with modular blueprints, CORS support,
database connectivity, and global error handling.
"""

import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.config import Config
from backend.extensions import db_manager
from backend.utils.helpers import error_response

# Import Route Blueprints
from backend.routes.health import health_bp
from backend.routes.analytics import analytics_bp
from backend.routes.students import students_bp
from backend.routes.attendance import attendance_bp
from backend.routes.examinations import examinations_bp
from backend.routes.fees import fees_bp
from backend.routes.library import library_bp
from backend.routes.faculty import faculty_bp
from backend.routes.prediction import prediction_bp
from backend.routes.quality import quality_bp
from backend.routes.auth import auth_bp
from backend.routes.etl import etl_bp


def create_app(config_class=Config) -> Flask:
    """Application Factory."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Initialize Database Manager
    db_manager.init_app(
        uri=app.config["MONGODB_URI"],
        warehouse_db_name=app.config["WAREHOUSE_DB_NAME"],
        source_db_name=app.config["SOURCE_DB_NAME"]
    )

    # Register Blueprints under /api prefix
    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(analytics_bp, url_prefix="/api")
    app.register_blueprint(students_bp, url_prefix="/api")
    app.register_blueprint(attendance_bp, url_prefix="/api")
    app.register_blueprint(examinations_bp, url_prefix="/api")
    app.register_blueprint(fees_bp, url_prefix="/api")
    app.register_blueprint(library_bp, url_prefix="/api")
    app.register_blueprint(faculty_bp, url_prefix="/api")
    app.register_blueprint(prediction_bp, url_prefix="/api")
    app.register_blueprint(quality_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(etl_bp, url_prefix="/api")

    # Global Error Handlers
    @app.errorhandler(400)
    def bad_request_handler(e):
        return error_response(message="Bad Request: Malformed or missing parameters", status_code=400)

    @app.errorhandler(404)
    def not_found_handler(e):
        return error_response(message="API Endpoint or Resource Not Found", status_code=404)

    @app.errorhandler(500)
    def server_error_handler(e):
        return error_response(message="Internal Server Error occurred", status_code=500)

    @app.route("/", methods=["GET"])
    def root_index():
        return jsonify({
            "service": "ERP Data Warehouse & Decision Support REST API",
            "documentation": "/api/health",
            "version": "1.0.0",
            "status": "active"
        }), 200

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    print(f"Starting Flask API Server on http://0.0.0.0:{port}...")
    app.run(host="0.0.0.0", port=port, debug=Config.DEBUG)
