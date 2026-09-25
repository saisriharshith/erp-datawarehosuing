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
  isMirrored?: boolean;
}

export const CameraViewfinder: React.FC<CameraViewfinderProps> = ({
  onFrameCapture,
  detectedFaces = [],
  isStreaming = true,
  captureIntervalMs = 500, // 2 FPS to prevent network saturating
  showOverlay = true,
  className = '',
  overlayText,
  isMirrored = true,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [fps, setFps] = useState<number>(0);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number }>({
    width: 640,
    height: 480,
  });

  // Smooth persistence for detected faces so boxes don't flicker on frame drops
  const [persistedFaces, setPersistedFaces] = useState<DetectedFace[]>([]);
  const lastFacesTimeRef = useRef<number>(0);

  useEffect(() => {
    if (detectedFaces && detectedFaces.length > 0) {
      setPersistedFaces(detectedFaces);
      lastFacesTimeRef.current = Date.now();
    } else {
      // Clear faces after 1000ms if no new faces are detected
      const timer = setTimeout(() => {
        if (Date.now() - lastFacesTimeRef.current >= 950) {
          setPersistedFaces([]);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [detectedFaces]);

  // Sync video dimensions
  const updateVideoDimensions = () => {
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      setVideoDimensions({
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      });
    }
  };

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
              if (!isCancelled) {
                setCameraActive(true);
                updateVideoDimensions();
              }
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
      setPersistedFaces([]);
    };
  }, [isStreaming]);

  // Periodic frame grabber
  useEffect(() => {
    if (!cameraActive || !onFrameCapture || !isStreaming) return;

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

      if (video.videoWidth && (video.videoWidth !== videoDimensions.width || video.videoHeight !== videoDimensions.height)) {
        setVideoDimensions({
          width: video.videoWidth,
          height: video.videoHeight,
        });
      }

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
  }, [cameraActive, isStreaming, onFrameCapture, captureIntervalMs, videoDimensions]);

  const activeFaces = persistedFaces.length > 0 ? persistedFaces : detectedFaces;
  const vw = videoDimensions.width || 640;
  const vh = videoDimensions.height || 480;
  const scale = Math.max(0.6, vw / 640);

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
            onLoadedMetadata={updateVideoDimensions}
            onPlay={updateVideoDimensions}
            className={`w-full h-full object-cover ${isMirrored ? 'transform -scale-x-100' : ''}`}
          />

          {/* Hidden Canvas for JPEG snapshot extraction */}
          <canvas ref={canvasRef} className="hidden" />

          {/* SVG Bounding Box Overlays with Names on the Boxes */}
          {showOverlay && videoRef.current && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox={`0 0 ${vw} ${vh}`}
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                {/* Emerald Glow for Verified Faces */}
                <filter id="box-glow-emerald" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation={4 * scale} floodColor="#22c55e" floodOpacity="0.45" />
                </filter>
                {/* Amber Glow for Unrecognized Faces */}
                <filter id="box-glow-amber" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation={4 * scale} floodColor="#f59e0b" floodOpacity="0.45" />
                </filter>
                {/* Biometric Scanning Laser Gradients */}
                <linearGradient id="scan-laser-emerald" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0" />
                  <stop offset="25%" stopColor="#22c55e" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#86efac" stopOpacity="1" />
                  <stop offset="75%" stopColor="#22c55e" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="scan-laser-amber" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0" />
                  <stop offset="25%" stopColor="#f59e0b" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#fde68a" stopOpacity="1" />
                  <stop offset="75%" stopColor="#f59e0b" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </linearGradient>
              </defs>

              {activeFaces.map((face, index) => {
                // Ensure valid coordinates
                const xMin = Math.min(face.box[0], face.box[2]);
                const xMax = Math.max(face.box[0], face.box[2]);
                const yMin = Math.min(face.box[1], face.box[3]);
                const yMax = Math.max(face.box[1], face.box[3]);

                const width = Math.max(12 * scale, xMax - xMin);
                const height = Math.max(12 * scale, yMax - yMin);

                // If mirrored, raw frame x appears at (vw - x) on screen.
                // Left screen coordinate is (vw - xMax), width is unchanged.
                const boxX = isMirrored ? vw - xMax : xMin;
                const boxY = yMin;
                const boxW = width;
                const boxH = height;

                const isRecognized = face.status !== 'UNKNOWN';
                const strokeColor = isRecognized ? '#22c55e' : '#f59e0b';
                const fillColor = isRecognized
                  ? 'rgba(34, 197, 94, 0.12)'
                  : 'rgba(245, 158, 11, 0.12)';
                const laserGradientId = isRecognized ? 'url(#scan-laser-emerald)' : 'url(#scan-laser-amber)';
                const glowFilterId = isRecognized ? 'url(#box-glow-emerald)' : 'url(#box-glow-amber)';

                // Reticle corner bracket dimensions
                const reticleLen = Math.min(22 * scale, boxW / 3.2, boxH / 3.2);

                // Extract human-readable student name
                const rawName = face.student_name?.trim();
                const isUnknownName = !rawName || rawName.toUpperCase() === 'UNKNOWN STUDENT' || rawName.toUpperCase() === 'UNKNOWN';
                const displayName = !isUnknownName ? rawName : (isRecognized ? 'Verified Student' : 'Unknown Face');

                // Status banner details
                let statusText = 'SCANNING...';
                if (face.status === 'NEW_PRESENT') {
                  statusText = '✓ PRESENT';
                } else if (face.status === 'ALREADY_MARKED') {
                  statusText = '✓ MARKED';
                } else if (face.status === 'UNKNOWN') {
                  statusText = 'UNRECOGNIZED';
                }

                const confidenceText = face.similarity_score > 0
                  ? `${(face.similarity_score * 100).toFixed(0)}%`
                  : '';
                const regNumText = face.registration_number ? ` • ${face.registration_number}` : '';

                // Label typography & dimensions
                const nameFontSize = Math.round(13.5 * scale);
                const subFontSize = Math.round(10 * scale);
                const labelPaddingX = Math.round(12 * scale);
                const labelHeight = Math.round(42 * scale);

                // Estimate content width to fit name and sub-badge neatly
                const estNameW = displayName.length * (8.5 * scale);
                const estSubW = (statusText.length + confidenceText.length + regNumText.length) * (6.5 * scale);
                const minLabelW = Math.max(estNameW, estSubW) + 36 * scale;
                const labelWidth = Math.min(vw - 16 * scale, Math.max(boxW * 0.9, minLabelW + labelPaddingX * 2));

                // Center the label over the face box, clamped inside video viewport
                let labelX = boxX + (boxW - labelWidth) / 2;
                labelX = Math.max(8 * scale, Math.min(vw - labelWidth - 8 * scale, labelX));

                // Position above box if space permits; otherwise attach inside top edge
                const placeAbove = boxY >= labelHeight + 10 * scale;
                const labelY = placeAbove ? boxY - labelHeight - 5 * scale : boxY + 6 * scale;

                return (
                  <g key={index} className="transition-all duration-150">
                    {/* Main Bounding Box Rectangle */}
                    <rect
                      x={boxX}
                      y={boxY}
                      width={boxW}
                      height={boxH}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={2.5 * scale}
                      rx={8 * scale}
                      filter={glowFilterId}
                    />

                    {/* Biometric Scanning Laser Animation */}
                    <line
                      x1={boxX + 3 * scale}
                      x2={boxX + boxW - 3 * scale}
                      y1={boxY + 6 * scale}
                      y2={boxY + 6 * scale}
                      stroke={laserGradientId}
                      strokeWidth={2.5 * scale}
                    >
                      <animate
                        attributeName="y1"
                        values={`${boxY + 6 * scale};${boxY + boxH - 6 * scale};${boxY + 6 * scale}`}
                        dur="2.4s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="y2"
                        values={`${boxY + 6 * scale};${boxY + boxH - 6 * scale};${boxY + 6 * scale}`}
                        dur="2.4s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.3;0.95;0.3"
                        dur="2.4s"
                        repeatCount="indefinite"
                      />
                    </line>

                    {/* Corner Reticles */}
                    {/* Top-Left */}
                    <path
                      d={`M ${boxX} ${boxY + reticleLen} L ${boxX} ${boxY} L ${boxX + reticleLen} ${boxY}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={4 * scale}
                      strokeLinecap="round"
                    />
                    {/* Top-Right */}
                    <path
                      d={`M ${boxX + boxW - reticleLen} ${boxY} L ${boxX + boxW} ${boxY} L ${boxX + boxW} ${boxY + reticleLen}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={4 * scale}
                      strokeLinecap="round"
                    />
                    {/* Bottom-Left */}
                    <path
                      d={`M ${boxX} ${boxY + boxH - reticleLen} L ${boxX} ${boxY + boxH} L ${boxX + reticleLen} ${boxY + boxH}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={4 * scale}
                      strokeLinecap="round"
                    />
                    {/* Bottom-Right */}
                    <path
                      d={`M ${boxX + boxW - reticleLen} ${boxY + boxH} L ${boxX + boxW} ${boxY + boxH} L ${boxX + boxW} ${boxY + boxH - reticleLen}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={4 * scale}
                      strokeLinecap="round"
                    />

                    {/* Connecting Notch when Label is Positioned Above Box */}
                    {placeAbove && (
                      <line
                        x1={boxX + boxW / 2}
                        y1={labelY + labelHeight}
                        x2={boxX + boxW / 2}
                        y2={boxY}
                        stroke={strokeColor}
                        strokeWidth={1.5 * scale}
                        strokeDasharray={`${3 * scale},${2 * scale}`}
                        opacity="0.8"
                      />
                    )}

                    {/* Name Tag on the Face Rectangle */}
                    {/* Background Pill */}
                    <rect
                      x={labelX}
                      y={labelY}
                      width={labelWidth}
                      height={labelHeight}
                      rx={6 * scale}
                      fill="#090d16"
                      fillOpacity="0.94"
                      stroke={strokeColor}
                      strokeWidth={1.5 * scale}
                      filter={glowFilterId}
                    />

                    {/* Pulsing Status Dot */}
                    <circle
                      cx={labelX + 16 * scale}
                      cy={labelY + 16 * scale}
                      r={4.5 * scale}
                      fill={strokeColor}
                    >
                      <animate
                        attributeName="opacity"
                        values="1;0.4;1"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    </circle>

                    {/* Person's Name */}
                    <text
                      x={labelX + 27 * scale}
                      y={labelY + 20 * scale}
                      fill="#ffffff"
                      fontSize={nameFontSize}
                      fontWeight="700"
                      fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                      letterSpacing="0.02em"
                    >
                      {displayName}
                    </text>

                    {/* Status & Confidence Sub-Label */}
                    <text
                      x={labelX + 27 * scale}
                      y={labelY + 34 * scale}
                      fill={isRecognized ? '#34d399' : '#fbbf24'}
                      fontSize={subFontSize}
                      fontWeight="600"
                      fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                      letterSpacing="0.03em"
                    >
                      {statusText}
                      {confidenceText && (
                        <tspan fill="#94a3b8" fontWeight="400">
                          {' '}| {confidenceText}
                        </tspan>
                      )}
                      {regNumText && (
                        <tspan fill="#cbd5e1" fontWeight="400">
                          {regNumText}
                        </tspan>
                      )}
                    </text>
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
          {activeFaces.length > 0 && (
            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2 pointer-events-none">
              {activeFaces.map((face, i) => (
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
