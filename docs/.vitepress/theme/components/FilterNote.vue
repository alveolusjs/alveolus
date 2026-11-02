<script setup lang="ts">
import { clearRuleFilters, filterScope, filtering } from '../rule-filters';

defineProps<{ hidden: number }>();
</script>

<template>
	<p v-if="filtering && hidden > 0" class="filter-note">
		{{ hidden }} {{ hidden === 1 ? 'règle est masquée' : 'règles sont masquées' }} : le filtre montre seulement
		{{ filterScope }}.
		<button type="button" @click="clearRuleFilters()">Afficher toutes les règles</button>
	</p>
</template>
