import { onMounted, ref } from 'vue'

const ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY as string | undefined

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80',
  'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1600&q=80',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1600&q=80',
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1600&q=80',
]

interface IUnsplashPhoto {
  urls: { regular: string }
  user: { name: string; links: { html: string } }
}

export function useUnsplashImage(query = 'bride smiling wedding') {
  const imageUrl = ref(FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)])
  const credit = ref<{ name: string; link: string } | null>(null)

  onMounted(async () => {
    if (!ACCESS_KEY) return

    try {
      const params = new URLSearchParams({
        query,
        orientation: 'portrait',
        content_filter: 'high',
      })
      const response = await fetch(`https://api.unsplash.com/photos/random?${params}`, {
        headers: { Authorization: `Client-ID ${ACCESS_KEY}` },
      })
      if (!response.ok) return

      const photo: IUnsplashPhoto = await response.json()
      imageUrl.value = photo.urls.regular
      credit.value = { name: photo.user.name, link: photo.user.links.html }
    } catch {
      // mantém fallback
    }
  })

  return { imageUrl, credit }
}
