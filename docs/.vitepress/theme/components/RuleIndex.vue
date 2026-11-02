<script setup lang="ts">
import { withBase } from 'vitepress';
import { computed, onMounted, ref, watch } from 'vue';

import { parts } from '../../parts';
import { scopes } from '../../scopes';
import { themes } from '../../themes';
import { badgeLabel, severities } from '../badges';
import { matchesRuleFilters } from '../rule-filters';
import { data as rules } from '../rules.data';
import FilterNote from './FilterNote.vue';
import KindBadge from './KindBadge.vue';

const search = ref('');
const part = ref('');
const theme = ref('');
const severity = ref('');
const scope = ref('');

const queryFields = { q: search, part, theme, severity, scope };

const partOf = new Map(themes.map((t) => [t.slug, t.part]));
const writtenThemes = computed(() =>
	themes.filter((t) => (!part.value || t.part === part.value) && rules.some((rule) => rule.theme === t.slug)),
);

watch(part, () => {
	if (part.value && theme.value && partOf.get(theme.value) !== part.value) {
		theme.value = '';
	}
});

onMounted(() => {
	const params = new URLSearchParams(window.location.search);

	for (const [key, field] of Object.entries(queryFields)) {
		field.value = params.get(key) ?? '';
	}

	watch(Object.values(queryFields), () => {
		const params = new URLSearchParams();

		for (const [key, field] of Object.entries(queryFields)) {
			if (field.value) {
				params.set(key, field.value);
			}
		}

		const query = params.toString();
		history.replaceState(history.state, '', query ? `?${query}` : window.location.pathname);
	});
});

const hiddenByFilters = computed(() => rules.filter((rule) => !matchesRuleFilters(rule)).length);

const filtered = computed(() => {
	const terms = search.value.trim().toLowerCase();
	return rules.filter(
		(rule) =>
			(!part.value || partOf.get(rule.theme) === part.value) &&
			matchesRuleFilters(rule) &&
			(!theme.value || rule.theme === theme.value) &&
			(!severity.value || rule.severity === severity.value) &&
			(!scope.value || rule.scope.includes(scope.value)) &&
			(!terms || `${rule.code} ${rule.title} ${rule.group}`.toLowerCase().includes(terms)),
	);
});
</script>

<template>
	<div class="rule-filters">
		<input
			v-model="search"
			type="search"
			placeholder="Chercher un code ou un mot…"
			aria-label="Chercher une règle"
		/>
		<select v-model="part" aria-label="Partie">
			<option value="">Toutes les parties</option>
			<option v-for="p in parts" :key="p.slug" :value="p.slug">{{ p.title }}</option>
		</select>
		<select v-model="theme" aria-label="Thème">
			<option value="">Tous les thèmes</option>
			<option v-for="t in writtenThemes" :key="t.slug" :value="t.slug">{{ t.title }}</option>
		</select>
		<select v-model="severity" aria-label="Sévérité">
			<option value="">Toutes les sévérités</option>
			<option v-for="s in severities" :key="s" :value="s">{{ badgeLabel(s) }}</option>
		</select>
		<select v-model="scope" aria-label="Portée">
			<option value="">Toutes les portées</option>
			<option v-for="s in scopes" :key="s.id" :value="s.id">{{ s.label }}</option>
		</select>
	</div>
	<p class="rule-filters__count" aria-live="polite">{{ filtered.length }} règles sur {{ rules.length }}</p>
	<FilterNote :hidden="hiddenByFilters" />
	<p v-if="filtered.length === 0" class="rule-filters__empty">Aucune règle ne correspond à cette recherche.</p>
	<table v-else class="rule-table">
		<thead>
			<tr>
				<th>Code</th>
				<th>Règle</th>
				<th class="rule-table__nature">Nature</th>
			</tr>
		</thead>
		<tbody>
			<tr v-for="rule in filtered" :key="rule.code">
				<td>
					<a :href="withBase(rule.url)" class="rule-code">{{ rule.code }}</a>
				</td>
				<td :class="{ 'rule-table__rejected': rule.review === 'rejected' }">
					{{ rule.title }}
					<span v-if="rule.context" class="rule-conditional" :title="rule.context">conditionnelle</span>
					<br /><small>{{ rule.group }}</small>
					<span class="rule-table__nature-inline">
						<KindBadge :value="rule.kind" :severity="rule.severity" />
					</span>
				</td>
				<td class="rule-table__nature"><KindBadge :value="rule.kind" :severity="rule.severity" /></td>
			</tr>
		</tbody>
	</table>
</template>
