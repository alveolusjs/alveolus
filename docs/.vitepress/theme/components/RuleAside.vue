<script setup lang="ts">
import { useData } from 'vitepress';
import RuleMeta from './RuleMeta.vue';

const { frontmatter } = useData();
</script>

<template>
  <RuleMeta v-if="frontmatter.code" variant="aside" />
</template>
