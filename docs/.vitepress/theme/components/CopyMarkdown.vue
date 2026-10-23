<script setup lang="ts">
import { useData } from 'vitepress';
import { ref } from 'vue';

const { frontmatter } = useData();
const copied = ref(false);

async function copy(): Promise<void> {
  await navigator.clipboard.writeText(frontmatter.value.copyMarkdown ?? '');
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
}
</script>

<template>
  <div v-if="frontmatter.copyMarkdown" class="copy-markdown">
    <button type="button" class="copy-markdown__button" :aria-live="'polite'" @click="copy">
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
        <rect x="9" y="9" width="11" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="2" />
        <path d="M5 15V5a2 2 0 0 1 2-2h8" fill="none" stroke="currentColor" stroke-width="2" />
      </svg>
      {{ copied ? 'Copié' : 'Copier en Markdown' }}
    </button>
  </div>
</template>
