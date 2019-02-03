<template>
  <v-layout
    :class="[isSelected ?'selected-card': 'not-selected-card']"
    row
    align-center
  >
    <v-avatar
      class="avater"
      size="28px"
    >
      <img :src="avaterUrl">
    </v-avatar>
    <v-tooltip
      open-delay="500"
      bottom
    >
      <v-btn
        slot="activator"
        style="height:auto"
        :class="[isSelected ?'selected-card': 'not-selected-card']"
        depressed
        class="text-none button--open-youtube-dialog"
        @click="open(); btnClicked();"
        v-html="text"
      />
      <span>ポップアップで再生</span>
    </v-tooltip>
    <v-tooltip
      open-delay="500"
      bottom
    >
      <v-btn
        slot="activator"
        :class="[isSelected ?'selected-card': 'not-selected-card',
                 'button--open-video-page']"
        depressed
        @click="openDetail"
      >
        <v-icon small>
          open_in_new
        </v-icon>
      </v-btn>
      <span>動画ページを開く</span>
    </v-tooltip>
    <youtube-dialog-detail
      :id="id"
      ref="youtubeDialogDetail"
      :start="start"
      :end="end"
      :video-id="videoId"
      :text="text"
    />
  </v-layout>
</template>

<script>
import YoutubeDialogDetail from '~/components/YoutubeDialogDetail.vue'

export default {
  components: {
    YoutubeDialogDetail
  },
  props: {
    text: {
      type: String,
      required: true
    },
    videoId: {
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
    avaterUrl: {
      type: String,
      required: true
    },
    id: {
      type: String,
      required: true
    },
    type: {
      type: String,
      default: "button"
    }
  },
  data() {
    return {
      isSelected: false
    }
  },
  methods: {
    open() {
      this.$refs.youtubeDialogDetail.open(this.type);
    },
    openDetail() {
      if (this.type === "asr") {
        this.$router.push(`/video/${this.videoId}?start=${this.start}&end=${this.end}&show=asr`);
      } else {
        this.$router.push(`/video/${this.videoId}?start=${this.start}&end=${this.end}`);
      }
    },
    select(isSelected) {
      this.isSelected = isSelected;
    },
    btnClicked() {
      this.$emit("btnClickedEvent", this.id);
    }
  }
}
</script>

<style>
.avater {
  margin: 0 5px;
}
.not-selected-card {
  background-color: #212121 !important;
}
.selected-card {
  background-color: #1976d2 !important;
}
.button--open-video-page {
  min-width: auto;
  margin: 0;
}
.button--open-youtube-dialog.v-btn {
  height: 100%;
  margin: 0;
}
</style>
