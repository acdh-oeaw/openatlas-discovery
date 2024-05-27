<script lang="ts" setup>
import Mirador from 'mirador';
import { defineProps, onMounted } from 'vue';

// Props
const props = defineProps({
  config: {
    type: Object,
    required: true
  }
});

// Refs
const mirador = "mirador";

// TODO: At the moment I assume there is a race condition where the div element isn't available yet,
// at time of mounting.

// Methods
const initMirador = () => {
  Mirador.viewer({
    id: mirador,
		...props.config,
		// windows: [{
		// 	manifestId: 'https://iiif.io/api/cookbook/recipe/0021-tagging/manifest.json',
		// }]
  });
};

// Lifecycle
onMounted(() => {
	// TODO: We shouldn't rely on timeouts here, and find a more reliable solution
	setTimeout(initMirador, 2000);
});


</script>

<template>
  <div :id="mirador"></div>
</template>
