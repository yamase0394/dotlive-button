<template>
  <v-container>
    <v-layout
      column
      justify-center
    >
      <v-flex xs12>
        <div class="headline__section">
          <p class="display-1">
            このサイトについて
          </p>
        </div>
        <div class="normal__section">
          <p class="title">
            .LIVEメンバーの声を再生するWebアプリケーションです。
          </p>
          <v-divider style="margin-bottom:10px" />
          <p class="subheading">
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
        </div>
        <div class="normal__section">
          <p class="subheading">
            設計はシロボタンの作者様の考えに賛同し、YouTubeで直接再生する形にしました。<br>
            しかし、YouTubeの字幕から再生時間を取得している都合上、
            一部のメンバーのボタンしかない状況です（.LIVEボタンとは）。<br>
            なので、こつこつ字幕を作成しようと思っています。
            完成は遠い...
          </p>
        </div>
        <div class="normal__section">
          <p class="subheading">
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
      </v-flex>
    </v-layout>
  </v-container>
</template>

<style>
.headline__section {
  padding-bottom: 10px;
}
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
