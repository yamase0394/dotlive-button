<template>
  <v-snackbar
    v-model="snackbar"
    :timeout="timeout"
    :color="color"
    top
  >
    {{ message }}
    <v-btn
      dark
      flat
      @click="() => {
          onButtonClicked();
          close();
        }"
    >
      {{ buttonText }}
    </v-btn>
  </v-snackbar>
</template>

<script>
export default {
  data() {
    return {
      snackbar: false,
      message: "",
      onButtonClicked: null,
      buttonText: "",
      timeout: 0,
      color: ""
    }
  },
  methods: {
    showSuccessSnackbar(message, timeout = 2000, onButtonClicked = () => { }, buttonText = "閉じる") {
      this.message = message;
      this.timeout = timeout;
      this.onButtonClicked = onButtonClicked;
      this.buttonText = buttonText;
      this.color = "success";
      this.snackbar = true;
    },
    showErrorSnackbar(message, timeout = 2000, onButtonClicked = () => { }, buttonText = "閉じる") {
      this.message = message;
      this.timeout = timeout;
      this.onButtonClicked = onButtonClicked;
      this.buttonText = buttonText;
      this.color = "error";
      this.snackbar = true;
    },
    close() {
      this.snackbar = false;
    }
  }
}
</script>