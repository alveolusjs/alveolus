<script setup lang="ts">
import { useData, withBase } from 'vitepress';
import { computed } from 'vue';

import { groupAnchor } from '../../themes';
import { matchesRuleFilters } from '../rule-filters';
import { data as rules } from '../rules.data';
import FilterNote from './FilterNote.vue';
import KindBadge from './KindBadge.vue';

const { page } = useData();

const themeRules = computed(() => rules.filter((rule) => rule.theme === page.value.relativePath.split('/')[2]));
const shown = computed(() => themeRules.value.filter(matchesRuleFilters));
const groups = computed(() => Map.groupBy(shown.value, (rule) => rule.group));
</script>

<template>
	<FilterNote :hidden="themeRules.length - shown.length" />
	<template v-for="[group, groupRules] in groups" :key="group">
		<h3 :id="groupAnchor(group)" class="rule-table__group">{{ group }}</h3>
		<table class="rule-table rule-table--aligned">
			<colgroup>
				<col class="rule-table__col-code" />
				<col />
				<col class="rule-table__col-nature" />
			</colgroup>
			<thead>
				<tr>
					<th>Code</th>
					<th>Règle</th>
					<th class="rule-table__nature">Nature</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="rule in groupRules" :key="rule.code">
					<td>
						<a :href="withBase(rule.url)" class="rule-code">{{ rule.code }}</a>
					</td>
					<td :class="{ 'rule-table__rejected': rule.review === 'rejected' }">
						{{ rule.title }}
						<span v-if="rule.context" class="rule-conditional" :title="rule.context">conditionnelle</span>
						<span class="rule-table__nature-inline">
							<KindBadge :value="rule.kind" :severity="rule.severity" />
						</span>
					</td>
					<td class="rule-table__nature"><KindBadge :value="rule.kind" :severity="rule.severity" /></td>
				</tr>
			</tbody>
		</table>
	</template>
</template>
