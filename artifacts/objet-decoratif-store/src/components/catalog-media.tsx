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
  width,
  height,
  fallbackSrc,
  "aria-hidden": ariaHidden,
}: {
  src?: string;
  fallbackSrc?: string;
  alt?: string;
  className?: string;
  active?: boolean;
  controls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  loading?: "eager" | "lazy";
  style?: CSSProperties;
  fetchPriority?: "high" | "low" | "auto";
  width?: number;
  height?: number;
  "aria-hidden"?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
    setFallbackFailed(false);
  }, [src, fallbackSrc]);
  useEffect(() => {
    if (!active) video.current?.pause();
    else if (autoPlay) {
      // Browsers may block autoplay despite muted playback; keep their policy intact.
      void video.current?.play().catch(() => {});
    }
  }, [active, src, autoPlay]);
  if (!src) {
    if (fallbackSrc) {
      return (
        <img
          src={fallbackSrc}
          alt={alt}
          className={className}
          style={style}
          loading={loading}
          fetchPriority={fetchPriority}
          width={width}
          height={height}
          aria-hidden={ariaHidden}
        />
      );
    }
    return <span className={className} style={style} role="img" aria-label={alt} aria-hidden={ariaHidden} />;
  }
  if (!isVideoPath(src)) {
    if (failed && fallbackFailed) {
      return (
        <span
          className={className}
          style={style}
          role="img"
          aria-label={alt}
          aria-hidden={ariaHidden}
        />
      );
    }
    return (
      <img
        src={failed ? fallbackSrc : src}
        alt={alt}
        className={className}
        style={style}
        loading={loading}
        fetchPriority={fetchPriority}
        width={width}
        height={height}
        aria-hidden={ariaHidden}
        onError={
          fallbackSrc
            ? () => {
                if (failed) setFallbackFailed(true);
                else setFailed(true);
              }
            : undefined
        }
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
