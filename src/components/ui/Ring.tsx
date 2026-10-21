/** SVG progress ring. Stroke length is driven by GSAP via strokeDashoffset (pathLength normalised to 1). */
export function Ring({ size = 96, value = 0, className = "", children, stroke = 7 }: { size?: number; value?: number; className?: string; children?: React.ReactNode; stroke?: number }) {
  return (
    <div className={`dial ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="dial__bg" cx="50" cy="50" r="44" strokeWidth={stroke} />
        <circle className="dial__fg" cx="50" cy="50" r="44" strokeWidth={stroke} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - value} />
      </svg>
      {children ? <div className="dial__label">{children}</div> : null}
    </div>
  );
}
