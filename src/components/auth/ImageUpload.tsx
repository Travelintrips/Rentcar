import React, { useState } from "react";
import { Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface ImageUploadProps {
  onImageCapture: (imageData: string) => void;
  label: string;
  value?: string;
  bucketName: string;
  folderPath?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageCapture,
  label,
  value,
  bucketName,
  folderPath = "",
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = canvas.toDataURL("image/jpeg");
        onImageCapture(imageData);
        stopCamera();
      }
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Convert file to base64 for preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onImageCapture(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col space-y-2">
        <div className="text-sm font-medium">{label}</div>
        {value ? (
          <div className="relative">
            <img
              src={value}
              alt={label}
              className="w-full h-40 object-cover rounded-md"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute top-2 right-2 bg-white/80"
              onClick={() => onImageCapture("")}
            >
              Remove
            </Button>
          </div>
        ) : isCapturing ? (
          <div className="space-y-2">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-40 object-cover rounded-md bg-muted"
            />
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={stopCamera}
              >
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={captureImage}>
                Capture
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={startCamera}
              disabled={isUploading}
            >
              <Camera className="mr-2 h-4 w-4" />
              Camera
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={triggerFileInput}
              disabled={isUploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default ImageUpload;
