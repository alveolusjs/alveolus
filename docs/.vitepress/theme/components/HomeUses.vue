<script setup lang="ts">
import { withBase } from 'vitepress';
import { computed, ref } from 'vue';
import { data as rules } from '../rules.data';
import { matchesStyleFilter } from '../style-filter';
import RuleBadge from './RuleBadge.vue';

interface Use {
  title: string;
  text: string;
  commands: string[];
  finding?: { code: string; severity: string; text: string };
  link: { text: string; href: string };
  npm?: string;
}

const count = computed(() => rules.filter((rule) => matchesStyleFilter(rule.style)).length);

const uses = computed<Use[]>(() => [
  {
    title: 'Relire du code',
    text: `${count.value} règles à vérifier en revue : un signal à chercher, une sévérité, une correction.`,
    commands: [],
    finding: {
      code: 'AGG-06',
      severity: 'major',
      text: 'Ce use case enregistre deux wallets dans la même transaction.',
    },
    link: { text: 'Parcourir les règles', href: '/rules/' },
  },
  {
    title: 'Écrire le modèle',
    text: 'Les building blocks du Domain-Driven Design pour TypeScript, sans aucune dépendance à l’exécution.',
    commands: ['pnpm add @alveolus/core'],
    link: { text: 'Premiers pas', href: '/start/getting-started#core' },
    npm: '@alveolus/core',
  },
  {
    title: 'Coder avec Claude Code',
    text: 'Les règles chargées dossier par dossier, trois skills de la conception à la revue, et un agent de revue.',
    commands: ['pnpm add -D @alveolus/claude-rules', 'pnpm exec alveolus-claude install'],
    link: { text: 'Installer les règles', href: '/start/getting-started#claude-code' },
    npm: '@alveolus/claude-rules',
  },
]);

const copied = ref('');

async function copy(command: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(command);
    copied.value = command;
  } catch {
    copied.value = '';
  }
}
</script>

<template>
  <div class="home-uses">
    <section v-for="use in uses" :key="use.title" class="home-uses__card">
      <h3 class="home-uses__title">{{ use.title }}</h3>
      <p class="home-uses__text">{{ use.text }}</p>
      <div v-if="use.finding" class="home-uses__finding">
        <p class="home-uses__finding-head">
          <code>{{ use.finding.code }}</code>
          <RuleBadge kind="severity" :value="use.finding.severity" />
        </p>
        <p class="home-uses__finding-text">{{ use.finding.text }}</p>
      </div>
      <div v-if="use.commands.length" class="home-uses__commands">
        <div v-for="command in use.commands" :key="command" class="home-uses__command">
          <code>{{ command }}</code>
          <button
            type="button"
            :class="['home-uses__copy', { 'home-uses__copy--done': copied === command }]"
            :title="copied === command ? 'Copié' : 'Copier'"
            :aria-label="`Copier ${command}`"
            @click="copy(command)"
          />
        </div>
      </div>
      <p class="home-uses__links">
        <a :href="withBase(use.link.href)">{{ use.link.text }}</a>
        <a v-if="use.npm" :href="`https://www.npmjs.com/package/${use.npm}`" target="_blank" rel="noreferrer">npm</a>
      </p>
    </section>
  </div>
</template>
