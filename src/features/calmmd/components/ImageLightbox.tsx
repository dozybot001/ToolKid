import { useEffect, useRef } from "react";
import type { FocusedImage } from "../types";

type ImageLightboxProps = {
  image: FocusedImage | null;
  onClose: () => void;
};

export default function ImageLightbox({
  image,
  onClose,
}: ImageLightboxProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!image) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [image]);

  if (!image) {
    return null;
  }

  return (
    <div
      className="image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={image.caption ? `查看大图：${image.caption}` : "查看大图"}
      onClick={onClose}
    >
      <div
        className="image-lightbox__surface"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="button image-lightbox__close"
          onClick={onClose}
        >
          关闭
        </button>

        <div className="image-lightbox__viewport">
          <img
            className="image-lightbox__image"
            src={image.src}
            alt={image.alt}
          />
        </div>

        {image.caption ? (
          <p className="image-lightbox__caption">{image.caption}</p>
        ) : null}
      </div>
    </div>
  );
}
