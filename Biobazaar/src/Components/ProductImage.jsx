/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import "./product-image.css";

export default function ProductImage({
  src,
  alt = "",
  className = "",
  frameClassName = "",
  loading = "lazy",
  fit = "cover",
}) {
  const [status, setStatus] = useState(src ? "loading" : "empty");

  useEffect(() => {
    setStatus(src ? "loading" : "empty");
  }, [src]);

  const frameClasses = [
    "product-image-frame",
    `product-image-frame--${status}`,
    frameClassName,
  ].filter(Boolean).join(" ");

  return (
    <span className={frameClasses} aria-busy={status === "loading"}>
      {src && status !== "error" && (
        <img
          src={src}
          alt={alt}
          className={className || undefined}
          loading={loading}
          decoding="async"
          style={{ objectFit: fit }}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
        />
      )}
      {status === "loading" && <span className="product-image-skeleton" aria-hidden="true" />}
      {(status === "empty" || status === "error") && (
        <span
          className="product-image-unavailable"
          role={alt ? "img" : undefined}
          aria-label={alt ? `${alt}, image unavailable` : undefined}
          aria-hidden={alt ? undefined : "true"}
        >
          Image unavailable
        </span>
      )}
    </span>
  );
}
