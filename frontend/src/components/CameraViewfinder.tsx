import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, AlertCircle, RefreshCw } from 'lucide-react';
import { DetectedFace } from '../types';

interface CameraViewfinderProps {
  onFrameCapture?: (base64Image: string) => void;
  detectedFaces?: DetectedFace[];
  isStreaming?: boolean;
  captureIntervalMs?: number;
  showOverlay?: boolean;
  className?: string;
  overlayText?: string;
}

export const CameraViewfinder: React.FC<CameraViewfinderProps> = ({
  onFrameCapture,
  detectedFaces = [],
  isStreaming = true,
  captureIntervalMs = 500, // 2 FPS to prevent network saturating
  showOverlay = true,
  className = '',
  overlayText,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [fps, setFps] = useState<number>(0);
  const [cameraActive, setCameraActive] = useState<boolean>(false);

  // Initialize camera
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let isCancelled = false;

    const startCamera = async () => {
      try {
        setPermissionError(null);
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (isCancelled) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        activeStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current
            .play()
            .then(() => {
              if (!isCancelled) setCameraActive(true);
            })
            .catch((err) => {
              if (err.name !== 'AbortError') {
                console.error('Camera play error:', err);
              }
            });
        }
      } catch (err: any) {
        if (isCancelled) return;
        console.error('Camera permission or device error:', err);
        setPermissionError(
          err.name === 'NotAllowedError'
            ? 'Camera access was denied. Please allow camera access in browser permissions.'
            : 'Could not detect an active camera device.'
        );
        setCameraActive(false);
      }
    };

    if (isStreaming) {
      startCamera();
    }

    return () => {
      isCancelled = true;
      if (videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.srcObject = null;
        } catch (_) {}
      }
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      setCameraActive(false);
    };
  }, [isStreaming]);

  // Periodic frame grabber
  useEffect(() => {
    if (!cameraActive || !onFrameCapture || !isStreaming) return;

    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = setInterval(() => {
      setFps(frameCount);
      frameCount = 0;
    }, 1000);

    const interval = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.readyState < 2) return; // HAVE_CURRENT_DATA

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        onFrameCapture(base64);
        frameCount++;
      }
    }, captureIntervalMs);

    return () => {
      clearInterval(interval);
      clearInterval(fpsTimer);
    };
  }, [cameraActive, isStreaming, onFrameCapture, captureIntervalMs]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-center ${className}`}
    >
      {permissionError ? (
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-md">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <CameraOff className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">Camera Unavailable</h3>
          <p className="text-xs text-slate-400">{permissionError}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium space-x-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Camera</span>
          </button>
        </div>
      ) : (
        <>
          {/* Main Video Feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />

          {/* Hidden Canvas for JPEG snapshot extraction */}
          <canvas ref={canvasRef} className="hidden" />

          {/* SVG Bounding Box Overlays */}
          {showOverlay && videoRef.current && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none transform -scale-x-100"
              viewBox={`0 0 ${videoRef.current.videoWidth || 640} ${
                videoRef.current.videoHeight || 480
              }`}
            >
              {detectedFaces.map((face, index) => {
                const [x1, y1, x2, y2] = face.box;
                const width = x2 - x1;
                const height = y2 - y1;

                const isRecognized = face.status !== 'UNKNOWN';
                const strokeColor = isRecognized ? '#22c55e' : '#f59e0b';
                const fillColor = isRecognized
                  ? 'rgba(34, 197, 94, 0.15)'
                  : 'rgba(245, 158, 11, 0.15)';

                return (
                  <g key={index}>
                    {/* Bounding Rectangle */}
                    <rect
                      x={x1}
                      y={y1}
                      width={width}
                      height={height}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth="3"
                      rx="8"
                    />

                    {/* Corner Reticles */}
                    <path
                      d={`M ${x1} ${y1 + 15} L ${x1} ${y1} L ${x1 + 15} ${y1}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="4"
                    />
                    <path
                      d={`M ${x2 - 15} ${y1} L ${x2} ${y1} L ${x2} ${y1 + 15}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="4"
                    />
                    <path
                      d={`M ${x1} ${y2 - 15} L ${x1} ${y2} L ${x1 + 15} ${y2}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="4"
                    />
                    <path
                      d={`M ${x2 - 15} ${y2} L ${x2} ${y2} L ${x2 - 15} ${y2}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="4"
                    />
                  </g>
                );
              })}
            </svg>
          )}

          {/* Top Status HUD */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <div className="flex items-center space-x-2 bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800 text-white text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 -ml-4" />
              <span className="font-mono font-medium">LIVE VISION</span>
              <span className="text-slate-500">|</span>
              <span className="font-mono text-slate-300">{fps} FPS</span>
            </div>

            {overlayText && (
              <div className="bg-slate-950/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-brand-500/30 text-brand-300 text-xs font-semibold shadow-lg">
                {overlayText}
              </div>
            )}
          </div>

          {/* Bottom HUD: Detected Faces Summary */}
          {detectedFaces.length > 0 && (
            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2 pointer-events-none">
              {detectedFaces.map((face, i) => (
                <div
                  key={i}
                  className={`px-3 py-1.5 rounded-lg backdrop-blur-md text-xs font-semibold border flex items-center space-x-2 ${
                    face.status !== 'UNKNOWN'
                      ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                      : 'bg-amber-950/80 border-amber-500/50 text-amber-200'
                  }`}
                >
                  <span className="font-bold">
                    {face.status === 'NEW_PRESENT'
                      ? '✓ PRESENT'
                      : face.status === 'ALREADY_MARKED'
                      ? '✓ MARKED'
                      : '⚠ UNKNOWN'}
                  </span>
                  <span>{face.student_name}</span>
                  {face.similarity_score > 0 && (
                    <span className="opacity-75 font-mono text-[10px]">
                      {(face.similarity_score * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
