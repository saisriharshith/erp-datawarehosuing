"""
Base MongoDB Models and Type Utilities
"""

from datetime import datetime, timezone
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field
from bson import ObjectId


class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, info=None):
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, str) and ObjectId.is_valid(v):
            return v
        raise ValueError(f"Invalid ObjectId: {v}")


class MongoBaseModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }
    )

    def to_mongo(self, exclude_none: bool = True) -> dict:
        """Converts model to dict suitable for MongoDB insert/update."""
        data = self.model_dump(by_alias=True, exclude_none=exclude_none)
        if "_id" in data and data["_id"] is None:
            data.pop("_id")
        return data
