/** Visual touch indicator; animated by tap() in lib/tl.ts. Purely decorative. */
export function Tap() {
  return (
    <span className="tap" aria-hidden="true">
      <i className="tap__ring" />
      <i className="tap__dot" />
    </span>
  );
}
