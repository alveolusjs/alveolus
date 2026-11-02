<script setup lang="ts">
import { type Kind, kinds } from '../../kinds';
import { kindFilter, setKindFilter } from '../kind-filter';

const options: { value: Kind | ''; label: string; title: string }[] = [
	{ value: '', label: 'Toutes', title: 'Afficher toutes les règles' },
	{ value: 'safeguard', label: 'Garde-fous', title: kinds.safeguard.meaning },
	{ value: 'structure', label: 'Structure', title: kinds.structure.meaning },
	{ value: 'convention', label: 'Conventions', title: kinds.convention.meaning },
];
</script>

<template>
	<fieldset class="style-filter kind-filter">
		<legend class="style-filter__legend">Filtrer les règles par nature</legend>
		<button
			v-for="option in options"
			:key="option.value"
			type="button"
			:title="option.title"
			:aria-pressed="kindFilter === option.value"
			:class="{ active: kindFilter === option.value }"
			@click="setKindFilter(option.value)"
		>
			{{ option.label }}
		</button>
	</fieldset>
</template>
