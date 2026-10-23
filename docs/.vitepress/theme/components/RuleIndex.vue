<script setup lang="ts">
import { withBase } from 'vitepress';
import { computed, ref, watch } from 'vue';
import { parts } from '../../parts';
import { reviewOrder, reviews } from '../../reviews';
import { scopes } from '../../scopes';
import { styles } from '../../styles';
import { themes } from '../../themes';
import { badgeLabel, severities } from '../badges';
import { data as rules } from '../rules.data';
import { matchesStyleFilter, styleFilter } from '../style-filter';
import RuleBadge from './RuleBadge.vue';

const search = ref('');
const part = ref('');
const review = ref('');
const theme = ref('');
const severity = ref('');
const scope = ref('');

const partOf = new Map(themes.map((t) => [t.slug, t.part]));
const writtenThemes = computed(() =>
  themes.filter((t) => (!part.value || t.part === part.value) && rules.some((rule) => rule.theme === t.slug)),
);

watch(part, () => {
  if (part.value && theme.value && partOf.get(theme.value) !== part.value) {
    theme.value = '';
  }
});

function reviewCount(value: string): number {
  return rules.filter((rule) => rule.review === value).length;
}

const filtered = computed(() => {
  const terms = search.value.trim().toLowerCase();
  return rules.filter(
    (rule) =>
      (!part.value || partOf.get(rule.theme) === part.value) &&
      (!review.value || rule.review === review.value) &&
      matchesStyleFilter(rule.style) &&
      (!theme.value || rule.theme === theme.value) &&
      (!severity.value || rule.severity === severity.value) &&
      (!scope.value || rule.scope.includes(scope.value)) &&
      (!terms || `${rule.code} ${rule.title} ${rule.group}`.toLowerCase().includes(terms)),
  );
});
</script>

<template>
  <div class="rule-filters">
    <input v-model="search" type="search" placeholder="Chercher un code ou un mot…" />
    <select v-model="part">
      <option value="">Toutes les parties</option>
      <option v-for="p in parts" :key="p.slug" :value="p.slug">{{ p.title }}</option>
    </select>
    <select v-model="theme">
      <option value="">Tous les thèmes</option>
      <option v-for="t in writtenThemes" :key="t.slug" :value="t.slug">{{ t.title }}</option>
    </select>
    <select v-model="review">
      <option value="">Tous les verdicts</option>
      <option v-for="r in reviewOrder" :key="r" :value="r">{{ reviews[r].emoji }} {{ reviews[r].label }}</option>
    </select>
    <select v-model="severity">
      <option value="">Toutes les sévérités</option>
      <option v-for="s in severities" :key="s" :value="s">{{ badgeLabel(s) }}</option>
    </select>
    <select v-model="scope">
      <option value="">Toutes les portées</option>
      <option v-for="s in scopes" :key="s.id" :value="s.id">{{ s.label }}</option>
    </select>
  </div>
  <p class="rule-filters__count">
    {{ filtered.length }} règles sur {{ rules.length }}<span v-if="styleFilter">, pour les {{ styles[styleFilter].contexts }}</span> ·
    <span v-for="r in reviewOrder" :key="r" class="rule-filters__review">{{ reviews[r].emoji }} {{ reviewCount(r) }} </span>
  </p>
  <table class="rule-table">
    <thead>
      <tr>
        <th class="rule-table__review" title="Verdict"></th>
        <th>Code</th>
        <th>Règle</th>
        <th>Sévérité</th>
        <th>Détection</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="rule in filtered" :key="rule.code">
        <td class="rule-table__review" :title="reviews[rule.review].label">{{ reviews[rule.review].emoji }}</td>
        <td><a :href="withBase(rule.url)" class="rule-code">{{ rule.code }}</a></td>
        <td :class="{ 'rule-table__rejected': rule.review === 'rejected' }">
          {{ rule.title }}
          <span v-if="rule.context" class="rule-conditional" :title="rule.context">conditionnelle</span>
          <br /><small>{{ rule.group }}</small>
        </td>
        <td><RuleBadge kind="severity" :value="rule.severity" /></td>
        <td><RuleBadge kind="detection" :value="rule.detection" /></td>
      </tr>
    </tbody>
  </table>
</template>
