import { useState, useRef } from "react";
import {
  useDiscardUpload,
  useRequestUploadUrl,
} from "@workspace/api-client-react";
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
        await discardUpload
          .mutateAsync({ data: { objectPath } })
          .catch(() => undefined);
      }
      setUploading({ file, progress: 0, error: String(err) });
      return;
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
    <div>
      <div className="admin-image-grid">
        {value.map((path, index) => (
          <div key={path} className="admin-image-preview">
            <img src={resolveImagePath(path)} alt="" />
            <div className="admin-image-actions">
              <div className="flex gap-2">
                <button
                  type="button"
                  className="admin-icon-btn"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Move left"
                >
                  <ArrowUp size={14} className="-rotate-90" />
                </button>
                <button
                  type="button"
                  className="admin-icon-btn"
                  onClick={() => move(index, 1)}
                  disabled={index === value.length - 1}
                  aria-label="Move right"
                >
                  <ArrowDown size={14} className="-rotate-90" />
                </button>
              </div>
              <button
                type="button"
                className="admin-text-btn"
                onClick={() => remove(index)}
              >
                <X size={12} /> Remove
              </button>
            </div>
          </div>
        ))}

        {uploading && (
          <div className="admin-image-uploading">
            {uploading.error ? (
              <>
                <X size={20} className="admin-image-error mb-2" />
                <span className="admin-image-error">{uploading.error}</span>
                <button
                  type="button"
                  className="admin-text-btn mt-2 !text-[#777369] hover:!text-ink"
                  onClick={() => setUploading(null)}
                >
                  Clear
                </button>
              </>
            ) : (
              <>
                <Loader2
                  size={20}
                  className="animate-spin text-[#777369] mb-2"
                />
                <span>Uploading...</span>
              </>
            )}
          </div>
        )}

        <div
          className="admin-image-placeholder"
          onClick={() => {
            if (!uploading || uploading.error) {
              fileInputRef.current?.click();
            }
          }}
          style={{
            opacity: uploading && !uploading.error ? 0.5 : 1,
            cursor: uploading && !uploading.error ? "not-allowed" : "pointer",
          }}
        >
          <Upload size={20} className="mb-2" />
          <span>Add Image</span>
        </div>
      </div>

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
        await discardUpload
          .mutateAsync({ data: { objectPath } })
          .catch(() => undefined);
      }
      setUploading({ file, progress: 0, error: String(err) });
      return;
    }

    setUploading(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div>
      {value && !uploading ? (
        <div className="admin-image-preview single">
          <img src={resolveImagePath(value)} alt="" />
          <div className="admin-image-actions">
            <button
              type="button"
              className="admin-text-btn mb-2"
              onClick={() => fileInputRef.current?.click()}
            >
              Replace
            </button>
            <button
              type="button"
              className="admin-text-btn"
              onClick={() => onChange(null)}
            >
              <X size={12} /> Remove
            </button>
          </div>
        </div>
      ) : uploading ? (
        <div className="admin-image-uploading single">
          {uploading.error ? (
            <>
              <X size={20} className="admin-image-error mb-2" />
              <span className="admin-image-error">{uploading.error}</span>
              <button
                type="button"
                className="admin-text-btn mt-2 !text-[#777369] hover:!text-ink"
                onClick={() => setUploading(null)}
              >
                Clear
              </button>
            </>
          ) : (
            <>
              <Loader2 size={20} className="animate-spin text-[#777369] mb-2" />
              <span>Uploading...</span>
            </>
          )}
        </div>
      ) : (
        <div
          className="admin-image-placeholder single"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={20} className="mb-2" />
          <span>Upload Image</span>
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
