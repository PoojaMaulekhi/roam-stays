"use client";

import Link from "next/link";
import { useState } from "react";
import type { Stay } from "@/lib/domain";
import { Icon } from "@/components/icon";

const rupees = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export function StayCard({
  stay,
  saved,
  onSave,
  dates,
}: {
  stay: Stay;
  saved: boolean;
  onSave: (stay: Stay) => void;
  dates?: string;
}) {
  const [imageIndex, setImageIndex] = useState(0);
  const [lens, setLens] = useState<{ x: number; y: number; xPercent: number; yPercent: number } | null>(null);
  const setOffset = (offset: number) => setImageIndex((current) => (current + offset + stay.images.length) % stay.images.length);

  return (
    <article className="stay-card">
      <div
        className="stay-card__media"
        onPointerMove={(event) => {
          if (event.pointerType === "touch") return;
          const rect = event.currentTarget.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          setLens({ x, y, xPercent: x / rect.width * 100, yPercent: y / rect.height * 100 });
        }}
        onPointerLeave={() => setLens(null)}
      >
        <Link href={`/stays/${stay.slug}`} className="stay-card__image-link" aria-label={`View ${stay.name}`}>
          <img
            src={stay.images[imageIndex]}
            alt={stay.name}
            className="stay-card__image"
            loading="eager"
            referrerPolicy="no-referrer"
          />
        </Link>
        <span className="stay-card__badge">{stay.rating >= 4.9 ? "Guest favourite" : stay.category}</span>
        <button
          className={`save-button${saved ? " is-saved" : ""}`}
          type="button"
          aria-label={saved ? `Remove ${stay.name} from saved stays` : `Save ${stay.name}`}
          aria-pressed={saved}
          onClick={() => onSave(stay)}
        >
          <Icon name="heart" size={21} />
        </button>
        {stay.images.length > 1 && <>
          <button className="card-arrow card-arrow--left" type="button" aria-label="Previous photo" onClick={() => setOffset(-1)}><Icon name="chevron-left" size={17} /></button>
          <button className="card-arrow card-arrow--right" type="button" aria-label="Next photo" onClick={() => setOffset(1)}><Icon name="chevron-right" size={17} /></button>
          <div className="card-dots" aria-hidden="true">{stay.images.map((_, index) => <span className={index === imageIndex ? "is-active" : ""} key={index} />)}</div>
        </>}
        {lens && (
          <span
            className="stay-card__lens"
            style={{
              left: lens.x,
              top: lens.y,
              backgroundImage: `url("${stay.images[imageIndex]}")`,
              backgroundPosition: `${lens.xPercent}% ${lens.yPercent}%`,
            }}
            aria-hidden="true"
          />
        )}
      </div>

      <Link href={`/stays/${stay.slug}`} className="stay-card__details">
        <div className="stay-card__title-row"><h2>{stay.location}</h2><span className="stay-card__rating"><Icon name="star" size={13} />{stay.rating.toFixed(2)} <small>({stay.reviewCount})</small></span></div>
        <p>{stay.distance}</p>
        <p>{dates || "Available throughout the year"}</p>
        <p className="stay-card__price"><strong>₹{rupees.format(stay.nightlyPrice)}</strong> night</p>
      </Link>
    </article>
  );
}