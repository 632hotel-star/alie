import { useEffect, useLayoutEffect } from "react";

export const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

let glCache: boolean | null = null;
/** Capability detection (not user-agent sniffing). */
export function hasWebGL(): boolean {
  if (glCache !== null) return glCache;
  if (typeof document === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    glCache = Boolean(c.getContext("webgl2")); // three.js r163+ is WebGL2 only
  } catch {
    glCache = false;
  }
  return glCache;
}

/** Low-power / weak device hint used only to lower detail, never to drop a feature. */
export function isLowEnd(): boolean {
  if (typeof navigator === "undefined") return false;
  const n = navigator as Navigator & { deviceMemory?: number };
  return (n.hardwareConcurrency ?? 8) <= 4 || (n.deviceMemory ?? 8) <= 4;
}
