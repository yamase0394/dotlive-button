<template>
  <v-layout
    v-if="loading"
    class="loading-page"
    justify-center
    align-center
  >
    <v-progress-circular
      indeterminate
      color="blue darken-2"
      :size="50"
    />
  </v-layout>
</template>

<script>
export default {
  data: () => ({
    loading: false
  }),
  methods: {
    start() {
      this.loading = true
    },
    finish() {
      setTimeout(() => { this.loading = false }, 500);
    }
  }
}
</script>

<style scoped>
.loading-page {
  position: fixed;
  z-index: 10;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(66, 66, 66, 0.7);
}
</style>