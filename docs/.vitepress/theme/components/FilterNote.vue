<script setup lang="ts">
import { styles } from '../../styles';
import { setStyleFilter, styleFilter } from '../style-filter';

defineProps<{ hidden: number }>();
</script>

<template>
	<p v-if="styleFilter && hidden > 0" class="filter-note">
		{{ hidden }} {{ hidden === 1 ? 'règle est masquée' : 'règles sont masquées' }} :
		{{ hidden === 1 ? 'elle ne s’applique' : 'elles ne s’appliquent' }} pas aux {{ styles[styleFilter].contexts }}.
		<button type="button" @click="setStyleFilter('')">Afficher toutes les règles</button>
	</p>
</template>
