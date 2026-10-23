<script setup lang="ts">
import { badgeClass, badgeLabel } from '../badges';

defineProps<{ kind: 'severity' | 'detection'; value: string }>();
</script>

<template>
  <span v-if="kind !== 'detection' || value === 'fitness'" :class="badgeClass(kind, value)">{{ badgeLabel(value) }}</span>
</template>
