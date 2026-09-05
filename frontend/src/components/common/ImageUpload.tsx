import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadService } from "@/services/reportsService";
import { imgUrl } from "@/lib/imgUrl";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Image upload field: click to pick a file → uploads via /upload →
 * calls onChange with the resulting URL. Shows a preview when set.
 */
export function ImageUpload({
  value,
  onChange,
  label = "Upload image",
  className,
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadService.upload(file);
      onChange(result.url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative h-16 w-16 overflow-hidden rounded-md border border-border">
            <img src={imgUrl(value) ?? ""} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
              aria-label="Remove image"
            >
              <X className="size-3" />
            </button>
          </div>
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed border-border bg-muted/50 text-muted-foreground">
            <ImagePlus className="size-5" aria-hidden />
          </span>
        )}
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={(e) => {
              void handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <ImagePlus className="size-3.5" />
            )}
            {uploading ? "Uploading…" : label}
          </Button>
        </div>
      </div>
    </div>
  );
}
