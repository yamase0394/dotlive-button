<template>
  <v-layout
    column
    d-block
  >
    <div
      v-resize="onResize"
      ref="tabParent"
    >
      <v-tabs
        :style="tabStyle"
        centered
        height="40px"
        slider-color="blue lighten-5"
        fixed-tabs>
        <v-tab
          :key="1"
          :to="toUrlButton"
        >
          ボタン
        </v-tab>
        <v-tab
          :key="2"
          :to="toUrlVideo"
        >
          動画
        </v-tab>
      </v-tabs>
    </div>
    <v-flex
      class="con"
    >
      <v-container
        class="search-container"
        fluid>
        <nuxt-child
          @searchTextChangedEvent="onSearchTextChangedAtChild"
          @searchTargetChangedEvent="onSearchTargetChanged"
        />
      </v-container>
    </v-flex>

  </v-layout>
</template>

<script>
export default {
  data() {
    return {
      resized: false,
      tabStyle: {
        "position": "fixed",
        "z-index": 2,
        "top": "auto",
        "left": "auto",
        "right": 0,
        "width": "100%",
      },
      toUrlButton: "/search/button",
      toUrlVideo: "/search/video",
    }
  },
  updated() {
    try {
      this.tabStyle["width"] = this.$refs.tabParent.clientWidth + "px";
      console.log("updated");
    } catch (e) {
      console.log(e);
    }
  },
  methods: {
    onResize() {
      console.log("resized");
      this.tabStyle["width"] = this.$refs.tabParent.clientWidth + "px";
    },
    onSearchTextChangedAtChild(keyword) {
      this.toUrlButton = { path: "/search/button", query: { keyword: keyword } };
      this.toUrlVideo = { path: "/search/video", query: { keyword: keyword } };
      this.$emit("searchTextChangedEvent", keyword);
    },
    onSearchTargetChanged(target) {
      this.$emit("searchTargetChangedEvent", target);
    },
  },
}
</script>

<style>
.con {
  padding-bottom: 12px;
  padding-top: 40px;
  width: 100%;
}
.search-container {
  padding: 0;
}
</style>
