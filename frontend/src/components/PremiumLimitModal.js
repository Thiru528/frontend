import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const PremiumLimitModal = ({ visible, onClose, onUpgrade, title, message }) => {
    const { colors } = useTheme();

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />

                <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                    <LinearGradient
                        colors={[colors.premium + '20', 'transparent']}
                        style={styles.gradientHeader}
                    />

                    <View style={styles.iconContainer}>
                        <LinearGradient
                            colors={['#FFD700', '#F59E0B']}
                            style={styles.iconGradient}
                        >
                            <Ionicons name="lock-closed" size={32} color="#FFF" />
                        </LinearGradient>
                    </View>

                    <Text style={[styles.title, { color: colors.text }]}>{title || "Limit Reached"}</Text>
                    <Text style={[styles.message, { color: colors.textSecondary }]}>
                        {message || "You've hit the limit for free accounts. Upgrade to Pro for unlimited access!"}
                    </Text>

                    <TouchableOpacity onPress={onUpgrade} activeOpacity={0.9} style={styles.upgradeButton}>
                        <LinearGradient
                            colors={['#FFD700', '#F59E0B']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            <Text style={styles.upgradeText}>Unlock Premium Access</Text>
                            <Ionicons name="arrow-forward" size={20} color="#FFF" />
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={[styles.closeText, { color: colors.textSecondary }]}>Maybe Later</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
        position: 'relative',
        overflow: 'hidden',
    },
    gradientHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 100,
    },
    iconContainer: {
        marginBottom: 20,
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    iconGradient: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 10,
    },
    message: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    upgradeButton: {
        width: '100%',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 16,
    },
    gradientButton: {
        paddingVertical: 14,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    upgradeText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 16,
        marginRight: 8,
    },
    closeButton: {
        padding: 8,
    },
    closeText: {
        fontSize: 14,
        fontWeight: '500',
    }
});

export default PremiumLimitModal;
