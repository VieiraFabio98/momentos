import { onBeforeUnmount, onMounted, ref } from 'vue'

// navigator.onLine só garante que existe interface de rede; serve para o caso
// comum (modo avião, wi-fi caiu) e é o suficiente para avisar antes do envio
export function useOnline() {
  const online = ref(navigator.onLine)

  function update() {
    online.value = navigator.onLine
  }

  onMounted(() => {
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('online', update)
    window.removeEventListener('offline', update)
  })

  return { online }
}
