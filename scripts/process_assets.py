#!/usr/bin/env python3
"""Optimise the supplied BetterMe artwork (already transparent) for the web.

Input : SRC_DIR (default: ./assets-src) containing 1.webp (logo), 2..5.webp (stages 2..5)
Output: public/brand, public/characters, src/app icons, src/config/asset-meta.json
Nothing is redrawn or recoloured: only cropped to the visible bounds and resized.
"""
import json, os, sys
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else "assets-src"
OUT_BRAND, OUT_CHAR = "public/brand", "public/characters"
os.makedirs(OUT_BRAND, exist_ok=True); os.makedirs(OUT_CHAR, exist_ok=True)
meta = {}

def crop_alpha(im, thr=6, pad=0.02):
    a = im.getchannel("A").point(lambda v: 255 if v > thr else 0)
    bb = a.getbbox()
    w, h = im.size
    px, py = int((bb[2]-bb[0])*pad), int((bb[3]-bb[1])*pad)
    box = (max(0, bb[0]-px), max(0, bb[1]-py), min(w, bb[2]+px), min(h, bb[3]+py))
    return im.crop(box)

def save_sizes(im, base, sizes, out_dir, quality=86, by="w"):
    """sizes are target widths (by='w') or heights (by='h'); never upscales."""
    entry = {}
    for s in sizes:
        cur = im.width if by == "w" else im.height
        if s >= cur:
            r, s = im, cur
        elif by == "w":
            r = im.resize((s, round(im.height * s / im.width)), Image.LANCZOS)
        else:
            r = im.resize((round(im.width * s / im.height), s), Image.LANCZOS)
        name = f"{base}-{s}.webp"
        r.save(os.path.join(out_dir, name), "WEBP", quality=quality, method=6, alpha_quality=92)
        entry[str(s)] = {"w": r.width, "h": r.height}
    return entry

def load(n):
    return Image.open(os.path.join(SRC, f"{n}.webp")).convert("RGBA")

# logo
logo = crop_alpha(load(1), pad=0.0)
meta["logo"] = save_sizes(logo, "logo", [96, 192, 512, 1024], OUT_BRAND)
# favicon / apple icon (square on black)
side = max(logo.size)
sq = Image.new("RGBA", (side, side), (0, 0, 0, 255))
sq.alpha_composite(logo, ((side-logo.width)//2, (side-logo.height)//2))
sq.convert("RGB").resize((512, 512), Image.LANCZOS).save("src/app/icon.png")
sq.convert("RGB").resize((180, 180), Image.LANCZOS).save("src/app/apple-icon.png")

# characters (file index 2..5 are stages 2..5; stage 1 is not supplied)
for n in range(2, 6):
    c = crop_alpha(load(n))
    meta[f"stage-{n}"] = save_sizes(c, f"stage-{n}", [640, 960, c.height], OUT_CHAR, by="h")

# Open Graph card: logo + legendary stage on true black
og = Image.new("RGBA", (1200, 630), (0, 0, 0, 255))
lg = logo.resize((380, round(logo.height*380/logo.width)), Image.LANCZOS)
og.alpha_composite(lg, (90, (630-lg.height)//2))
st = crop_alpha(load(5)); st = st.resize((round(st.width*560/st.height), 560), Image.LANCZOS)
og.alpha_composite(st, (1200-st.width-110, 35))
og.convert("RGB").save("public/og.png", optimize=True)

with open("src/config/asset-meta.json", "w") as f:
    json.dump(meta, f, indent=2)
print("ok", {k: list(v) for k, v in meta.items()})
