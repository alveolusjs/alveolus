<script setup lang="ts">
import type { Style } from '../../styles';
import { setStyleFilter, styleFilter } from '../style-filter';

const options: { value: Style | ''; label: string; title: string }[] = [
	{ value: '', label: 'Tous', title: 'Afficher toutes les règles' },
	{ value: 'tactical', label: 'Tactique', title: 'Les règles d’un contexte tactique' },
	{ value: 'transaction-script', label: 'Script', title: 'Les règles d’un contexte transaction script' },
];
</script>

<template>
	<fieldset class="style-filter">
		<legend class="style-filter__legend">Filtrer les règles par style d’implémentation</legend>
		<button
			v-for="option in options"
			:key="option.value"
			type="button"
			:title="option.title"
			:aria-pressed="styleFilter === option.value"
			:class="{ active: styleFilter === option.value }"
			@click="setStyleFilter(option.value)"
		>
			{{ option.label }}
		</button>
	</fieldset>
</template>
