<template>
  <v-card :class="[isSelected ?'selected-card': 'not-selected-card']">
    <v-card-actions class="voice-card-actions">
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
          :class="[isSelected ?'selected-card': 'not-selected-card']"
          depressed
          @click="open(); btnClicked();"
        >
          <span
            class="text-none"
            v-html="text"
          />
        </v-btn>
        <span>ポップアップで再生</span>
      </v-tooltip>
      <v-tooltip
        open-delay="500"
        bottom
      >
        <v-btn
          slot="activator"
          :class="[isSelected ?'selected-card': 'not-selected-card',
                   'voice-card__btn']"
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
    </v-card-actions>
  </v-card>
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
.voice-card__btn {
  min-width: auto;
  padding: 0 12px;
  margin-left: 0 !important;
}
.voice-card-actions {
  padding: 0;
}
</style>
