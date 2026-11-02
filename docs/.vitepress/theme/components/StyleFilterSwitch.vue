<script setup lang="ts">
import { computed } from 'vue';

import type { Style } from '../../styles';
import { setStyleFilter, styleFilter } from '../style-filter';

const options: { value: Style | ''; label: string; hint: string }[] = [
	{ value: '', label: 'Tous', hint: 'Les règles des deux styles.' },
	{ value: 'tactical', label: 'Tactique', hint: 'Les règles d’un bounded context en modèle tactique.' },
	{
		value: 'transaction-script',
		label: 'Transaction script',
		hint: 'Les règles d’un bounded context en transaction scripts.',
	},
];

const hint = computed(() => options.find((option) => option.value === styleFilter.value)?.hint);
</script>

<template>
	<fieldset class="style-filter">
		<legend class="style-filter__legend">Style d’implémentation</legend>
		<div class="style-filter__options">
			<button
				v-for="option in options"
				:key="option.value"
				type="button"
				:aria-pressed="styleFilter === option.value"
				:class="{ active: styleFilter === option.value }"
				@click="setStyleFilter(option.value)"
			>
				{{ option.label }}
			</button>
		</div>
		<p class="style-filter__hint">{{ hint }}</p>
	</fieldset>
</template>
