<template>
  <v-card
    class="video-card"
    ripple
    @click.native="onCardClicked()"
  >
    <v-container pa-2>
      <v-layout row>
        <v-flex
          md4
          xs4
          align-self-center
        >
          <v-img
            :src="thumbnail"
            contain
            aspect-ratio="1.7778"
          />
        </v-flex>
        <v-flex
          md8
          xs8
          grow
        >
          <v-layout
            column
            justify-center
            ml-1
            :class="{'pa-2': !isMobile}"
          >
            <v-flex
              v-if="!isMobile"
              pa-0
            >
              <div class="grey--text">
                {{ publishedAt }}
              </div>
            </v-flex>
            <v-flex
              pa-0
              style="overflow: hidden"
            >
              <div
                :class="[{'body-2':isMobile}, {'title':!isMobile}]"
                v-html="title"
              />
            </v-flex>
            <v-flex
              pa-0
              :class="[{'caption':isMobile}, {'body-2':!isMobile}]"
              class="container grey--text"
            >
              <p v-html="description" />
            </v-flex>
          </v-layout>
        </v-flex>
      </v-layout>
    </v-container>
  </v-card>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      required: true
    },
    publishedAt: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    thumbnail: {
      type: String,
      required: true
    },
    videoId: {
      type: String,
      required: true
    },
    captionStatus: {
      type: String,
      required: true
    }
  },
  computed: {
    isMobile() {
      return ["xs", "sm"].some(e => {
        return this.$vuetify.breakpoint.name === e;
      });
    }
  },
  methods: {
    onCardClicked() {
      if (["uploaded", "dotlive_button"].some(e => e === this.captionStatus) ||
        (this.$store.getters["videoListPage/isPartialFilter"] && this.captionStatus.includes("partial"))) {
        this.$router.push(`/video/${this.videoId}`);
      } else if (this.$store.getters["videoListPage/isAsrFilter"] && this.captionStatus.includes("asr")) {
        if (this.captionStatus.includes("partial")) {
          this.$router.push(`/video/${this.videoId}?show=asr`);
        } else {
          this.$router.push(`/video/${this.videoId}`);
        }
      } else if (["editable", "not_permitted"].some(e => this.captionStatus.includes(e))) {
        this.$router.push({ path: `/edit/caption/${this.videoId}`, query: { status: this.captionStatus } });
      }
    }
  }
}
</script>

<style>
.video-card {
  max-width: 850px;
}
.video-card:hover {
  cursor: pointer;
}
.video-card .container {
  overflow: hidden;
  padding: 0;
}
.video-card .container p {
  display: -webkit-box;
  /* autoprefixer: off */
  -webkit-box-orient: vertical;
  /* autoprefixer: on */
  -webkit-line-clamp: 2;
  margin: 0;
}
</style>
