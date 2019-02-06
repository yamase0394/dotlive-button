<template>
  <v-dialog
    v-model="dialog"
    max-width="300px"
  >
    <v-card>
      <v-card-text>{{ message }}</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          flat
          @click="dialog = false"
        >
          キャンセル
        </v-btn>
        <v-btn
          :color="acceptButtonColor"
          @click="() => {
              dialog = false;
              acceptFunction()
            }"
        >
          {{ acceptButtonText }}
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
      message: "",
      acceptFunction: null,
      acceptButtonText: "",
      acceptButtonColor: ""
    }
  },
  methods: {
    open(message, acceptFunction, acceptButtonText, acceptButtonColor = "green darken-1") {
      this.message = message;
      this.acceptFunction = acceptFunction;
      this.acceptButtonText = acceptButtonText;
      this.acceptButtonColor = acceptButtonColor;
      this.dialog = true;
    },
    close() {
      this.dialog = false;
      this.message = "";
      this.acceptFunction = null;
      this.acceptButtonText = "";
      this.acceptButtonColor = "";
    }
  }
}
</script>