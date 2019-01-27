<template>
  <v-card
    class="video-card"
    ripple
    @click.native="onCardClicked()"
  >
    <v-container fluid>
      <v-layout
        justify-start
        d-flex-inline
        align-start
        row
      >
        <v-flex>
          <v-img
            :src="thumbnail"
            contain
            width="246px"
            max-width="246px"
          />
        </v-flex>
        <v-flex xs11>
          <v-card-title>
            <div>
              <div class="grey--text">
                {{ publishedAt }}
              </div>
              <div
                class="title"
                v-html="title"
              />
              <div class="container grey--text">
                <p v-html="description" />
              </div>
            </div>
          </v-card-title>
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
  methods: {
    onCardClicked() {
      if (["uploaded", "dotlive_button", "can_upload", "waiting_ack"].some(e => e === this.captionStatus)) {
        this.$router.push(`/video/${this.videoId}`);
      } else if (["editable", "not_permitted"].some(e => this.captionStatus.includes(e))) {
        if (this.$store.state.videoListPage.isAsrFilter) {
          this.$router.push(`/video/${this.videoId}`);
        } else {
          this.$router.push({ path: `/edit/caption/${this.videoId}`, query: { status: this.captionStatus } });
        }
      }
    }
  }
}
</script>

<style>
.video-card {
  width: 100vw;
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
.title {
  font-size: 16px;
  margin: 3px 0 5px 0;
}
.v-card__title {
  padding: 8px;
}
.video-card {
  max-width: 850px;
}
.video-card:hover {
  cursor: pointer;
}
</style>
