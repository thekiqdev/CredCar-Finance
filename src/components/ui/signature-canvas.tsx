import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eraser, Pen } from "lucide-react";

interface SignatureCanvasProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (signatureDataUrl: string) => void;
  title?: string;
}

const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Desenhe sua assinatura",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Set canvas size - wider for horizontal signatures
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        // Set actual canvas size in memory (scaled for high DPI)
        canvas.width = 600 * dpr;
        canvas.height = 150 * dpr;

        // Scale the canvas back down using CSS
        canvas.style.width = "600px";
        canvas.style.height = "150px";

        // Scale the drawing context so everything draws at the correct size
        ctx.scale(dpr, dpr);

        // Set drawing styles
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Clear canvas with white background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 600, 150);

        setHasSignature(false);
      }
    }
  }, [isOpen]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x =
      ((e.clientX - rect.left) * scaleX) / (window.devicePixelRatio || 1);
    const y =
      ((e.clientY - rect.top) * scaleY) / (window.devicePixelRatio || 1);

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x =
      ((e.clientX - rect.left) * scaleX) / (window.devicePixelRatio || 1);
    const y =
      ((e.clientY - rect.top) * scaleY) / (window.devicePixelRatio || 1);

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
      setHasSignature(true);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 600, 150);
      setHasSignature(false);
    }
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    const dataUrl = canvas.toDataURL("image/png");
    onConfirm(dataUrl);
    onClose();
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x =
      ((touch.clientX - rect.left) * scaleX) / (window.devicePixelRatio || 1);
    const y =
      ((touch.clientY - rect.top) * scaleY) / (window.devicePixelRatio || 1);

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x =
      ((touch.clientX - rect.left) * scaleX) / (window.devicePixelRatio || 1);
    const y =
      ((touch.clientY - rect.top) * scaleY) / (window.devicePixelRatio || 1);

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
      setHasSignature(true);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-center">
            <Pen className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-center">
            Use o mouse ou toque na tela para desenhar sua assinatura no espaço
            abaixo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4 py-4">
          <div className="border-2 border-gray-300 rounded-lg p-4 bg-white shadow-sm">
            <canvas
              ref={canvasRef}
              className="border border-gray-200 cursor-crosshair touch-none rounded"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                width: "600px",
                height: "150px",
                display: "block",
                imageRendering: "pixelated",
              }}
            />
          </div>

          <div className="text-sm text-gray-500 text-center max-w-md">
            Desenhe sua assinatura no retângulo horizontal acima. O formato
            horizontal facilita assinaturas mais longas.
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={clearCanvas}
            className="flex items-center gap-2"
          >
            <Eraser className="h-4 w-4" />
            Limpar
          </Button>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={!hasSignature}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirmar Assinatura
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SignatureCanvas;
