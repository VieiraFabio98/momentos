import { onMounted, ref, type Ref } from 'vue'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

interface IGoogleAccounts {
  accounts: {
    id: {
      initialize(config: { client_id: string; callback: (r: { credential: string }) => void }): void
      renderButton(el: HTMLElement, options: Record<string, unknown>): void
    }
  }
}

declare global {
  interface Window {
    google?: IGoogleAccounts
  }
}

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google) return resolve()
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Falha ao carregar Google Identity Services'))
    document.head.appendChild(script)
  })
}

export function useGoogleSignin(
  buttonContainer: Ref<HTMLElement | null>,
  onCredential: (idToken: string) => void,
) {
  const available = ref(false)

  onMounted(async () => {
    if (!CLIENT_ID) return

    try {
      await loadScript()
      if (!window.google || !buttonContainer.value) return

      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => onCredential(response.credential),
      })
      window.google.accounts.id.renderButton(buttonContainer.value, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
        locale: 'pt-BR',
      })
      available.value = true
    } catch {
      // sem Google, tela segue só com e-mail/senha
    }
  })

  return { available }
}
