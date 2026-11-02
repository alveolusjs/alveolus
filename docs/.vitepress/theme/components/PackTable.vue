<script setup lang="ts">
import { withBase } from 'vitepress';
import { computed } from 'vue';

import { type ConventionGroup, conventionGroups, type PackId, packs } from '../../conventions';
import { data as rules } from '../rules.data';

const props = defineProps<{ pack: PackId }>();

const urls = new Map(rules.map((rule) => [rule.code, rule.url]));

function escapeHtml(text: string): string {
	return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function labelHtml(label: string): string {
	return escapeHtml(label).replace(/`([^`]+)`/g, '<code>$1</code>');
}

function row(group: ConventionGroup) {
	const conventions = rules.filter((rule) => rule.convention === group.id).map((rule) => rule.code);
	const anchor = group.alternativeTo ?? group.id;

	return {
		group,
		conventions,
		carriedBy: (group.carriedBy ?? []).filter((code) => !conventions.includes(code)),
		safeguards: rules.filter((rule) => rule.requires.includes(anchor)).map((rule) => rule.code),
	};
}

const summary = computed(() => packs.find((pack) => pack.id === props.pack)?.summary ?? '');

const rows = computed(() =>
	conventionGroups
		.filter((group) => group.pack === props.pack && !group.alternativeTo)
		.flatMap((group) => [
			row(group),
			...conventionGroups.filter((alternative) => alternative.alternativeTo === group.id).map(row),
		]),
);
</script>

<template>
	<p>{{ summary }}</p>
	<table class="pack-table">
		<thead>
			<tr>
				<th>Choix</th>
				<th>Conventions</th>
				<th>Porté aussi par</th>
				<th>Garde-fous qui en dépendent</th>
			</tr>
		</thead>
		<tbody>
			<tr
				v-for="{ group, conventions, carriedBy, safeguards } in rows"
				:key="group.id"
				:class="{ 'pack-table__alternative': group.alternativeTo }"
			>
				<td>
					<span v-if="group.alternativeTo" class="pack-table__or">ou </span>
					<span v-html="labelHtml(group.label)" />
				</td>
				<td>
					<template v-for="(code, index) in conventions" :key="code">
						<a :href="withBase(urls.get(code) ?? '')" class="rule-code">{{ code }}</a
						><span v-if="index < conventions.length - 1">, </span>
					</template>
				</td>
				<td>
					<template v-for="(code, index) in carriedBy" :key="code">
						<a :href="withBase(urls.get(code) ?? '')" class="rule-code">{{ code }}</a
						><span v-if="index < carriedBy.length - 1">, </span>
					</template>
				</td>
				<td>
					<template v-for="(code, index) in safeguards" :key="code">
						<a :href="withBase(urls.get(code) ?? '')" class="rule-code">{{ code }}</a
						><span v-if="index < safeguards.length - 1">, </span>
					</template>
				</td>
			</tr>
		</tbody>
	</table>
</template>
