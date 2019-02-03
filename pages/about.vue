<template>
  <v-container>
    <v-layout
      column
      px-3
    >
      <p :class="[{'display-1':!isMobile},{'headline':isMobile}]">
        このサイトについて
      </p>
      <p :class="[{'title':!isMobile},{'subheading':isMobile}]">
        .LIVEメンバーの声を再生するWebアプリケーションです。
      </p>
      <v-divider pb-2 />
      <div class="normal__section">
        <p :class="[{'subheading':!isMobile},{'bodt-1':isMobile}]">
          <a
            class="blue--text"
            target="_blank"
            href="https://sirobutton.herokuapp.com/sirobutton/"
          >
            シロボタン
          </a>
          や、
          <a
            class="blue--text"
            target="_blank"
            href="https://natobutton.web.fc2.com/nato.html"
          >
            なとボタン
          </a>
          、
          <a
            class="blue--text"
            target="_blank"
            href="https://efutei.github.io/ReversibleTama/"
          >
            たまボタン
          </a>
          などはありますが、.LIVE全体の物が無かったので作りました。<br>
          最初はアイドル部で作ろうと考えていたのですが、それだとばあちゃるさんがいないので.LIVE全体にしました。
        </p>
        <p :class="[{'subheading':!isMobile},{'bodt-1':isMobile}]">
          設計はシロボタンの作者様の考えに賛同し、YouTubeで直接再生する形にしました。<br>
          しかし、YouTubeの字幕から再生時間を取得している都合上、
          一部のメンバーのボタンしかない状況です（.LIVEボタンとは）。<br>
          なので、こつこつ字幕を作成しようと思っています。
          完成は遠い...
        </p>
        <p :class="[{'subheading':!isMobile},{'bodt-1':isMobile}]">
          何か意見などがあれば
          <a
            class="blue--text"
            target="_blank"
            href="https://twitter.com/sla0394"
          >
            Twitter
          </a>や
          <a
            class="blue--text"
            target="_blank"
            href="https://github.com/yamase0394/dotlive-button"
          >
            GitHub
          </a>
          にお願いします。
        </p>
      </div>
    </v-layout>
  </v-container>
</template>

<script>
export default {
  computed: {
    isMobile() {
      return ["xs", "sm"].some(e => {
        return this.$vuetify.breakpoint.name === e;
      });
    }
  }
}
</script>

<style>
.normal__section {
  padding-top: 15px;
  line-height: 1.6;
}
.demo__btn {
  min-width: 0;
  max-width: 20px;
  max-height: 20px;
  padding: 0;
}
</style>
