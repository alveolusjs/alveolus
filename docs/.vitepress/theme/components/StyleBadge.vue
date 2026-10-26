<script setup lang="ts">
import { computed } from 'vue';

import { isStyleList, styleListLabel, styleOrder } from '../../styles';

const props = defineProps<{ value: unknown }>();

const label = computed(() => styleListLabel(isStyleList(props.value) ? props.value : []));

const both = computed(() => isStyleList(props.value) && props.value.length === styleOrder.length);
</script>

<template>
	<span :class="['style-badge', { 'style-badge--single': !both }]">{{ label }}</span>
</template>
