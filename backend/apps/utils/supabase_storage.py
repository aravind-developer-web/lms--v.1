import os
import mimetypes
from supabase import create_client, Client
from django.conf import settings
from django.core.files.base import ContentFile
import uuid

class SupabaseStorage:
    def __init__(self):
        self.url: str = os.environ.get("SUPABASE_URL")
        self.key: str = os.environ.get("SUPABASE_KEY")
        self.bucket_name = "lms-videos"
        
        if not self.url or not self.key:
            raise ValueError("Supabase URL or Key missing from environment")

        self.client: Client = create_client(self.url, self.key)

    def upload_file(self, file_obj, destination_path=None):
        """
        Uploads a Django file object to Supabase Storage.
        Returns the public URL.
        """
        try:
            # Generate unique path if not provided
            if not destination_path:
                ext = file_obj.name.split('.')[-1]
                filename = f"{uuid.uuid4()}.{ext}"
                destination_path = f"videos/{filename}"

            # Read file content - streaming optimized
            # We pass the file_obj directly to Supabase (storage3/requests handles streaming)
            # Ensure pointer is at start
            if hasattr(file_obj, 'seek'):
                file_obj.seek(0)

            # Detect MIME type
            content_type, _ = mimetypes.guess_type(file_obj.name)
            
            # Explicit fallback for mp4 to ensure browser playback
            if not content_type and file_obj.name.lower().endswith('.mp4'):
                content_type = 'video/mp4'
            
            if not content_type:
                content_type = 'application/octet-stream'

            # Upload to Supabase
            # Fix: Read file content strictly as bytes to satisfy 'storage3' types.
            # While streaming is better, functionality is priority.
            file_content = file_obj.read()
            
            res = self.client.storage.from_(self.bucket_name).upload(
                file=file_content,
                path=destination_path,
                file_options={"content-type": content_type, "cache-control": "3600"}
            )

            # Get Public URL
            public_url = self.client.storage.from_(self.bucket_name).get_public_url(destination_path)
            
            return public_url

        except Exception as e:
            print(f"Supabase Upload Error: {e}")
            raise e

# Singleton instance
supabase_storage = SupabaseStorage()
