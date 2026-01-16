import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const DEFAULT_MESSAGES = [
    "Analyzing your career trajectory...",
    "Scanning market trends for you...",
    "Optimizing your study path...",
    "Connecting to the AI Brain...",
    "Did you know? Python is the top AI language.",
    "Formulating personalized queries...",
    "Polishing your experience...",
    "Reviewing resume details...",
];

const FancyLoader = ({ message = "Thinking...", size = 100 }) => {
    const { colors } = useTheme();
    const useNativeDriver = Platform.OS !== 'web';

    const spinValue = useRef(new Animated.Value(0)).current;
    const fadeValue = useRef(new Animated.Value(0)).current;

    // Use passed message if it's specific, otherwise cycle defaults
    const [currentMsg, setCurrentMsg] = useState(
        Array.isArray(message) ? message[0] : (message === "Thinking..." || message === "Loading..." ? DEFAULT_MESSAGES[0] : message)
    );

    useEffect(() => {
        // Fade In
        Animated.timing(fadeValue, {
            toValue: 1,
            duration: 400,
            useNativeDriver,
        }).start();

        // Spin Loop
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver,
            })
        ).start();

        // Message Rotator
        let timer;
        const msgList = Array.isArray(message) ? message : (
            (message === "Thinking..." || message === "Loading..." || message === "AI is working on your resume..." || message === "Loading your personalized plan...") ? DEFAULT_MESSAGES : [message]
        );

        if (msgList.length > 1) {
            let i = 0;
            timer = setInterval(() => {
                i = (i + 1) % msgList.length;
                setCurrentMsg(msgList[i]);
            }, 3000);
        }

        return () => clearInterval(timer);
    }, [message]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    return (
        <Animated.View style={[styles.container, { opacity: fadeValue, backgroundColor: colors.background + 'F5' }]}>
            <View style={[styles.loaderCircle, { width: size, height: size }]}>
                {/* Spinning Ring */}
                <Animated.View style={[styles.spinner, {
                    width: size, height: size, borderRadius: size / 2,
                    borderColor: 'transparent',
                    borderTopColor: colors.primary,
                    borderLeftColor: colors.premium,
                    transform: [{ rotate: spin }]
                }]} />

                {/* Center Image Logo */}
                <View style={[styles.centerIcon, { width: size * 0.6, height: size * 0.6 }]}>
                    <Image
                        source={require('../../assets/logosafe.png')}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="contain"
                    />
                </View>
            </View>

            <Text style={[styles.text, { color: colors.text }]}>{currentMsg}</Text>
            {/* <Text style={[styles.subText, { color: colors.textSecondary }]}>Please wait...</Text> */}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
    },
    loaderCircle: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 999,
        padding: 5
    },
    spinner: {
        borderWidth: 4,
        position: 'absolute'
    },
    centerIcon: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
        textAlign: 'center',
        maxWidth: '80%'
    },
    subText: {
        fontSize: 14
    }
});

export default FancyLoader;
