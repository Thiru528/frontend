import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const BANNER_ID = TestIds.BANNER; // Replace with production ID later

const AdBanner = () => {
    if (Platform.OS === 'web') {
        return null; // Don't render anything on web
    }

    return (
        <View style={styles.container}>
            <BannerAd
                unitId={BANNER_ID}
                size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true,
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        backgroundColor: 'transparent',
    },
});

export default AdBanner;
