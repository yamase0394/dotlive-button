export const state = () => ({
  isAsrFilter: false
});

export const mutations = {
  isAsrFilter: (state, captionStatus) => {
    state.isAsrFilter = captionStatus === "asr";
  }
};
