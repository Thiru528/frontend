import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const Avatar = ({ source, name, size = 50, style }) => {
    const { colors } = useTheme();

    const getInitials = (name) => {
        if (!name) return '?';
        const names = name.split(' ');
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    };

    if (source && source.uri) {
        return (
            <Image
                source={source}
                style={[
                    styles.image,
                    { width: size, height: size, borderRadius: size / 2 },
                    style,
                ]}
                resizeMode="cover"
            />
        );
    }

    return (
        <View
            style={[
                styles.container,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: colors.primary,
                },
                style,
            ]}
        >
            <Text style={[styles.initials, { fontSize: size / 2.5, color: '#FFFFFF' }]}>
                {getInitials(name)}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    image: {
    },
    initials: {
        fontWeight: 'bold',
    },
});

export default Avatar;
