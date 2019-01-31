<template>
  <v-card :class="[id == selectedId ?'selected-card': 'not-selected-card']">
    <v-btn
      :class="[id == selectedId ?'selected-card': 'not-selected-card',
               'simple-voice-card-btn']"
      depressed
      @click="onClicked"
    >
      <span
        class="text-none"
        v-html="text"
      />
    </v-btn>
  </v-card>
</template>

<script>
export default {
  props: {
    text: {
      type: String,
      required: true
    },
    start: {
      type: Number,
      required: true
    },
    end: {
      type: Number,
      required: true
    },
    id: {
      type: String,
      required: true
    },
    selectedId: {
      type: String,
      required: true
    }
  },
  methods: {
    onClicked() {
      this.$emit("btnClicked", this.id, this.start, this.end, this.text);
    }
  }
}
</script>

<style>
.not-selected-card {
  background-color: #212121 !important;
}
.selected-card {
  background-color: #1976d2 !important;
}
.simple-voice-card-btn {
  height: auto;
  text-align: left;
  min-width: auto;
  padding: 0;
}
</style>
