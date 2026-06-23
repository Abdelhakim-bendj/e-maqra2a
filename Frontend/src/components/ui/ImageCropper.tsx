import { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (base64Str: string) => void;
  onCancel: () => void;
}

export const ImageCropper = ({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [crop, setCrop] = useState({ x: 0, y: 0, size: 200 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const MAX_WIDTH = 400;
      const MAX_HEIGHT = 400;
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        if (width > height) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        } else {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }
      
      setImgSize({ width, height });
      
      // Initial crop size (max possible square)
      const initialSize = Math.min(width, height) * 0.8;
      setCrop({
        size: initialSize,
        x: (width - initialSize) / 2,
        y: (height - initialSize) / 2
      });
    };
  }, [imageSrc]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX, y: clientY });
  };

  const handleMouseMove = (e: MouseEvent | TouchEvent) => {
    if (!dragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    
    const dx = clientX - dragStart.x;
    const dy = clientY - dragStart.y;
    
    setCrop(prev => {
      let newX = prev.x + dx;
      let newY = prev.y + dy;
      
      // Bounds check
      newX = Math.max(0, Math.min(newX, imgSize.width - prev.size));
      newY = Math.max(0, Math.min(newY, imgSize.height - prev.size));
      
      return { ...prev, x: newX, y: newY };
    });
    
    setDragStart({ x: clientX, y: clientY });
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [dragging, dragStart]);

  const handleConfirm = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    if (!ctx || !img) return;

    // We need to map crop coordinates back to original image resolution
    const scaleX = img.naturalWidth / imgSize.width;
    const scaleY = img.naturalHeight / imgSize.height;

    canvas.width = 400; // Final square size
    canvas.height = 400;

    ctx.drawImage(
      img,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.size * scaleX,
      crop.size * scaleY,
      0, 0, 400, 400
    );

    const base64Str = canvas.toDataURL('image/jpeg', 0.9);
    onCropComplete(base64Str);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="bg-card rounded-[2rem] p-6 max-w-lg w-full flex flex-col items-center">
        <h3 className="text-xl font-black mb-4">اقتصاص الصورة</h3>
        
        <div 
          className="relative bg-black select-none overflow-hidden rounded-xl border border-border"
          style={{ width: imgSize.width, height: imgSize.height }}
        >
          <img 
            ref={imageRef}
            src={imageSrc} 
            alt="crop source" 
            style={{ width: imgSize.width, height: imgSize.height }}
            draggable={false}
          />
          
          <div className="absolute inset-0 bg-black/50 pointer-events-none" />
          
          <div 
            className="absolute border-4 border-emerald-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] cursor-move touch-none"
            style={{
              left: crop.x,
              top: crop.y,
              width: crop.size,
              height: crop.size,
              borderRadius: '50%', // Circular mask for profile
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
          >
            <div className="w-full h-full rounded-full overflow-hidden">
               <img 
                src={imageSrc} 
                alt="cropped area"
                style={{
                  position: 'absolute',
                  left: -crop.x,
                  top: -crop.y,
                  width: imgSize.width,
                  height: imgSize.height,
                  maxWidth: 'none'
                }}
                draggable={false}
              />
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-4 text-center">اسحب المربع لتحديد الجزء المراد من الصورة</p>
        
        <div className="flex gap-3 w-full mt-6">
          <button 
            onClick={handleConfirm}
            className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition"
          >
            تأكيد الاقتصاص
          </button>
          <button 
            onClick={onCancel}
            className="flex-1 bg-muted text-muted-foreground py-3 rounded-xl font-bold hover:bg-slate-200 transition dark:hover:bg-slate-700"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
