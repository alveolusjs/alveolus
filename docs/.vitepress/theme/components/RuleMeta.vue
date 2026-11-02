<script setup lang="ts">
import { useData } from 'vitepress';
import { computed } from 'vue';

import { scopeLabel } from '../../scopes';
import { clearRuleFilters, filterScope, matchesRuleFilters } from '../rule-filters';
import KindBadge from './KindBadge.vue';
import StyleBadge from './StyleBadge.vue';

withDefaults(defineProps<{ variant?: 'inline' | 'aside' }>(), { variant: 'inline' });

const { frontmatter } = useData();

const outOfFilter = computed(
	() => !matchesRuleFilters({ style: frontmatter.value.style ?? [], kind: frontmatter.value.kind }),
);
</script>

<template>
	<dl :class="['rule-meta', `rule-meta--${variant}`]">
		<div v-if="outOfFilter && variant === 'inline'" class="rule-meta__out">
			<dt>Hors du filtre</dt>
			<dd>
				Le filtre montre seulement {{ filterScope }}.
				<button type="button" @click="clearRuleFilters()">Afficher toutes les règles</button>
			</dd>
		</div>
		<div v-if="frontmatter.review === 'rejected' && variant === 'inline'" class="rule-meta__rejected">
			<dt>Rejetée après relecture</dt>
			<dd>
				Cette règle ne fait plus partie des règles. Elle reste ici pour que son code ne soit jamais réutilisé.
			</dd>
		</div>
		<div v-if="frontmatter.context && variant === 'inline'" class="rule-meta__context">
			<dt>Condition</dt>
			<dd>{{ frontmatter.context }}</dd>
		</div>
		<div class="rule-meta__kind">
			<dt>Nature</dt>
			<dd>
				<KindBadge :value="frontmatter.kind" :severity="frontmatter.severity" />
				<span v-if="frontmatter.severityNote" class="rule-meta__note">{{ frontmatter.severityNote }}</span>
				<span v-if="frontmatter.checkedBy === 'decision'" class="rule-meta__note">
					Se tranche par une décision, pas dans le diff.
				</span>
			</dd>
		</div>
		<div class="rule-meta__style">
			<dt>Style</dt>
			<dd><StyleBadge :value="frontmatter.style" /></dd>
		</div>
		<div class="rule-meta__scope">
			<dt>S’applique à</dt>
			<dd>
				<ul>
					<li v-for="scope in frontmatter.scope" :key="scope">
						{{ scopeLabel(scope) }}
					</li>
				</ul>
			</dd>
		</div>
	</dl>
</template>
