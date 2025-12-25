/**
 * Image compression utility using browser Canvas API
 * Resizes images and compresses them for efficient upload
 */

interface CompressionOptions {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    format?: 'image/jpeg' | 'image/webp' | 'image/png'
}

const DEFAULT_OPTIONS: CompressionOptions = {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.8,
    format: 'image/jpeg'
}

/**
 * Compress and resize an image file
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise<File> - The compressed file
 */
export async function compressImage(
    file: File,
    options: CompressionOptions = {}
): Promise<File> {
    const opts = { ...DEFAULT_OPTIONS, ...options }

    // If file is already small enough, skip compression
    const MAX_SIZE_NO_COMPRESS = 200 * 1024 // 200KB
    if (file.size <= MAX_SIZE_NO_COMPRESS) {
        return file
    }

    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()

        img.onload = () => {
            try {
                // Calculate new dimensions while maintaining aspect ratio
                let { width, height } = img
                const maxWidth = opts.maxWidth!
                const maxHeight = opts.maxHeight!

                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height)
                    width = Math.round(width * ratio)
                    height = Math.round(height * ratio)
                }

                canvas.width = width
                canvas.height = height

                // Draw image with high quality
                if (ctx) {
                    ctx.imageSmoothingEnabled = true
                    ctx.imageSmoothingQuality = 'high'
                    ctx.drawImage(img, 0, 0, width, height)
                }

                // Convert to blob
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to compress image'))
                            return
                        }

                        // Create new file with original name but new extension
                        const ext = opts.format === 'image/jpeg' ? 'jpg' :
                            opts.format === 'image/webp' ? 'webp' : 'png'
                        const baseName = file.name.replace(/\.[^.]+$/, '')
                        const newFileName = `${baseName}.${ext}`

                        const compressedFile = new File([blob], newFileName, {
                            type: opts.format,
                            lastModified: Date.now()
                        })

                        resolve(compressedFile)
                    },
                    opts.format,
                    opts.quality
                )
            } catch (error) {
                reject(error)
            }
        }

        img.onerror = () => {
            reject(new Error('Failed to load image for compression'))
        }

        // Load image from file
        const reader = new FileReader()
        reader.onload = (e) => {
            img.src = e.target?.result as string
        }
        reader.onerror = () => {
            reject(new Error('Failed to read image file'))
        }
        reader.readAsDataURL(file)
    })
}

/**
 * Compress multiple images in parallel
 * @param files - Array of image files
 * @param options - Compression options
 * @returns Promise<File[]> - Array of compressed files
 */
export async function compressImages(
    files: File[],
    options: CompressionOptions = {}
): Promise<File[]> {
    return Promise.all(files.map(file => compressImage(file, options)))
}

/**
 * Get size reduction info for logging/display
 */
export function formatSizeReduction(originalSize: number, compressedSize: number): string {
    const reduction = ((originalSize - compressedSize) / originalSize * 100).toFixed(1)
    const originalMB = (originalSize / 1024 / 1024).toFixed(2)
    const compressedMB = (compressedSize / 1024 / 1024).toFixed(2)
    return `${originalMB}MB → ${compressedMB}MB (${reduction}% smaller)`
}
