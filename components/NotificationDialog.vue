<template>
  <v-dialog
    v-model="dialog"
    max-width="420px"
    persistent
  >
    <v-card>
      <v-card-text>
        <ul>
          <li
            v-for="(text, index) in messageList"
            :key="index"
            style="margin-top:10px"
          >
            <strong>
              {{ text }}
            </strong>
          </li>
        </ul>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          flat="flat"
          @click="dialog = false"
        >
          閉じる
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  data() {
    return {
      dialog: false,
      messageList: []
    }
  },
  methods: {
    /**
     * 配列が空の場合、ダイアログは表示されません
     * @param {string[]} messageList 箇条書きで表示する文字列リスト
     */
    open(messageList) {
      if (messageList.length === 0) {
        return;
      }

      this.messageList = messageList;
      this.dialog = true;
    },
    close() {
      this.dialog = false;
      this.messageList = [];
    }
  }
}
</script>