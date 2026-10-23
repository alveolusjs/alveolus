<script setup lang="ts">
import { computed } from 'vue';
import { data as rules } from '../rules.data';
import { matchesStyleFilter } from '../style-filter';

const count = computed(() => rules.filter((rule) => matchesStyleFilter(rule.style)).length);

function openSearch(): void {
  document.querySelector<HTMLButtonElement>('.VPNavBarSearch button')?.click();
}
</script>

<template>
  <button type="button" class="home-search" @click="openSearch">
    <span class="home-search__icon vpi-search" aria-hidden="true" />
    <span class="home-search__text">Rechercher parmi {{ count }} règles, par code ou par mot…</span>
    <kbd class="home-search__keys">⌘ K</kbd>
  </button>
</template>
