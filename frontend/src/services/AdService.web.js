// Web implementation of AdService - No-op
export const AdService = {
    initialize: () => { },
    loadInterstitial: () => { },
    loadRewarded: () => { },
    showInterstitial: async () => Promise.resolve(true),
    showRewarded: async () => Promise.resolve(true), // Web users get "reward" instantly without ad
};
