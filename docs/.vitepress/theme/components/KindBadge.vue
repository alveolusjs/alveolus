<script setup lang="ts">
import { computed } from 'vue';

import { isKind, kinds } from '../../kinds';
import { badgeLabel } from '../badges';

const props = defineProps<{ value: unknown; severity?: string }>();

const kind = computed(() => (isKind(props.value) ? props.value : undefined));
</script>

<template>
	<span
		v-if="kind"
		:class="['kind-badge', `kind-badge--${kind}`, { 'kind-badge--question': severity === 'question' }]"
		:title="kinds[kind].meaning"
		>{{ kinds[kind].label }}<template v-if="severity"> · {{ badgeLabel(severity) }}</template></span
	>
</template>
