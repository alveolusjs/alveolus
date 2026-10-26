<script setup lang="ts">
import { styleLegend } from '../../styles';
import StyleBadge from './StyleBadge.vue';
</script>

<template>
	<ul class="style-legend">
		<li v-for="entry in styleLegend" :key="entry.meaning">
			<StyleBadge :value="entry.styles" />
			{{ entry.meaning }}
		</li>
	</ul>
</template>
