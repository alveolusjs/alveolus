<script setup lang="ts">
import { useData } from 'vitepress';
import { computed } from 'vue';

import { groupAnchor } from '../../themes';
import { matchesRuleFilters } from '../rule-filters';
import { data as rules } from '../rules.data';

const { frontmatter } = useData();

const shown = computed(() =>
	rules.filter((rule) => rule.theme === frontmatter.value.themeRules && matchesRuleFilters(rule)),
);
</script>

<template>
	<a
		v-if="frontmatter.themeRules && shown.length > 0"
		:href="`#${groupAnchor(shown[0].group)}`"
		class="theme-rules-link"
	>
		{{ shown.length === 1 ? 'Voir la règle' : `Voir les ${shown.length} règles` }} ↓
	</a>
</template>
