<script setup lang="ts">
import { badgeClass, badgeLabel } from '../badges';

defineProps<{ kind: 'severity'; value: string }>();
</script>

<template>
	<span :class="badgeClass(kind, value)">{{ badgeLabel(value) }}</span>
</template>
