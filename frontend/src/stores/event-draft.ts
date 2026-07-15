import { defineStore } from 'pinia'
import { ref } from 'vue'

export type PlanId = 'degustacao' | 'momento' | 'memoria'

export const useEventDraftStore = defineStore('event-draft', () => {
  const title = ref('')
  const date = ref('')
  const location = ref('')
  const plan = ref<PlanId | null>(null)

  function reset() {
    title.value = ''
    date.value = ''
    location.value = ''
    plan.value = null
  }

  return { title, date, location, plan, reset }
})
