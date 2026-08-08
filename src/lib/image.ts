const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.82

/** Formats where re-encoding would lose something (animation, vectors). */
const SKIP_TYPES = ['image/gif', 'image/svg+xml']

/** Below this, resizing costs more than it saves. */
const ALREADY_SMALL_BYTES = 300_000

function toJpegName(name: string): string {
  return name.replace(/\.[^.]+$/, '') + '.jpg'
}

/**
 * Downscale and re-encode a camera photo before upload. Phone originals run
 * 3–5 MB, which is slow on mobile data and piles up in the storage bucket;
 * 1600px at quality 0.82 is indistinguishable at the sizes we display and
 * typically lands around 200–400 KB.
 *
 * Never throws — if anything goes wrong the original file is returned, since
 * failing to compress is not a reason to fail the upload.
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  if (SKIP_TYPES.includes(file.type)) return file
  if (file.size <= ALREADY_SMALL_BYTES) return file

  let bitmap: ImageBitmap | undefined
  try {
    // `from-image` applies the EXIF rotation, otherwise photos taken in
    // portrait come out sideways once drawn to a canvas.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })

    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file

    // JPEG has no alpha channel; without this, transparent areas turn black.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(bitmap, 0, 0, width, height)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
    )
    if (!blob || blob.size >= file.size) return file

    return new File([blob], toJpegName(file.name), {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })
  } catch {
    return file
  } finally {
    bitmap?.close()
  }
}
