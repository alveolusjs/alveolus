<script setup lang="ts">
import { useData, withBase } from 'vitepress';
import { computed } from 'vue';
import { data as rules } from '../rules.data';
import { matchesStyleFilter } from '../style-filter';
import FilterNote from './FilterNote.vue';
import RuleBadge from './RuleBadge.vue';

const { page } = useData();

function anchor(group: string): string {
  return group
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
}

const themeRules = computed(() => rules.filter((rule) => rule.theme === page.value.relativePath.split('/')[2]));
const shown = computed(() => themeRules.value.filter((rule) => matchesStyleFilter(rule.style)));
const groups = computed(() => Map.groupBy(shown.value, (rule) => rule.group));
</script>

<template>
  <FilterNote :hidden="themeRules.length - shown.length" />
  <template v-for="[group, groupRules] in groups" :key="group">
    <h3 :id="anchor(group)" class="rule-table__group">{{ group }}</h3>
    <table class="rule-table rule-table--aligned">
      <colgroup>
        <col class="rule-table__col-code" />
        <col />
        <col class="rule-table__col-severity" />
      </colgroup>
      <thead>
        <tr>
          <th>Code</th>
          <th>Règle</th>
          <th>Sévérité</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="rule in groupRules" :key="rule.code">
          <td><a :href="withBase(rule.url)" class="rule-code">{{ rule.code }}</a></td>
          <td :class="{ 'rule-table__rejected': rule.review === 'rejected' }">
            {{ rule.title }}
            <span v-if="rule.context" class="rule-conditional" :title="rule.context">conditionnelle</span>
          </td>
          <td><RuleBadge kind="severity" :value="rule.severity" /></td>
        </tr>
      </tbody>
    </table>
  </template>
</template>
