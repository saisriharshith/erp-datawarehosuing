"""
Database Connection & Data Access Layer
---------------------------------------
Manages MongoDB Atlas client connections and provides transparent data access
with fallback to local warehouse snapshots for seamless demonstration resilience.
"""

import os
import json
from typing import Optional, Dict, Any, List

try:
    import pymongo
    from pymongo.errors import PyMongoError, ConnectionFailure, ServerSelectionTimeoutError
    PYMONGO_AVAILABLE = True
except ImportError:
    pymongo = None
    PYMONGO_AVAILABLE = False
    PyMongoError = Exception


class DatabaseManager:
    """Singleton MongoDB & Warehouse Data Manager."""
    
    def __init__(self):
        self.client = None
        self.warehouse_db = None
        self.source_db = None
        self.is_connected = False
        self._local_cache = None

    def init_app(self, uri: str, warehouse_db_name: str, source_db_name: str):
        """Initializes database connections."""
        if not PYMONGO_AVAILABLE:
            print("[DB-MANAGER] PyMongo not available. Running in standalone snapshot mode.")
            self._load_local_cache()
            return

        try:
            import certifi
            ca = certifi.where()
            self.client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=3000, tlsCAFile=ca)
            self.client.admin.command("ping")
            self.warehouse_db = self.client[warehouse_db_name]
            self.source_db = self.client[source_db_name]
            self.is_connected = True
            print(f"[DB-MANAGER] Connected to MongoDB Atlas / Local at '{uri}'")
        except Exception as e:
            print(f"[DB-MANAGER] MongoDB connection check failed ({e}). Using local warehouse cache.")
            self.is_connected = False
            self._load_local_cache()

    def _load_local_cache(self):
        """Loads warehouse snapshot from disk for offline standalone mode."""
        snapshot_path = os.path.abspath(os.path.join(
            os.path.dirname(__file__), "..", "data", "warehouse", "warehouse_snapshot.json"
        ))
        if os.path.exists(snapshot_path):
            try:
                with open(snapshot_path, "r", encoding="utf-8") as f:
                    self._local_cache = json.load(f)
                print("[DB-MANAGER] Local warehouse snapshot loaded successfully.")
            except Exception as e:
                print(f"[DB-MANAGER] Error loading snapshot: {e}")
                self._local_cache = {}
        else:
            self._local_cache = {}

    def get_collection_data(self, collection_name: str) -> List[Dict[str, Any]]:
        """
        Fetches collection records either from live MongoDB or from local cache.
        """
        if self.is_connected and self.warehouse_db is not None:
            try:
                live_data = list(self.warehouse_db[collection_name].find({}, {"_id": 0}))
                if live_data and len(live_data) > 0:
                    return live_data
            except Exception as e:
                print(f"[DB-MANAGER] Live query failed on '{collection_name}', falling back to cache: {e}")

        # Fallback to local cache
        if self._local_cache is None:
            self._load_local_cache()

        # Check in dimensions
        if "dimensions" in self._local_cache and collection_name in self._local_cache["dimensions"]:
            return self._local_cache["dimensions"][collection_name]

        # Check in facts
        if "facts" in self._local_cache and collection_name in self._local_cache["facts"]:
            return self._local_cache["facts"][collection_name]

        # Check in root
        if collection_name in self._local_cache:
            return self._local_cache[collection_name]

        # Check predictions file
        if collection_name == "risk_predictions":
            preds_file = os.path.abspath(os.path.join(
                os.path.dirname(__file__), "..", "data", "warehouse", "risk_predictions.json"
            ))
            if os.path.exists(preds_file):
                with open(preds_file, "r", encoding="utf-8") as f:
                    return json.load(f)

        return []

    def check_health(self) -> dict:
        """Returns connection health diagnostics."""
        return {
            "mongodb_connected": self.is_connected,
            "mode": "Live MongoDB Cluster" if self.is_connected else "Standalone Cache (Resilient Fallback)",
            "warehouse_status": "Ready",
            "active_collections": [
                "dim_students", "dim_departments", "dim_subjects", "dim_faculty", "dim_dates",
                "fact_attendance", "fact_examinations", "fact_fees", "fact_library",
                "data_quality_reports", "risk_predictions", "kpi_lineage_definitions"
            ]
        }


db_manager = DatabaseManager()
