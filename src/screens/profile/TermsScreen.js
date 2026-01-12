import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const TermsScreen = ({ navigation }) => {
    const { colors } = useTheme();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Terms & Conditions</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.title, { color: colors.primary }]}>AI Career Coach – Terms & Conditions</Text>
                <Text style={[styles.intro, { color: colors.textSecondary }]}>By using this app, you agree to the following terms.</Text>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>App usage</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• Use the app only for lawful purposes</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• Do not misuse AI-generated content</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• Provide accurate information</Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>AI disclaimer</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• AI suggestions are not guarantees</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• We do not promise job placement or employment</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• Career decisions are the user’s responsibility</Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Account responsibility</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• You are responsible for keeping your account secure</Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Ads & premium features</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• The app may display ads</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• Some features may require payment</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• Payments are handled securely</Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Limitation of liability</Text>
                    <Text style={[styles.text, { color: colors.text }]}>We are not responsible for:</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• AI inaccuracies</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• Job outcomes</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• Third-party service issues</Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Updates</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• These terms may change as the app improves.</Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '600' },
    content: { padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
    intro: { fontSize: 16, marginBottom: 24, fontStyle: 'italic' },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    text: { fontSize: 15, lineHeight: 22, marginBottom: 4 },
});

export default TermsScreen;
