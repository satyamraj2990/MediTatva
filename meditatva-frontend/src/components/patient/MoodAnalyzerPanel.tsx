import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Mic, MicOff, VideoOff, Volume2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type FaceApiModule = typeof import("face-api.js");

interface MoodPrediction {
  emotion: string;
  confidence: number;
}

interface MoodAnalysis {
  modality: string;
  dominantEmotion: string;
  confidence: number;
  topEmotions: MoodPrediction[];
  summary: string;
  recommendations: string[];
}

interface MoodAnalyzerResponse {
  success: boolean;
  error?: string;
  analysis?: MoodAnalysis;
  retryAfterSeconds?: number;
}

interface RealtimePoint {
  time: string;
  emotion: string;
  category: string;
  confidence: number;
}

interface MoodAnalyzerPanelProps {
  open: boolean;
  onClose: () => void;
}

export const MoodAnalyzerPanel = ({ open, onClose }: MoodAnalyzerPanelProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const realtimeIntervalRef = useRef<number | null>(null);
  const transientRealtimeFailureRef = useRef(0);
  const inFlightFaceRequestRef = useRef(false);
  const nextAllowedFaceRequestAtRef = useRef(0);
  const faceApiRef = useRef<FaceApiModule | null>(null);
  const [localFaceModelLoading, setLocalFaceModelLoading] = useState(false);
  const [localFaceModelReady, setLocalFaceModelReady] = useState(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [analyzingFace, setAnalyzingFace] = useState(false);
  const [analyzingVoice, setAnalyzingVoice] = useState(false);
  const [faceResult, setFaceResult] = useState<MoodAnalysis | null>(null);
  const [voiceResult, setVoiceResult] = useState<MoodAnalysis | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [realtimeActive, setRealtimeActive] = useState(false);
  const [realtimePoints, setRealtimePoints] = useState<RealtimePoint[]>([]);
  const [cameraError, setCameraError] = useState<string>("");
  const [videoReady, setVideoReady] = useState(false);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<string>("");
  const [liveAnalysisError, setLiveAnalysisError] = useState<string>("");

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) return error.message;
    return "Request failed.";
  };

  const FACE_API_MODEL_URI = "https://justadudewhohacks.github.io/face-api.js/models";

  const expressionLabelMap: Record<string, string> = {
    neutral: "Neutral",
    happy: "Happy",
    sad: "Sad",
    angry: "Angry",
    fearful: "Fearful",
    disgusted: "Disgusted",
    surprised: "Surprised",
  };

  const deriveCompositeFaceMood = (expressions: Record<string, number>) => {
    const happy = Number(expressions.happy || 0);
    const sad = Number(expressions.sad || 0);
    const angry = Number(expressions.angry || 0);
    const fearful = Number(expressions.fearful || 0);
    const surprised = Number(expressions.surprised || 0);
    const neutral = Number(expressions.neutral || 0);
    const disgusted = Number(expressions.disgusted || 0);

    if (happy + surprised >= 0.58) {
      return { label: "Excited", confidence: Math.min(1, happy + surprised) };
    }

    if (fearful + sad >= 0.55) {
      return { label: "Anxious", confidence: Math.min(1, fearful + sad) };
    }

    if (angry + disgusted >= 0.5) {
      return { label: "Frustrated", confidence: Math.min(1, angry + disgusted) };
    }

    if (sad + neutral >= 0.62) {
      return { label: "Low Mood", confidence: Math.min(1, sad + neutral) };
    }

    if (neutral >= 0.6 && happy < 0.2 && sad < 0.2) {
      return { label: "Calm", confidence: neutral };
    }

    const dominant = Object.entries(expressions)
      .map(([label, value]) => ({ label: expressionLabelMap[label] || label, value: Number(value || 0) }))
      .sort((a, b) => b.value - a.value)[0];

    return {
      label: dominant?.label || "Neutral",
      confidence: Number(dominant?.value || 0),
    };
  };

  const loadLocalFaceModel = async () => {
    if (localFaceModelReady) {
      return true;
    }

    if (localFaceModelLoading) {
      return false;
    }

    try {
      setLocalFaceModelLoading(true);
      const faceapi = await import("face-api.js");
      faceApiRef.current = faceapi;

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(FACE_API_MODEL_URI),
        faceapi.nets.faceExpressionNet.loadFromUri(FACE_API_MODEL_URI),
      ]);

      setLocalFaceModelReady(true);
      return true;
    } catch (error) {
      console.error("Failed to load local face emotion model:", error);
      setLocalFaceModelReady(false);
      return false;
    } finally {
      setLocalFaceModelLoading(false);
    }
  };

  const toFaceAnalysisFromExpressions = (expressions: Record<string, number>): MoodAnalysis => {
    const composite = deriveCompositeFaceMood(expressions);
    const sorted = Object.entries(expressions)
      .map(([label, value]) => ({
        emotion: expressionLabelMap[label] || toCategory(label),
        confidence: Number(value || 0),
      }))
      .filter((item) => Number.isFinite(item.confidence))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 7);

    if (!sorted.length) {
      return {
        modality: "facial",
        dominantEmotion: "Unknown",
        confidence: 0,
        topEmotions: [],
        summary: "No clear facial emotion signal detected.",
        recommendations: ["Ensure your face is visible and lighting is steady, then try again."],
      };
    }

    return {
      modality: "facial",
      dominantEmotion: composite.label,
      confidence: Number(composite.confidence.toFixed(4)),
      topEmotions: sorted,
      summary: `Real-time local AI indicates ${composite.label} with blended facial-expression signals.`,
      recommendations: [
        "Keep your face centered for stable live tracking.",
        "Use consistent front lighting to improve confidence.",
        "Combine with voice analysis for richer mood insights.",
      ],
    };
  };

  const analyzeFaceLocally = async (video: HTMLVideoElement): Promise<MoodAnalysis | null> => {
    const isReady = await loadLocalFaceModel();
    if (!isReady || !faceApiRef.current) {
      return null;
    }

    const faceapi = faceApiRef.current;
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
      .withFaceExpressions();

    if (!detection?.expressions) {
      return {
        modality: "facial",
        dominantEmotion: "Face Not Detected",
        confidence: 0,
        topEmotions: [],
        summary: "Face not detected in frame. Position your face in the center and try again.",
        recommendations: [
          "Move closer to the camera and keep your face in frame.",
          "Avoid strong backlight behind you.",
          "Hold still for 1-2 seconds before capture.",
        ],
      };
    }

    return toFaceAnalysisFromExpressions(detection.expressions as unknown as Record<string, number>);
  };

  useEffect(() => {
    if (!open) {
      if (realtimeIntervalRef.current) {
        window.clearInterval(realtimeIntervalRef.current);
        realtimeIntervalRef.current = null;
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setCameraActive(false);
      setVideoReady(false);
      setAudioUrl("");
      setAudioBlob(null);
      setRecording(false);
      setRealtimeActive(false);
      setCameraError("");
      setLastAnalyzedAt("");
      setLiveAnalysisError("");
    }
  }, [open, audioUrl]);

  const stopCamera = () => {
    stopRealtimeFaceAnalysis();
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraError("");
    setCameraActive(false);
    setVideoReady(false);
    setLiveAnalysisError("");
  };

  const toCategory = (emotionLabel: string) => {
    const label = emotionLabel.toLowerCase();

    if (label.includes("calm")) return "Calm";
    if (label.includes("excited")) return "Excited";
    if (label.includes("anxious")) return "Anxious";
    if (label.includes("frustrated")) return "Frustrated";
    if (label.includes("low mood")) return "Low Mood";
    if (label.includes("happy") || label.includes("joy")) return "Happy";
    if (label.includes("sad") || label.includes("depress")) return "Sad";
    if (label.includes("angry") || label.includes("anger")) return "Angry";
    if (label.includes("fear") || label.includes("anx") || label.includes("stress") || label.includes("tense")) return "Stressed";
    if (label.includes("neutral")) return "Neutral";
    if (label.includes("surprise")) return "Surprised";
    return "Other";
  };

  const stopRealtimeFaceAnalysis = () => {
    if (realtimeIntervalRef.current) {
      window.clearInterval(realtimeIntervalRef.current);
      realtimeIntervalRef.current = null;
    }
    setRealtimeActive(false);
    setLiveAnalysisError("");
  };

  const stopRecordingTracks = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
  };

  const startCamera = async () => {
    try {
      setCameraError("");
      setVideoReady(false);

      const isLocalhost =
        window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      if (!window.isSecureContext && !isLocalhost) {
        throw new Error("Camera requires HTTPS (or localhost). Open the app on https:// or localhost.");
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not available in this browser.");
      }

      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      let stream: MediaStream;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        // Fallback for devices/browsers that reject advanced constraints.
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      cameraStreamRef.current = stream;
      setCameraActive(true);

      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          setCameraActive(false);
          setVideoReady(false);
          setCameraError("Camera stream ended. Please start camera again.");
        };
      });

      if (videoRef.current) {
        const videoEl = videoRef.current;
        videoEl.muted = true;
        videoEl.playsInline = true;
        videoEl.autoplay = true;

        const markReady = () => {
          if (!videoReady) {
            setVideoReady(true);
          }
        };

        videoEl.onloadedmetadata = markReady;
        videoEl.oncanplay = markReady;
        videoEl.onplaying = markReady;
        videoEl.srcObject = stream;

        await videoEl.play().catch(() => undefined);

        // Some browsers need a second play attempt on next frame.
        requestAnimationFrame(() => {
          void videoEl.play().catch(() => undefined);
        });

        // Fallback readiness check to avoid indefinite "starting" state.
        window.setTimeout(() => {
          const hasFrame = (videoEl.videoWidth || 0) > 0 && (videoEl.videoHeight || 0) > 0;
          const ready = videoEl.readyState >= 2 || hasFrame;
          if (ready) {
            setVideoReady(true);
          } else {
            setCameraError("Camera stream started but preview is blocked. Check browser site permissions and ensure no other app is using camera.");
          }
        }, 2000);
      }

    } catch (error: unknown) {
      let message = "Camera permission denied or unavailable.";

      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError") {
          message = "Camera permission denied. Please allow camera access in browser settings.";
        } else if (error.name === "NotFoundError") {
          message = "No camera device found on this system.";
        } else if (error.name === "NotReadableError") {
          message = "Camera is in use by another app. Close other camera apps and retry.";
        } else if (error.name === "OverconstrainedError") {
          message = "Requested camera settings are not supported by your device.";
        }
      } else if (error instanceof Error && error.message) {
        message = error.message;
      }

      setCameraError(message);
      setCameraActive(false);
      setVideoReady(false);
      toast.error(message);
    }
  };

  const captureAndAnalyzeFace = async (silent = false) => {
    if (inFlightFaceRequestRef.current) {
      return;
    }

    if (silent && Date.now() < nextAllowedFaceRequestAtRef.current) {
      return;
    }

    if (!videoRef.current || !canvasRef.current) {
      if (!silent) toast.error("Camera is not ready yet.");
      return;
    }

    inFlightFaceRequestRef.current = true;
    if (!silent) setAnalyzingFace(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      const width = video.videoWidth || 0;
      const height = video.videoHeight || 0;
      if (width === 0 || height === 0) {
        throw new Error("Camera frame not available yet. Please wait a moment.");
      }

      // Downscale frames before upload to reduce payload size and network instability.
      const maxDimension = 384;
      const scale = Math.min(1, maxDimension / Math.max(width, height));
      const targetWidth = Math.max(1, Math.round(width * scale));
      const targetHeight = Math.max(1, Math.round(height * scale));

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Could not access canvas context.");
      }

      context.drawImage(video, 0, 0, targetWidth, targetHeight);
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.78);

      const localAnalysis = await analyzeFaceLocally(video);
      if (localAnalysis) {
        setFaceResult(localAnalysis);
        transientRealtimeFailureRef.current = 0;
        nextAllowedFaceRequestAtRef.current = 0;
        setLastAnalyzedAt(new Date().toLocaleTimeString());
        setLiveAnalysisError("");

        const point: RealtimePoint = {
          time: new Date().toLocaleTimeString(),
          emotion: localAnalysis.dominantEmotion,
          category: toCategory(localAnalysis.dominantEmotion),
          confidence: localAnalysis.confidence,
        };

        setRealtimePoints((prev) => [point, ...prev].slice(0, 12));
        if (!silent) toast.success("Face mood analysis completed (local AI).");
        return;
      }

      const response = await fetch("/api/mood-analyzer/face", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl }),
      });

      const result = (await response.json()) as MoodAnalyzerResponse;

      if (!response.ok || !result.success || !result.analysis) {
        const err = new Error(result.error || "Face analysis failed.") as Error & {
          status?: number;
          retryAfterSeconds?: number;
        };
        err.status = response.status;
        err.retryAfterSeconds = Number(result.retryAfterSeconds || (response.status === 429 ? 30 : 0));
        throw err;
      }

      setFaceResult(result.analysis);
      transientRealtimeFailureRef.current = 0;
      nextAllowedFaceRequestAtRef.current = 0;
      setLastAnalyzedAt(new Date().toLocaleTimeString());
      setLiveAnalysisError("");
      const point: RealtimePoint = {
        time: new Date().toLocaleTimeString(),
        emotion: result.analysis.dominantEmotion,
        category: toCategory(result.analysis.dominantEmotion),
        confidence: result.analysis.confidence,
      };

      setRealtimePoints((prev) => [point, ...prev].slice(0, 12));

      if (!silent) toast.success("Face mood analysis completed.");
    } catch (error: unknown) {
      const message = getErrorMessage(error) || "Face analysis failed.";
      const statusCode = Number((error as { status?: number })?.status || 0);
      const retryAfterSeconds = Number((error as { retryAfterSeconds?: number })?.retryAfterSeconds || 0);
      const isTransientRealtimeIssue = /terminated|network|timeout|fetch failed|socket hang up|econnreset|please retry/i.test(message);

      if (!silent && statusCode === 429) {
        const estimated: MoodAnalysis = {
          modality: "facial",
          dominantEmotion: "Neutral (Estimated)",
          confidence: 0.35,
          topEmotions: [
            { emotion: "Neutral", confidence: 0.35 },
            { emotion: "Calm", confidence: 0.3 },
            { emotion: "Focused", confidence: 0.25 },
          ],
          summary: "Live provider is rate-limited right now, so this is a temporary estimated mood snapshot.",
          recommendations: [
            "Wait 30-60 seconds, then retry for model-based analysis.",
            "Keep face centered with steady lighting for best results.",
            "Use voice analysis in parallel for additional signal.",
          ],
        };

        setFaceResult(estimated);
        setLastAnalyzedAt(new Date().toLocaleTimeString());
        setLiveAnalysisError("Hugging Face is busy (429). Showing temporary estimated mood; auto-retry should recover shortly.");
        toast.message("Provider busy. Showing temporary estimate.");
        return;
      }

      if (silent && statusCode === 429) {
        const cooldown = retryAfterSeconds > 0 ? retryAfterSeconds : 30;
        nextAllowedFaceRequestAtRef.current = Date.now() + cooldown * 1000;
        setLiveAnalysisError(`Rate limited by Hugging Face. Auto-retrying in ${cooldown}s...`);
        return;
      }

      if (silent && isTransientRealtimeIssue) {
        transientRealtimeFailureRef.current += 1;
        // Suppress occasional transient errors; surface only after repeated failures.
        if (transientRealtimeFailureRef.current >= 3) {
          setLiveAnalysisError("Temporary network interruption. Auto-retrying live analysis...");
        }
      } else {
        setLiveAnalysisError(message);
      }

      if (!silent) {
        toast.error(message);
      }
    } finally {
      inFlightFaceRequestRef.current = false;
      if (!silent) setAnalyzingFace(false);
    }
  };

  const startRealtimeFaceAnalysis = () => {
    if (!cameraActive || realtimeActive) return;

    setRealtimeActive(true);
    setLastAnalyzedAt("");
    setLiveAnalysisError("");

    void captureAndAnalyzeFace(true);
    realtimeIntervalRef.current = window.setInterval(() => {
      void captureAndAnalyzeFace(true);
    }, 12000);

    toast.success("Real-time face analysis started (updates every 12 seconds).");
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });

        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }

        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stopRecordingTracks();
      };

      mediaRecorder.start();
      setRecording(true);
      toast.success("Recording started.");
    } catch (error) {
      toast.error("Microphone permission denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  const buildVoiceFallbackFromAudio = async (blob: Blob): Promise<MoodAnalysis> => {
    const audioContext = new AudioContext();
    try {
      const buffer = await blob.arrayBuffer();
      const decoded = await audioContext.decodeAudioData(buffer.slice(0));
      const channel = decoded.getChannelData(0);

      if (!channel.length) {
        throw new Error("Empty audio frame");
      }

      let absSum = 0;
      let signChanges = 0;
      let prevSign = Math.sign(channel[0]);

      for (let i = 0; i < channel.length; i += 1) {
        const sample = channel[i];
        absSum += Math.abs(sample);
        const sign = Math.sign(sample);
        if (sign !== 0 && prevSign !== 0 && sign !== prevSign) {
          signChanges += 1;
        }
        if (sign !== 0) {
          prevSign = sign;
        }
      }

      const avgAmplitude = absSum / channel.length;
      const zeroCrossRate = signChanges / channel.length;
      const duration = decoded.duration;

      const energies = {
        Calm: Math.max(0, 0.38 - Math.abs(avgAmplitude - 0.055) * 4),
        Excited: Math.max(0, (avgAmplitude - 0.075) * 4 + (zeroCrossRate - 0.08) * 7),
        Stressed: Math.max(0, (avgAmplitude - 0.09) * 4 + (0.1 - zeroCrossRate) * 3),
        Sad: Math.max(0, (0.06 - avgAmplitude) * 5 + (0.08 - zeroCrossRate) * 4),
        Neutral: 0.25,
      };

      const total = Object.values(energies).reduce((sum, value) => sum + value, 0) || 1;
      const ranked = Object.entries(energies)
        .map(([emotion, value]) => ({ emotion, confidence: value / total }))
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5);

      const dominant = ranked[0] || { emotion: "Neutral", confidence: 0.3 };

      return {
        modality: "voice",
        dominantEmotion: `${dominant.emotion} (Estimated)`,
        confidence: Number(dominant.confidence.toFixed(4)),
        topEmotions: ranked.map((item) => ({
          emotion: item.emotion,
          confidence: Number(item.confidence.toFixed(4)),
        })),
        summary: `Local voice signal analysis estimated ${dominant.emotion} tone from amplitude and cadence over ${duration.toFixed(1)}s audio.`,
        recommendations: [
          "Record in a quiet room for more stable voice features.",
          "Speak naturally for 6-10 seconds with consistent volume.",
          "Use this as supportive estimate and compare with face analysis.",
        ],
      };
    } finally {
      await audioContext.close();
    }
  };

  const analyzeVoice = async () => {
    if (!audioBlob) {
      toast.error("Record your voice first.");
      return;
    }

    setAnalyzingVoice(true);
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      let binary = "";
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
      const audioBase64 = btoa(binary);

      const response = await fetch("/api/mood-analyzer/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64,
          mimeType: audioBlob.type || "audio/webm",
        }),
      });

      const result = (await response.json()) as MoodAnalyzerResponse;

      if (!response.ok || !result.success || !result.analysis) {
        throw new Error(result.error || "Voice analysis failed.");
      }

      setVoiceResult(result.analysis);
      toast.success("Voice mood analysis completed.");
    } catch (error: unknown) {
      try {
        const fallback = await buildVoiceFallbackFromAudio(audioBlob);
        setVoiceResult(fallback);
        toast.message("Voice cloud model unavailable. Showing local estimated analysis.");
      } catch {
        toast.error(getErrorMessage(error) || "Voice analysis failed.");
      }
    } finally {
      setAnalyzingVoice(false);
    }
  };

  const renderResult = (title: string, result: MoodAnalysis | null) => {
    if (!result) return null;

    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white/80 dark:bg-slate-900/40 space-y-2">
        <h4 className="font-semibold text-slate-900 dark:text-white">{title}</h4>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-cyan-600 text-white">{result.dominantEmotion}</Badge>
          <span className="text-sm text-slate-600 dark:text-slate-300">
            Confidence: {(result.confidence * 100).toFixed(1)}%
          </span>
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300">{result.summary}</p>
        <div className="flex flex-wrap gap-2">
          {result.topEmotions.map((emotion) => (
            <Badge key={`${title}-${emotion.emotion}`} variant="outline">
              {emotion.emotion}: {(emotion.confidence * 100).toFixed(0)}%
            </Badge>
          ))}
        </div>
        <ul className="list-disc pl-5 text-sm text-slate-700 dark:text-slate-300 space-y-1">
          {result.recommendations.map((item) => (
            <li key={`${title}-${item}`}>{item}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(value) => (!value ? onClose() : null)}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Mood Analyzer (Face + Voice)</DialogTitle>
          <DialogDescription>
            Capture your facial expression and voice sample to generate an instant mood report.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Camera className="h-5 w-5" /> Facial Expression Analysis
            </h3>

            <div className="relative rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
              />

              {!cameraActive ? (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
                  Camera preview will appear here
                </div>
              ) : null}
            </div>

            {cameraActive && !videoReady ? (
              <div className="text-xs text-amber-700 dark:text-amber-300">Starting camera feed...</div>
            ) : null}

            {cameraActive && videoReady ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs p-2 dark:border-emerald-700/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                {realtimeActive ? "Live analysis running" : "Live analysis idle"}
                {lastAnalyzedAt ? ` • Last update: ${lastAnalyzedAt}` : " • Waiting for first result..."}
              </div>
            ) : null}

            {liveAnalysisError ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 text-amber-700 text-xs p-2 dark:border-amber-700/40 dark:bg-amber-950/30 dark:text-amber-300">
                Live analysis issue: {liveAnalysisError}
              </div>
            ) : null}

            {cameraError ? (
              <div className="rounded-md border border-red-200 bg-red-50 text-red-700 text-xs p-2 dark:border-red-700/40 dark:bg-red-950/30 dark:text-red-300">
                {cameraError}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {!cameraActive ? (
                <Button onClick={startCamera}>Start Camera</Button>
              ) : (
                <Button variant="outline" onClick={stopCamera}>
                  <VideoOff className="h-4 w-4 mr-2" /> Stop Camera
                </Button>
              )}

              {!cameraActive ? (
                <Button variant="secondary" onClick={startCamera}>
                  Retry Camera
                </Button>
              ) : null}

              <Button onClick={() => void captureAndAnalyzeFace()} disabled={!cameraActive || !videoReady || analyzingFace}>
                {analyzingFace ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Capture + Analyze
              </Button>

              {!realtimeActive ? (
                <Button variant="secondary" onClick={startRealtimeFaceAnalysis} disabled={!cameraActive || !videoReady}>
                  Start Real-time
                </Button>
              ) : (
                <Button variant="destructive" onClick={stopRealtimeFaceAnalysis}>
                  Stop Real-time
                </Button>
              )}
            </div>

            {faceResult ? (
              <div className="rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-700/40 p-3 text-sm">
                <div className="font-semibold text-cyan-800 dark:text-cyan-200">Current Face Mood</div>
                <div className="text-slate-700 dark:text-slate-300 mt-1">
                  {toCategory(faceResult.dominantEmotion)} ({faceResult.dominantEmotion}) - {(faceResult.confidence * 100).toFixed(1)}%
                </div>
                <div className="mt-2 space-y-1">
                  {faceResult.topEmotions.map((emotion) => (
                    <div key={`live-${emotion.emotion}`} className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                      <span>{emotion.emotion}</span>
                      <span>{(emotion.confidence * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {realtimePoints.length > 0 ? (
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-2">
                <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">Real-time Confidence Timeline</div>
                <div className="max-h-36 overflow-auto space-y-1">
                  {realtimePoints.map((point) => (
                    <div key={`${point.time}-${point.emotion}-${point.confidence}`} className="text-xs text-slate-700 dark:text-slate-300 flex justify-between gap-3">
                      <span>{point.time}</span>
                      <span>{point.category}</span>
                      <span>{(point.confidence * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Volume2 className="h-5 w-5" /> Voice Emotion Analysis
            </h3>

            <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-4 text-sm text-slate-600 dark:text-slate-300">
              Record a 5-10 second natural voice sample, then run mood analysis.
            </div>

            <div className="flex flex-wrap gap-2">
              {!recording ? (
                <Button onClick={startRecording}>
                  <Mic className="h-4 w-4 mr-2" /> Start Recording
                </Button>
              ) : (
                <Button variant="destructive" onClick={stopRecording}>
                  <MicOff className="h-4 w-4 mr-2" /> Stop Recording
                </Button>
              )}

              <Button onClick={analyzeVoice} disabled={!audioBlob || analyzingVoice || recording}>
                {analyzingVoice ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Analyze Voice
              </Button>
            </div>

            {audioUrl ? (
              <audio controls className="w-full mt-2">
                <source src={audioUrl} />
              </audio>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          {renderResult("Face Report", faceResult)}
          {renderResult("Voice Report", voiceResult)}
        </div>
      </DialogContent>
    </Dialog>
  );
};
