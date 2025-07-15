'use client'

export default function myImageLoader({ src, width, quality }: { src: string, width: string, quality: string }) {
  const searchParams = new URLSearchParams()

  searchParams.set('src', src)
  searchParams.set('w', width || '')
  searchParams.set('q', quality || '')
  searchParams.append('transformers', 'remove-background')
  searchParams.append('transformers', 'grayscale')
  searchParams.append('transformers', 'sharpen')
  searchParams.append('transformers', 'blur')
  
  return `/image?${searchParams.toString()}`
}