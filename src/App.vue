<template>
  <router-view></router-view>
</template>
<script setup>
  // import AppHeader from '@/components/layouts/AppHeader.vue'
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');

:root {
  font-family: 'Inter', sans-serif;
  --color-text: #1c1b19;
  --color-background: #f8f6f6;
  --color-border: #f7c8ce71;
  --color-primary: #fa5b75;
  --color-secondary: #FB7185;
  --color-accent: #f8f7f4;
  --color-hover: #85495171;
  color: var(--color-text);
  background: var(--color-background);
  color-scheme: light;
}

:root[data-theme="dark"] {
  --color-text: #f2f0ea;
  --color-background: #122131;
  --color-border: #3f3d3d;
  --color-primary: #fc4c69;
  --color-secondary: #FB7185;
  --color-accent: #16283a;
   --color-hover: #f7c8ce71;
  color: var(--color-text);
  background: var(--color-background);
  color-scheme: dark;
}

body {
  margin: 0;
  min-width: 320px;
  background: inherit;
  color: inherit;
  transition: background-color .2s ease, color .2s ease;
}

button,
input {
  font: inherit;
}

img,
svg {
  max-width: 100%;
}
</style>
