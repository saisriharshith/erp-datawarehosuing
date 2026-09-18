"""
ImageKit Cloud Storage Service
Handles secure image uploading, CDN delivery, and deletion with local mock fallback.
"""

import asyncio
import base64
import os
import uuid
from typing import Dict, Optional, Union
from ..core.config import settings
from ..core.logging import logger

try:
    from imagekitio import ImageKit
except ImportError:
    ImageKit = None


class ImageKitService:
    def __init__(self):
        self.is_configured = False
        self.client = None
        self._init_client()

    def _init_client(self):
        if (
            ImageKit is not None
            and settings.IMAGEKIT_PRIVATE_KEY
            and not settings.IMAGEKIT_PRIVATE_KEY.startswith("your_")
        ):
            try:
                # Modern ImageKit Python SDK v5 takes private_key
                self.client = ImageKit(private_key=settings.IMAGEKIT_PRIVATE_KEY)
                self.is_configured = True
                logger.info("ImageKit cloud storage client successfully initialized with live API credentials.")
            except Exception as e:
                try:
                    self.client = ImageKit(
                        private_key=settings.IMAGEKIT_PRIVATE_KEY,
                        public_key=settings.IMAGEKIT_PUBLIC_KEY,
                        url_endpoint=settings.IMAGEKIT_URL_ENDPOINT
                    )
                    self.is_configured = True
                    logger.info("ImageKit cloud storage client initialized with legacy parameters.")
                except Exception as legacy_err:
                    logger.warning(f"Failed to initialize ImageKit client: {e} / {legacy_err}. Using mock storage.")
                    self.is_configured = False
        else:
            logger.info("ImageKit private key not set or placeholder detected. Operating in simulated cloud storage mode.")
            self.is_configured = False

    async def upload_image(
        self,
        image_bytes_or_base64: Union[str, bytes],
        file_name: str,
        folder: str = "students"
    ) -> Dict[str, str]:
        """
        Uploads image to ImageKit.
        Returns dict with `file_id` and `url`.
        """
        if self.is_configured and self.client:
            try:
                # Ensure bytes payload for modern imagekitio SDK
                if isinstance(image_bytes_or_base64, bytes):
                    payload_bytes = image_bytes_or_base64
                else:
                    payload = str(image_bytes_or_base64)
                    if payload.startswith("data:image"):
                        payload = payload.split(",", 1)[1]
                    payload_bytes = base64.b64decode(payload)

                clean_folder = f"/{settings.IMAGEKIT_FOLDER.strip('/')}/{folder.strip('/')}"
                loop = asyncio.get_running_loop()

                if hasattr(self.client, "files") and hasattr(self.client.files, "upload"):
                    # Modern ImageKit SDK v5
                    response = await loop.run_in_executor(
                        None,
                        lambda: self.client.files.upload(
                            file=payload_bytes,
                            file_name=file_name,
                            folder=clean_folder,
                            use_unique_file_name=True,
                            tags=["attendance", folder]
                        )
                    )
                else:
                    # Legacy ImageKit SDK
                    response = await loop.run_in_executor(
                        None,
                        lambda: self.client.upload(
                            file=payload_bytes,
                            file_name=file_name,
                            folder=clean_folder,
                            use_unique_file_name=True,
                            tags=["attendance", folder]
                        )
                    )

                file_id = getattr(response, "file_id", None) or getattr(response, "fileId", None)
                url = getattr(response, "url", None)
                if not url:
                    url = f"{settings.IMAGEKIT_URL_ENDPOINT.rstrip('/')}/{folder}/{file_name}"

                logger.info(f"Image successfully uploaded to ImageKit: {url} (ID: {file_id})")
                return {
                    "file_id": str(file_id or uuid.uuid4().hex[:12]),
                    "url": str(url),
                    "is_mock": False
                }
            except Exception as e:
                logger.error(f"ImageKit upload error: {e}. Falling back to simulated storage.")

        # Fallback simulation
        simulated_id = f"ik_mock_{uuid.uuid4().hex[:12]}"
        simulated_url = f"https://ik.imagekit.io/mock_cdn/{folder}/{file_name}_{simulated_id}.jpg"
        return {
            "file_id": simulated_id,
            "url": simulated_url,
            "is_mock": True
        }

    async def delete_image(self, file_id: str) -> bool:
        """Deletes an image from ImageKit by file_id."""
        if not self.is_configured or not self.client or not file_id or file_id.startswith("ik_mock_"):
            return True
        try:
            loop = asyncio.get_running_loop()
            if hasattr(self.client, "files") and hasattr(self.client.files, "delete"):
                await loop.run_in_executor(
                    None,
                    lambda: self.client.files.delete(file_id=file_id)
                )
            else:
                await loop.run_in_executor(
                    None,
                    lambda: self.client.delete_file(file_id=file_id)
                )
            logger.info(f"ImageKit file {file_id} deleted successfully.")
            return True
        except Exception as e:
            logger.error(f"Error deleting file {file_id} from ImageKit: {e}")
            return False


imagekit_service = ImageKitService()
