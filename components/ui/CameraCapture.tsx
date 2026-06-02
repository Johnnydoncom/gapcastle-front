"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Camera, X, RefreshCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isUnmounted = useRef<boolean>(false);
  const [error, setError] = useState<string>("");
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      setError("");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      
      // If component unmounted while waiting for permissions, stop immediately
      if (isUnmounted.current) {
        mediaStream.getTracks().forEach(track => track.stop());
        return;
      }
      
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      if (!isUnmounted.current) {
        setError(err.message || "Failed to access camera");
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    isUnmounted.current = false;
    startCamera();
    return () => {
      isUnmounted.current = true;
      stopCamera();
    };
  }, []);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Flip horizontally to match the mirrored video view
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        stopCamera();
      }
    }, "image/jpeg", 0.9);
  };

  const handleRetake = () => {
    setCapturedBlob(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedBlob) {
      const file = new File([capturedBlob], "selfie.jpg", { type: "image/jpeg" });
      onCapture(file);
    }
  };

  return (
    <div className="relative w-full max-w-sm mx-auto overflow-hidden rounded-2xl border bg-black shadow-xl">
      <div className="flex items-center justify-between p-3 bg-black/80 text-white z-10 relative">
        <h3 className="text-sm font-semibold">Face Verification</h3>
        <button onClick={onCancel} className="p-1 hover:bg-white/20 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="relative aspect-[3/4] bg-muted flex items-center justify-center">
        {error ? (
          <div className="p-6 text-center">
            <p className="text-destructive mb-2 font-semibold">Camera Error</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={startCamera}>
              Retry
            </Button>
          </div>
        ) : previewUrl ? (
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
        )}

        {/* Overlay guide for face */}
        {!previewUrl && !error && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-48 h-64 border-2 border-white/50 rounded-[40%] shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
          </div>
        )}
        
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="p-4 bg-black flex justify-center gap-4">
        {previewUrl ? (
          <>
            <Button variant="secondary" className="flex-1 rounded-xl h-12" onClick={handleRetake}>
              <RefreshCcw className="w-4 h-4 mr-2" />
              Retake
            </Button>
            <Button variant="default" className="flex-1 rounded-xl h-12 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleConfirm}>
              <Check className="w-4 h-4 mr-2" />
              Use Photo
            </Button>
          </>
        ) : !error ? (
          <Button 
            variant="default" 
            size="icon"
            className="w-16 h-16 rounded-full border-4 border-white/20 hover:border-white/40 bg-white hover:bg-white text-black transition-all"
            onClick={handleCapture}
          >
            <Camera className="w-6 h-6" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
