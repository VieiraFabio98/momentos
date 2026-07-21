<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <footer
    class="fixed inset-x-0 bottom-0 z-10 border-t border-ivory-200 bg-white/60 backdrop-blur"
  >
    <div
      class="mx-auto flex max-w-6xl flex-col items-center gap-1 px-6 py-4 text-center sm:flex-row sm:justify-between sm:gap-4 sm:text-left"
    >
      <p class="text-xs font-light text-stone-400">
        Momentos © {{ new Date().getFullYear() }} — Todos os direitos reservados
      </p>
      <nav class="flex items-center gap-4 text-xs font-light text-stone-400">
        <RouterLink to="/privacidade" class="underline underline-offset-2 hover:text-stone-600">
          Privacidade e LGPD
        </RouterLink>
      </nav>
    </div>
  </footer>
</template>
