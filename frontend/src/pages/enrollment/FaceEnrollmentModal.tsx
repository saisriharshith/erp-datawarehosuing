import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertTriangle, Camera, Sparkles, Trash2, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { CameraViewfinder } from '../../components/CameraViewfinder';
import { StudentEnrollmentInfoResponse } from '../../types';

interface FaceEnrollmentModalProps {
  studentId?: string;
  studentName?: string;
  student?: any;
  isOpen?: boolean;
  onClose: () => void;
  onEnrollmentComplete?: () => void;
  onSuccess?: () => void;
}

export const FaceEnrollmentModal: React.FC<FaceEnrollmentModalProps> = ({
  studentId: propStudentId,
  studentName: propStudentName,
  student,
  isOpen = true,
  onClose,
  onEnrollmentComplete,
  onSuccess,
}) => {
  const studentId = propStudentId || student?.id || student?.student_id || '';
  const displayId = student?.student_id || student?.registration_number || studentId;
  const studentName =
    propStudentName ||
    (student
      ? `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.full_name
      : 'Student');

  const [currentSample, setCurrentSample] = useState<number>(1);
  const [enrolledCount, setEnrolledCount] = useState<number>(0);
  const [targetSamples, setTargetSamples] = useState<number>(5);
  const [feedback, setFeedback] = useState<string>('Align your face inside the camera guide.');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [enrolledPhotos, setEnrolledPhotos] = useState<string[]>([]);
  const [latestFrame, setLatestFrame] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleNotifyComplete = () => {
    if (onEnrollmentComplete) onEnrollmentComplete();
    if (onSuccess) onSuccess();
  };

  useEffect(() => {
    if (isOpen && studentId) {
      fetchCurrentInfo();
    }
  }, [isOpen, studentId]);

  const fetchCurrentInfo = async () => {
    try {
      const info = await api.getEnrollmentInfo(studentId);
      setEnrolledCount(info.enrolled_samples_count);
      setTargetSamples(info.target_required || 5);
      setCurrentSample(info.enrolled_samples_count + 1);
      setEnrolledPhotos(info.photo_urls || []);
    } catch (err) {
      console.error('Error fetching enrollment info:', err);
    }
  };

  if (!isOpen) return null;

  const handleCapture = async () => {
    if (!latestFrame || isProcessing) return;

    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const res = await api.enrollSample(studentId, latestFrame, currentSample);
      setFeedback(res.feedback_message);

      if (res.success) {
        setEnrolledCount(res.total_enrolled);
        setCurrentSample(res.total_enrolled + 1);
        if (res.imagekit_url) {
          setEnrolledPhotos((prev) => [...prev, res.imagekit_url!]);
        }
        if (res.total_enrolled >= targetSamples) {
          handleNotifyComplete();
        }
      } else {
        setErrorMsg(res.feedback_message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Capture failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all enrolled face samples for this student?')) return;
    try {
      await api.deleteEnrollment(studentId);
      setEnrolledCount(0);
      setCurrentSample(1);
      setEnrolledPhotos([]);
      setFeedback('Biometric samples reset. Ready to begin new enrollment.');
      handleNotifyComplete();
    } catch (err: any) {
      setErrorMsg(err.message || 'Reset failed.');
    }
  };

  const isComplete = enrolledCount >= targetSamples;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Camera className="w-5 h-5 text-brand-600" />
              <span>Biometric Face Enrollment</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Student: <span className="font-semibold text-slate-700 dark:text-slate-200">{studentName}</span> ({displayId})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Enrollment Progress
              </span>
              <span className="font-mono text-brand-600 dark:text-brand-400 font-bold">
                {enrolledCount} / {targetSamples} Samples Enrolled
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-600 to-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(100, (enrolledCount / targetSamples) * 100)}%` }}
              />
            </div>
          </div>

          {/* Feedback Banner */}
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center space-x-3 ${
              errorMsg
                ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-300'
                : isComplete
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-900 dark:text-emerald-300'
                : 'bg-brand-50 border-brand-200 text-brand-800 dark:bg-brand-950/50 dark:border-brand-900 dark:text-brand-300'
            }`}
          >
            {errorMsg ? (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            ) : isComplete ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            ) : (
              <Sparkles className="w-4 h-4 shrink-0 text-brand-500" />
            )}
            <span className="font-medium">
              {errorMsg || (isComplete ? 'Enrollment Complete! Target biometric samples secured.' : feedback)}
            </span>
          </div>

          {/* Camera Viewfinder */}
          {!isComplete ? (
            <div className="relative">
              <CameraViewfinder
                className="aspect-video w-full"
                onFrameCapture={(b64) => setLatestFrame(b64)}
                captureIntervalMs={600}
                overlayText={`Sample ${currentSample} of ${targetSamples}`}
              />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <button
                  type="button"
                  onClick={handleCapture}
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-full bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg flex items-center space-x-2 transition-all transform active:scale-95 disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  <span>{isProcessing ? 'Processing ArcFace Vector...' : `Capture Sample ${currentSample}`}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center space-y-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-800">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Face Enrollment Certified
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                {studentName} has successfully registered {enrolledCount} high-quality ArcFace embeddings with ImageKit cloud storage.
              </p>
            </div>
          )}

          {/* Enrolled Gallery Thumbnails */}
          {enrolledPhotos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Enrolled Biometric Samples ({enrolledPhotos.length})
              </p>
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {enrolledPhotos.map((url, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 shrink-0">
                    <img src={url} alt={`Sample ${i + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 right-0 bg-black/60 text-white text-[9px] px-1 font-mono">
                      #{i + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            disabled={enrolledCount === 0}
            className="inline-flex items-center text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 disabled:opacity-30 space-x-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Biometrics</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
          >
            {isComplete ? 'Done' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
