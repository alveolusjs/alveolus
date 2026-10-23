<script setup lang="ts">
import { computed } from 'vue';
import { isReview, reviews } from '../../reviews';

const props = defineProps<{ value: unknown }>();

const review = computed(() => (isReview(props.value) ? props.value : 'to-review'));
</script>

<template>
  <span :class="['review-badge', `review-badge--${review}`]">{{ reviews[review].emoji }} {{ reviews[review].label }}</span>
</template>
