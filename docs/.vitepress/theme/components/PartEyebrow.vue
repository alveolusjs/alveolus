<script setup lang="ts">
import { useData, withBase } from 'vitepress';

const { frontmatter } = useData();
</script>

<template>
	<span v-if="frontmatter.partEyebrow" class="part-eyebrow">
		<span class="part-eyebrow__icon" v-html="frontmatter.partEyebrow.icon" />
		<nav v-if="frontmatter.partEyebrow.crumbs" class="part-eyebrow__crumbs" aria-label="Fil d’Ariane">
			<template v-for="(crumb, index) in frontmatter.partEyebrow.crumbs" :key="crumb.link">
				<span v-if="index > 0" class="part-eyebrow__separator" aria-hidden="true">›</span>
				<a :href="withBase(crumb.link)">{{ crumb.text }}</a>
			</template>
		</nav>
		<template v-else>{{ frontmatter.partEyebrow.label }}</template>
	</span>
</template>
