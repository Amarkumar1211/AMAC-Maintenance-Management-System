import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Upload, Trash2, Check, RefreshCw } from 'lucide-react';

export default function SignaturePad({ onSignatureChange, label = "Digital Signature" }) {
  const [mode, setMode] = useState('draw'); // 'draw' or 'upload'
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);

  useEffect(() => {
    if (mode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      // High-DPI scaling
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      ctx.scale(ratio, ratio);
      ctx.strokeStyle = '#07351b'; // AMAC Forest Green ink
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [mode]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    if (e.cancelable) e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onSignatureChange({
        type: 'DRAWN',
        base64: dataUrl,
        hasSignature: true,
      });
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
      onSignatureChange({
        type: 'DRAWN',
        base64: null,
        hasSignature: false,
      });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result);
        onSignatureChange({
          type: 'UPLOADED',
          base64: reader.result,
          hasSignature: true,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const clearUpload = () => {
    setUploadedImage(null);
    onSignatureChange({
      type: 'UPLOADED',
      base64: null,
      hasSignature: false,
    });
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-2xs text-slate-800">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <PenTool className="w-4 h-4 text-[#0e4d2a]" />
          {label} <span className="text-red-500">*</span>
        </label>
        <div className="inline-flex rounded-lg bg-slate-200/80 p-0.5 border border-slate-300">
          <button
            type="button"
            onClick={() => {
              setMode('draw');
              clearCanvas();
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${mode === 'draw' ? 'bg-[#0e4d2a] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            Draw on Screen
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('upload');
              clearUpload();
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${mode === 'upload' ? 'bg-[#0e4d2a] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Image
          </button>
        </div>
      </div>

      {mode === 'draw' ? (
        <div>
          <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden touch-none h-40 shadow-inner">
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-crosshair block"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!hasDrawn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-medium">
                Sign here with finger, stylus, or mouse pointer (Forest Green Ink)
              </div>
            )}
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <Check className={`w-3.5 h-3.5 ${hasDrawn ? 'text-emerald-600' : 'text-slate-400'}`} />
              {hasDrawn ? 'Signature recorded' : 'Awaiting signature'}
            </span>
            <button
              type="button"
              onClick={clearCanvas}
              disabled={!hasDrawn}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium"
            >
              <RefreshCw className="w-3 h-3" />
              Clear Pad
            </button>
          </div>
        </div>
      ) : (
        <div>
          {uploadedImage ? (
            <div className="relative border border-slate-200 rounded-xl p-2 bg-white flex items-center justify-center h-40">
              <img
                src={uploadedImage}
                alt="Signature Preview"
                className="max-h-full max-w-full object-contain"
              />
              <button
                type="button"
                onClick={clearUpload}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                title="Remove uploaded signature"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="border-2 border-dashed border-slate-300 hover:border-[#0e4d2a] rounded-xl bg-white flex flex-col items-center justify-center h-40 cursor-pointer transition-colors group">
              <Upload className="w-8 h-8 text-slate-400 group-hover:text-[#0e4d2a] mb-2 transition-colors" />
              <span className="text-xs text-slate-700 font-medium">Upload handwritten signature image</span>
              <span className="text-[10px] text-slate-400 mt-1">PNG, JPG, JPEG (Scan or Photo)</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}
