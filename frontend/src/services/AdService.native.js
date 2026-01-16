import { Platform } from 'react-native';
import { InterstitialAd, RewardedAd, AdEventType, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';

// Ad Unit IDs
const INTERSTITIAL_ID = TestIds.INTERSTITIAL; // Replace with production ID later
const REWARDED_ID = TestIds.REWARDED;         // Replace with production ID later

let interstitial = null;
let rewarded = null;

export const AdService = {

    initialize: () => {
        if (Platform.OS === 'web') return;
        AdService.loadInterstitial();
        AdService.loadRewarded();
    },

    loadInterstitial: () => {
        if (Platform.OS === 'web') return;

        // Create only if not already loaded or if previously closed
        interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_ID, {
            requestNonPersonalizedAdsOnly: true,
        });

        interstitial.load();
    },

    loadRewarded: () => {
        if (Platform.OS === 'web') return;

        rewarded = RewardedAd.createForAdRequest(REWARDED_ID, {
            requestNonPersonalizedAdsOnly: true,
        });

        rewarded.load();
    },

    showInterstitial: async () => {
        if (Platform.OS === 'web') return Promise.resolve(true);

        return new Promise((resolve) => {
            // If ad is loaded, show it
            if (interstitial && interstitial.loaded) {

                const unsubscribeClose = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
                    // Ad closed, resolve promise and reload for next time
                    unsubscribeClose();
                    AdService.loadInterstitial();
                    resolve(true);
                });

                const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
                    // Fallback if error occurs during show
                    console.error('Interstitial Ad Error:', error);
                    unsubscribeError();
                    resolve(false);
                });

                interstitial.show();
            } else {
                // Fallback if not loaded
                console.log('Interstitial not ready, skipping...');
                AdService.loadInterstitial(); // Try loading for next time
                resolve(true);
            }
        });
    },

    showRewarded: async () => {
        if (Platform.OS === 'web') return Promise.resolve(true);

        return new Promise((resolve) => {
            if (rewarded && rewarded.loaded) {

                let rewardEarned = false;

                const unsubscribeReward = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
                    console.log('User earned reward:', reward);
                    rewardEarned = true;
                });

                const unsubscribeClose = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
                    unsubscribeReward();
                    unsubscribeClose();
                    AdService.loadRewarded(); // Reload for next time
                    resolve(rewardEarned);
                });

                const unsubscribeError = rewarded.addAdEventListener(AdEventType.ERROR, (error) => {
                    console.error('Rewarded Ad Error:', error);
                    unsubscribeError();
                    resolve(false);
                });

                rewarded.show();
            } else {
                console.log('Rewarded Ad not ready.');
                AdService.loadRewarded();
                resolve(false);
            }
        });
    }
};
