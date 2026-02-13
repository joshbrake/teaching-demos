# Progressive Rendering: Why Basis Functions Matter

Compares two ways of partially revealing the same image data — pixel-by-pixel (raster scan) vs. frequency-by-frequency (DCT basis) — to demonstrate why JPEG compression works so well.

## What You See

- **Two canvases** showing the same image at the same percentage of data, but in different bases
- **Pixel basis (left):** reveals pixels top-to-bottom, left-to-right — a growing strip
- **DCT basis (right):** reveals low-frequency coefficients first — a blurry full image that sharpens
- **PSNR plot** comparing reconstruction quality over the full 0–100% range
- **8×8 DCT basis grid** showing which frequency components are active

## Key Concepts

- The **Discrete Cosine Transform (DCT)** converts spatial pixel data to frequency coefficients
- Natural images concentrate energy in **low frequencies** (smooth gradients, large shapes)
- DCT captures the important structure first; pixel scan has no such advantage
- JPEG discards high-frequency coefficients because they contribute little visible information
- The **basis you choose** determines quality at any given compression level

## Things to Try

1. Set data to **10%** and compare the two views. The DCT version shows a recognisable (blurry) image; the pixel version shows only a narrow strip.
2. Switch to **Checkerboard** — a high-frequency pattern. At 10%, does DCT still win by as much?
3. Watch the **PSNR plot** as data increases. The DCT curve is consistently higher (better) for natural images.
4. Look at the **basis grid**: notice how few cells need to light up before the image is recognisable.

## Extension Ideas

- Implement **quantisation** — scale DCT coefficients by a quality factor before zeroing small ones
- Add a **colour mode** using YCbCr channels (the actual JPEG colour space)
- Let students **paint a custom image** and see how it compresses
- Add a **frequency spectrum view** showing coefficient magnitudes
