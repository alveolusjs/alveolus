<script setup lang="ts">
import { withBase } from 'vitepress';
import { computed } from 'vue';

import { type Style, styleOrder, styles } from '../../styles';
import { inlineCode } from '../inline-code';
import { data as rules } from '../rules.data';
import { matchesStyleFilter, setStyleFilter, styleFilter } from '../style-filter';

const shown = computed(() => rules.filter((rule) => matchesStyleFilter(rule.style)));

const figures = computed(() => [
	{ value: shown.value.length, label: 'règles' },
	{ value: new Set(shown.value.map((rule) => rule.theme)).size, label: 'thèmes' },
	{ value: shown.value.filter((rule) => rule.severity === 'blocking').length, label: 'bloquantes' },
]);

const purposes: Record<Style, string> = {
	tactical:
		'Pour les bounded contexts core : des aggregates, des entities et des value objects gardent les règles métier.',
	'transaction-script':
		'Pour les bounded contexts supporting et generic : un script par use case, sans dossier `domain`.',
};

function countFor(style: Style): number {
	return rules.filter((rule) => rule.style.includes(style)).length;
}

function toggle(style: Style): void {
	setStyleFilter(styleFilter.value === style ? '' : style);
}
</script>

<template>
	<div class="home-styles">
		<dl class="home-styles__figures">
			<div v-for="figure in figures" :key="figure.label" class="home-styles__figure">
				<dt>{{ figure.label }}</dt>
				<dd>{{ figure.value }}</dd>
			</div>
		</dl>
		<div class="home-styles__cards">
			<section
				v-for="style in styleOrder"
				:key="style"
				:class="['home-styles__card', { 'home-styles__card--active': styleFilter === style }]"
			>
				<h3 class="home-styles__title">{{ styles[style].label }}</h3>
				<p class="home-styles__text" v-html="inlineCode(purposes[style])" />
				<p class="home-styles__count">{{ countFor(style) }} règles s’appliquent</p>
				<button
					type="button"
					class="home-styles__toggle"
					:aria-pressed="styleFilter === style"
					@click="toggle(style)"
				>
					{{ styleFilter === style ? 'Afficher toutes les règles' : 'Ne voir que ces règles' }}
				</button>
			</section>
		</div>
		<p class="home-styles__links">
			<a :href="withBase('/rules/domain-logic/choosing-a-style')">Choisir un style</a>
		</p>
	</div>
</template>
