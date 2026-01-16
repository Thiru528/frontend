import React from 'react';
import { StyleSheet, View, Image } from 'react-native';

const Logo = ({ size = 120, style }) => {
    return (
        <View style={[styles.container, { width: size, height: size }, style]}>
            <Image source={require('../../assets/logosafe.png')} style={[{ width: size, height: size, resizeMode: 'contain' }, style]} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center'
    }
});

export default Logo;
