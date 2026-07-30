import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useEventDraftStore = defineStore('event-draft', () => {
  const title = ref('')
  const date = ref('')
  const startTime = ref('')

  function reset() {
    title.value = ''
    date.value = ''
    startTime.value = ''
  }

  return { title, date, startTime, reset }
})
