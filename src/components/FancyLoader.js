import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Logo from './Logo';

const FancyLoader = ({ message = "Thinking...", size = 100 }) => {
    const { colors } = useTheme();
    const useNativeDriver = Platform.OS !== 'web';

    // Animation values
    const spinValue = useRef(new Animated.Value(0)).current;
    const pulseValue = useRef(new Animated.Value(1)).current;
    const fadeValue = useRef(new Animated.Value(0)).current;

    const [currentMessageIndex, setCurrentMessageIndex] = React.useState(0);
    const messages = Array.isArray(message) ? message : [message];

    useEffect(() => {
        // Fade In
        Animated.timing(fadeValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver,
        }).start();

        // Infinite Spin
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver,
            })
        ).start();

        // Infinite Pulse
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseValue, {
                    toValue: 1.2,
                    duration: 1000,
                    useNativeDriver,
                }),
                Animated.timing(pulseValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver,
                }),
            ])
        ).start();

        // Message Rotation
        if (messages.length > 1) {
            const interval = setInterval(() => {
                setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
            }, 2500);
            return () => clearInterval(interval);
        }
    }, [messages.length]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Animated.View style={[styles.container, { opacity: fadeValue }]}>
            {/* Outer Rotating Ring */}
            <Animated.View
                style={[
                    styles.ring,
                    {
                        width: size * 1.5,
                        height: size * 1.5,
                        borderRadius: size * 0.75,
                        borderTopColor: colors.primary,
                        borderLeftColor: colors.secondary,
                        borderRightColor: 'transparent',
                        borderBottomColor: 'transparent',
                        transform: [{ rotate: spin }],
                    },
                ]}
            />

            {/* Inner Pulsing Logo */}
            <Animated.View style={[styles.logoContainer, { transform: [{ scale: pulseValue }] }]}>
                <Logo size={size * 0.6} />
            </Animated.View>

            {/* Loading Text */}
            <Text style={[styles.text, { color: colors.primary, marginTop: size * 0.8 }]}>
                {messages[currentMessageIndex]}
            </Text>
            <Text style={[styles.subText, { color: colors.textSecondary }]}>
                AI is working its magic ✨
            </Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 999
    },
    ring: {
        borderWidth: 4,
        position: 'absolute',
    },
    logoContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
    text: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        textAlign: 'center'
    },
    subText: {
        fontSize: 14,
        marginTop: 5,
        fontStyle: 'italic'
    }
});

export default FancyLoader;
