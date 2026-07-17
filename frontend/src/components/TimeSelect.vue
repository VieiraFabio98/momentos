<script setup lang="ts">
defineProps<{ id?: string; required?: boolean; disabled?: boolean }>()

const model = defineModel<string>({ required: true })

const times = Array.from({ length: 48 }, (_, index) => {
  const hours = String(Math.floor(index / 2)).padStart(2, '0')
  const minutes = index % 2 ? '30' : '00'
  return `${hours}:${minutes}`
})
</script>

<template>
  <div class="relative">
    <select
      :id="id"
      v-model="model"
      :required="required"
      :disabled="disabled"
      class="w-full appearance-none rounded-lg border border-stone-200 bg-white px-4 py-3 pr-10 text-sm outline-none transition focus:border-champagne-400 focus:ring-2 focus:ring-champagne-300/30 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:opacity-60"
      :class="model ? 'text-stone-800' : 'text-stone-300'"
    >
      <option value="" disabled>--:--</option>
      <option v-for="time in times" :key="time" :value="time" class="text-stone-800">
        {{ time }}
      </option>
    </select>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-stone-400"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  </div>
</template>
