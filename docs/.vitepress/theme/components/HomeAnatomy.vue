<script setup lang="ts">
import { withBase } from 'vitepress';

import { scopeLabel } from '../../scopes';
import { data as rule } from '../featured-rule.data';
import { inlineCode } from '../inline-code';
import RuleBadge from './RuleBadge.vue';
import StyleBadge from './StyleBadge.vue';

const roles: Record<string, string> = {
	Signal: 'Ce qu’il faut chercher dans le code.',
	Pourquoi: 'Ce que cela coûte si cela passe.',
	Correction: 'La correction attendue.',
};
</script>

<template>
	<div class="home-anatomy">
		<article class="home-anatomy__rule">
			<header class="home-anatomy__header">
				<a :href="withBase(rule.url)" class="home-anatomy__code">{{ rule.code }}</a>
				<p class="home-anatomy__title">{{ rule.title }}</p>
				<div class="home-anatomy__badges">
					<RuleBadge kind="severity" :value="rule.severity" />
					<StyleBadge :value="rule.style" />
					<span v-for="scope in rule.scope" :key="scope" class="home-anatomy__scope">{{
						scopeLabel(scope)
					}}</span>
				</div>
			</header>
			<ol class="home-anatomy__sections">
				<li v-for="excerpt in rule.excerpts" :key="excerpt.section" class="home-anatomy__section">
					<p class="home-anatomy__name">
						{{ excerpt.section }}
						<span class="home-anatomy__role">{{ roles[excerpt.section] }}</span>
					</p>
					<p class="home-anatomy__text" v-html="inlineCode(excerpt.text)" />
				</li>
			</ol>
		</article>
		<ul class="home-anatomy__notes">
			<li>
				<strong>Sévérité.</strong> Bloquante, majeure, mineure ou question : ce qu’on attend avant de merger.
			</li>
			<li><strong>Style.</strong> Le modèle tactique, les transaction scripts, ou les deux.</li>
			<li><strong>Périmètre.</strong> Les dossiers de l’architecture de référence que la règle vise.</li>
			<li><strong>Et ensuite.</strong> Exceptions, adaptation à TypeScript et NestJS, exemple de code.</li>
		</ul>
		<p class="home-anatomy__links">
			<a :href="withBase(rule.url)">Lire {{ rule.code }} en entier</a>
			<a :href="withBase('/start/overview#how-to-read')">Lire une règle</a>
		</p>
	</div>
</template>
