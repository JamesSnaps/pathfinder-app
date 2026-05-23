"use client";

import { useRef } from "react";
import { Camera, X } from "lucide-react";

interface AvatarUploadProps {
  name: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}

function resizeToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const size = 128;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const scale = Math.max(size / img.width, size / img.height);
      const x = (size - img.width * scale) / 2;
      const y = (size - img.height * scale) / 2;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function AvatarUpload({ name, value, onChange }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeToDataUrl(file);
      onChange(dataUrl);
    } catch {
      // ignore failed reads
    }
    e.target.value = "";
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative h-16 w-16 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0 group hover:ring-2 hover:ring-primary/40 transition-all"
        aria-label="Upload photo"
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={name || "Avatar"} className="h-full w-full object-cover" />
        ) : (
          <span className="text-2xl font-bold text-primary">{name?.[0] ?? "?"}</span>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
          <Camera className="h-5 w-5 text-white" />
        </div>
      </button>

      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-sm text-primary hover:underline text-left"
        >
          {value ? "Change photo" : "Add photo"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-sm text-muted-foreground hover:text-destructive flex items-center gap-1 text-left"
          >
            <X className="h-3 w-3" />
            Remove
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
