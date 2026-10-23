<script setup lang="ts">
import { useData } from 'vitepress';

const { frontmatter } = useData();
</script>

<template>
  <span v-if="frontmatter.partEyebrow" class="part-eyebrow">
    <span class="part-eyebrow__icon" v-html="frontmatter.partEyebrow.icon" />
    {{ frontmatter.partEyebrow.label }}
  </span>
</template>
