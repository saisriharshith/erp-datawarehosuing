"""
Hugging Face Spaces Entrypoint (Gradio SDK & FastAPI)
Runs the VisionAttend Face Recognition System with 16GB RAM.
"""

import os
import sys

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

import uvicorn
from backend.app.main import app

try:
    import gradio as gr

    with gr.Blocks(title="VisionAttend AI Face Attendance") as demo:
        gr.HTML("""
        <div style="text-align: center; padding: 30px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="font-size: 48px; margin-bottom: 12px;">🎓📸</div>
            <h1 style="font-size: 26px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0;">
                VisionAttend: AI Face Recognition Attendance System
            </h1>
            <p style="font-size: 15px; color: #64748b; max-width: 600px; margin: 0 auto 24px auto; line-height: 1.5;">
                Enterprise facial recognition attendance tracking powered by InsightFace ArcFace 512-D vectors, FastAPI, and MongoDB.
            </p>
            <div style="display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;">
                <a href="/admin/dashboard" target="_blank" style="display: inline-flex; align-items: center; padding: 12px 24px; background: linear-gradient(135deg, #0284c7, #2563eb); color: #ffffff; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);">
                    Open Web Portal &rarr;
                </a>
                <a href="/docs" target="_blank" style="display: inline-flex; align-items: center; padding: 12px 24px; background: #ffffff; color: #334155; border: 1px solid #cbd5e1; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    Interactive API Docs (/docs) &rarr;
                </a>
            </div>
            <div style="margin-top: 30px; padding: 12px; background: #f8fafc; border-radius: 10px; display: inline-block; font-size: 12px; color: #64748b;">
                Admin Credentials: <code style="color: #0284c7; font-weight: bold;">admin@college.edu</code> &bull; <code style="color: #0284c7; font-weight: bold;">Admin@12345</code>
            </div>
        </div>
        """)

    # Mount FastAPI with the Gradio interface
    app = gr.mount_gradio_app(app, demo, path="/gradio")

    if __name__ == "__main__":
        port = int(os.environ.get("PORT", 7860))
        demo.launch(server_name="0.0.0.0", server_port=port)

except ImportError:
    # If gradio is not installed, launch FastAPI via Uvicorn directly
    if __name__ == "__main__":
        port = int(os.environ.get("PORT", 7860))
        uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port)
