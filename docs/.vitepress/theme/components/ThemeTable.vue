<script setup lang="ts">
import { withBase } from 'vitepress';
import { computed } from 'vue';
import { parts } from '../../parts';
import { themes } from '../../themes';
import { data as rules } from '../rules.data';
import { matchesStyleFilter, styleFilter } from '../style-filter';
import FilterNote from './FilterNote.vue';

const props = defineProps<{ part?: string; withStyle?: string }>();

function hasStyle(slug: string): boolean {
  return !props.withStyle || rules.some((rule) => rule.theme === slug && rule.style.some((style) => style === props.withStyle));
}

function ruleCount(slug: string): number {
  return rules.filter((rule) => rule.theme === slug && matchesStyleFilter(rule.style)).length;
}

function countLabel(slug: string): string {
  const count = ruleCount(slug);

  return count === 1 ? '1 règle' : `${count} règles`;
}

function visible(slug: string, status: string): boolean {
  return status === 'coming' || !styleFilter.value || ruleCount(slug) > 0;
}

const candidates = computed(() =>
  parts
    .filter((part) => !props.part || part.slug === props.part)
    .map((part) => ({ part, themes: themes.filter((theme) => theme.part === part.slug && hasStyle(theme.slug)) })),
);

const sections = computed(() =>
  candidates.value
    .map((section) => ({ ...section, themes: section.themes.filter((theme) => visible(theme.slug, theme.status)) }))
    .filter((section) => section.themes.length > 0),
);

const hiddenRules = computed(() =>
  candidates.value
    .flatMap((section) => section.themes)
    .reduce(
      (total, theme) =>
        total + rules.filter((rule) => rule.theme === theme.slug && !matchesStyleFilter(rule.style)).length,
      0,
    ),
);
</script>

<template>
  <FilterNote :hidden="hiddenRules" />
  <template v-for="section in sections" :key="section.part.slug">
    <h3 v-if="!props.part" class="theme-cards__part">
      <a :href="withBase(`/rules/${section.part.slug}/`)">{{ section.part.title }}</a>
    </h3>
    <div class="theme-cards">
      <component
        :is="theme.status === 'written' ? 'a' : 'div'"
        v-for="theme in section.themes"
        :key="theme.slug"
        :href="theme.status === 'written' ? withBase(`/rules/${theme.part}/${theme.slug}/`) : undefined"
        :class="['theme-card', { 'theme-card--coming': theme.status === 'coming' }]"
      >
        <span class="theme-card__top">
          <code class="theme-card__prefix">{{ theme.prefix }}</code>
          <span class="theme-card__count">{{ theme.status === 'written' ? countLabel(theme.slug) : 'à venir' }}</span>
        </span>
        <span class="theme-card__title">{{ theme.title }}</span>
        <span class="theme-card__summary">{{ theme.summary }}</span>
        <span v-if="theme.status === 'written'" class="theme-card__link">Voir les règles →</span>
      </component>
    </div>
  </template>
</template>
