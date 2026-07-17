<script setup lang="ts">
defineProps<{ label?: string }>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 py-12" role="status">
    <span
      class="h-10 w-10 animate-spin rounded-full border-[3px] border-champagne-200 border-t-champagne-500"
    />
    <p v-if="label" class="text-sm font-light text-stone-400">{{ label }}</p>
    <span class="sr-only">Carregando</span>
  </div>
</template>
