import { useState, useRef } from "react";
import { useDiscardUpload, useRequestUploadUrl } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, ArrowUp, ArrowDown } from "lucide-react";
import { resolveImagePath } from "@/lib/catalog";

type UploadState = {
  file: File;
  progress: number;
  error?: string;
};

export function MultiImageUploader({
  value = [],
  onChange,
}: {
  value: string[];
  onChange: (paths: string[]) => void;
}) {
  const requestUrl = useRequestUploadUrl();
  const discardUpload = useDiscardUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<UploadState | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading({ file, progress: 0 });

    let objectPath: string | undefined;
    try {
      const upload = await requestUrl.mutateAsync({
        data: {
          name: file.name,
          size: file.size,
          contentType: file.type,
        },
      });
      objectPath = upload.objectPath;

      setUploading({ file, progress: 50 });

      const res = await fetch(upload.uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!res.ok) throw new Error("Upload failed");

      onChange([...value, objectPath]);
    } catch (err) {
      if (objectPath) {
        await discardUpload.mutateAsync({ data: { objectPath } }).catch(() => undefined);
      }
      setUploading({ file, progress: 0, error: String(err) });
      return; // leave error state visible
    }

    setUploading(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const remove = (index: number) => {
    const next = [...value];
    next.splice(index, 1);
    onChange(next);
  };

  const move = (index: number, dir: 1 | -1) => {
    if (index + dir < 0 || index + dir >= value.length) return;
    const next = [...value];
    const temp = next[index];
    next[index] = next[index + dir];
    next[index + dir] = temp;
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {value.map((path, index) => (
          <div
            key={path}
            className="relative group rounded-md overflow-hidden border aspect-square bg-muted"
          >
            <img
              src={resolveImagePath(path)}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7"
                  onClick={() => move(index, 1)}
                  disabled={index === value.length - 1}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="h-7 px-2 text-xs"
                onClick={() => remove(index)}
              >
                <X className="h-3 w-3 mr-1" /> Remove
              </Button>
            </div>
          </div>
        ))}

        {uploading && (
          <div className="rounded-md border aspect-square bg-muted flex flex-col items-center justify-center p-4 text-center">
            {uploading.error ? (
              <>
                <X className="h-8 w-8 text-destructive mb-2" />
                <span className="text-xs text-destructive">
                  {uploading.error}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setUploading(null)}
                  className="mt-2"
                >
                  Clear
                </Button>
              </>
            ) : (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                <span className="text-xs text-muted-foreground">
                  Uploading...
                </span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleFile}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={!!uploading && !uploading.error}
        >
          <Upload className="h-4 w-4 mr-2" />
          Add Image
        </Button>
      </div>
    </div>
  );
}

export function SingleImageUploader({
  value,
  onChange,
}: {
  value: string | null | undefined;
  onChange: (path: string | null) => void;
}) {
  const requestUrl = useRequestUploadUrl();
  const discardUpload = useDiscardUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<UploadState | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading({ file, progress: 0 });

    let objectPath: string | undefined;
    try {
      const upload = await requestUrl.mutateAsync({
        data: {
          name: file.name,
          size: file.size,
          contentType: file.type,
        },
      });
      objectPath = upload.objectPath;

      const res = await fetch(upload.uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!res.ok) throw new Error("Upload failed");

      onChange(objectPath);
    } catch (err) {
      if (objectPath) {
        await discardUpload.mutateAsync({ data: { objectPath } }).catch(() => undefined);
      }
      setUploading({ file, progress: 0, error: String(err) });
      return;
    }

    setUploading(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      {value && !uploading ? (
        <div className="relative group rounded-md overflow-hidden border aspect-[4/3] w-48 bg-muted">
          <img
            src={resolveImagePath(value)}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              Replace
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => onChange(null)}
            >
              Remove
            </Button>
          </div>
        </div>
      ) : uploading ? (
        <div className="rounded-md border aspect-[4/3] w-48 bg-muted flex flex-col items-center justify-center p-4 text-center">
          {uploading.error ? (
            <>
              <X className="h-8 w-8 text-destructive mb-2" />
              <span className="text-xs text-destructive">
                {uploading.error}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setUploading(null)}
                className="mt-2"
              >
                Clear
              </Button>
            </>
          ) : (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
              <span className="text-xs text-muted-foreground">
                Uploading...
              </span>
            </>
          )}
        </div>
      ) : (
        <div
          className="rounded-md border border-dashed aspect-[4/3] w-48 bg-muted/50 flex flex-col items-center justify-center p-4 hover:bg-muted/80 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <span className="text-sm font-medium">Upload Image</span>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFile}
      />
    </div>
  );
}
