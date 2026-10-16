import { useEffect, useRef, useState, type CSSProperties } from "react";
import { isVideoPath } from "@/lib/media";

export function CatalogMedia({
  src,
  alt = "",
  className,
  active = true,
  controls = true,
  autoPlay = false,
  loop = false,
  loading = "lazy",
  style,
  fetchPriority,
  "aria-hidden": ariaHidden,
}: {
  src?: string;
  alt?: string;
  className?: string;
  active?: boolean;
  controls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  loading?: "eager" | "lazy";
  style?: CSSProperties;
  fetchPriority?: "high" | "low" | "auto";
  "aria-hidden"?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  useEffect(() => {
    if (!active) video.current?.pause();
    else if (autoPlay) {
      // Browsers may block autoplay despite muted playback; keep their policy intact.
      void video.current?.play().catch(() => {});
    }
  }, [active, src, autoPlay]);
  if (!src) {
    return <span className={className} style={style} role="img" aria-label={alt} aria-hidden={ariaHidden} />;
  }
  if (!isVideoPath(src)) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={style}
        loading={loading}
        fetchPriority={fetchPriority}
        aria-hidden={ariaHidden}
      />
    );
  }
  return (
    <>
      <video
        ref={video}
        src={src}
        className={className}
        style={style}
        controls={controls && active}
        autoPlay={autoPlay && active}
        loop={loop}
        muted
        playsInline
        preload={active ? "metadata" : "none"}
        aria-label={alt}
        aria-hidden={ariaHidden ?? !active}
        tabIndex={active && controls ? 0 : -1}
        onError={() => setFailed(true)}
      >
        Dein Browser unterstützt dieses Video nicht.
      </video>
      {failed && active && (controls || autoPlay) && (
        <p className="catalog-media-error" role="alert">
          Dieses Video kann in diesem Browser nicht abgespielt werden.{" "}
          <a href={src} download>
            Video herunterladen
          </a>
        </p>
      )}
    </>
  );
}
