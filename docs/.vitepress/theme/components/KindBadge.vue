<script setup lang="ts">
import { computed } from 'vue';

import { isKind, kinds } from '../../kinds';

const props = defineProps<{ value: unknown }>();

const kind = computed(() => (isKind(props.value) ? props.value : undefined));
</script>

<template>
	<span v-if="kind" :class="['kind-badge', `kind-badge--${kind}`]" :title="kinds[kind].meaning">{{
		kinds[kind].label
	}}</span>
</template>
