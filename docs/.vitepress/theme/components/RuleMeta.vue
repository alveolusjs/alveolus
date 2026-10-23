<script setup lang="ts">
import { useData } from 'vitepress';
import { computed } from 'vue';
import { scopeLabel } from '../../scopes';
import { styles } from '../../styles';
import { setStyleFilter, styleFilter } from '../style-filter';
import ReviewBadge from './ReviewBadge.vue';
import RuleBadge from './RuleBadge.vue';
import StyleBadge from './StyleBadge.vue';

withDefaults(defineProps<{ variant?: 'inline' | 'aside' }>(), { variant: 'inline' });

const { frontmatter } = useData();

const outOfFilter = computed(
  () => Boolean(styleFilter.value) && !(frontmatter.value.style ?? []).includes(styleFilter.value),
);

/** Escapes the text and renders backtick code, as in Markdown. */
function inlineCode(text: string): string {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
}
</script>

<template>
  <dl :class="['rule-meta', `rule-meta--${variant}`]">
    <div v-if="outOfFilter && styleFilter && variant === 'inline'" class="rule-meta__out">
      <dt>Hors du filtre</dt>
      <dd>
        Cette règle ne s’applique pas aux {{ styles[styleFilter].contexts }}.
        <button type="button" @click="setStyleFilter('')">Afficher toutes les règles</button>
      </dd>
    </div>
    <div v-if="frontmatter.review === 'rejected' && variant === 'inline'" class="rule-meta__rejected">
      <dt>Rejetée après relecture</dt>
      <dd>Cette règle ne fait plus partie des règles. Elle reste ici pour que son code ne soit jamais réutilisé.</dd>
    </div>
    <div class="rule-meta__review">
      <dt>Verdict</dt>
      <dd>
        <ReviewBadge :value="frontmatter.review" />
        <ul v-if="frontmatter.reviewNotes?.length" class="rule-meta__notes">
          <li v-for="note in frontmatter.reviewNotes" :key="note" v-html="inlineCode(note)" />
        </ul>
      </dd>
    </div>
    <div v-if="frontmatter.context && variant === 'inline'" class="rule-meta__context">
      <dt>Condition</dt>
      <dd>{{ frontmatter.context }}</dd>
    </div>
    <div class="rule-meta__style">
      <dt>Style</dt>
      <dd><StyleBadge :value="frontmatter.style" /></dd>
    </div>
    <div class="rule-meta__severity">
      <dt>Sévérité</dt>
      <dd>
        <RuleBadge kind="severity" :value="frontmatter.severity" />
        <span v-if="frontmatter.severityNote" class="rule-meta__note">{{ frontmatter.severityNote }}</span>
      </dd>
    </div>
    <div v-if="frontmatter.detection === 'fitness'" class="rule-meta__detection">
      <dt>Détection</dt>
      <dd>
        <RuleBadge kind="detection" :value="frontmatter.detection" />
        <span v-if="frontmatter.detectionNote" class="rule-meta__note">{{ frontmatter.detectionNote }}</span>
      </dd>
    </div>
    <div v-if="frontmatter.fitness" class="rule-meta__automated">
      <dt>Contrôle automatique</dt>
      <dd v-html="inlineCode(frontmatter.fitness)" />
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
