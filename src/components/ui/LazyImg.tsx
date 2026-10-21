"use client";

import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { useDirector } from "@/components/film/director";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "loading" | "decoding"> & {
  /** chapter index (0 = hero ... 7 = widgets/finale) at which the file starts downloading */
  from: number;
  /** poster fallbacks for 3D props are only fetched when WebGL is unavailable (or in reduced-motion stills) */
  poster?: boolean;
};

/**
 * All chapters are stacked on one stage, so native lazy loading would fetch everything at once.
 * This starts each image one chapter before it is needed (stills mode loads everything natively).
 */
export function LazyImg({ from, poster, src, srcSet, alt = "", ...rest }: Props) {
  const { active, isStatic, webgl } = useDirector();
  const wants = poster ? (!webgl || isStatic) && (isStatic || active >= from) : isStatic || active >= from;
  const [on, setOn] = useState(false);
  useEffect(() => { if (wants) setOn(true); }, [wants]);
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...rest} alt={alt} src={on ? src : undefined} srcSet={on ? srcSet : undefined} loading="lazy" decoding="async" />;
}
