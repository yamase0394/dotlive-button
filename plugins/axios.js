export default function({ $axios }) {
  $axios.onResponse(res => {
    try {
      res.data.status = res.status;
    } catch (e) {
      if (typeof res.data === "string") {
        res.data = { status: res.status };
      }
    }
    return res;
  });
}
