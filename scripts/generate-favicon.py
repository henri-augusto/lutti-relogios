"""Gera favicon e ícones do app a partir do logo oficial em public/image-nossa-historia.jpeg."""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "image-nossa-historia.jpeg"


def crop_logo_mark(img: Image.Image) -> Image.Image:
    """Recorte quadrado do logo completo (relógio + Lutti Relógios)."""
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = max(0, int(h * 0.02))
    return img.crop((left, top, left + side, top + side))


def on_white(im: Image.Image, size: int) -> Image.Image:
    im = im.resize((size, size), Image.Resampling.LANCZOS)
    bg = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    bg.paste(im, (0, 0), im)
    return bg


def main() -> None:
    img = Image.open(SRC).convert("RGBA")
    watch = crop_logo_mark(img)

    sizes = [16, 32, 48]
    icons = [on_white(watch, s) for s in sizes]

    ico_path = ROOT / "app" / "favicon.ico"
    icons[0].save(
        ico_path,
        format="ICO",
        sizes=[(s, s) for s in sizes],
        append_images=icons[1:],
    )

    on_white(watch, 32).save(ROOT / "app" / "icon.png", format="PNG")
    on_white(watch, 180).save(ROOT / "app" / "apple-icon.png", format="PNG")

    print("Generated:", ico_path, ROOT / "app" / "icon.png", ROOT / "app" / "apple-icon.png")


if __name__ == "__main__":
    main()
