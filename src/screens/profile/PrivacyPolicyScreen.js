import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const PrivacyPolicyScreen = ({ navigation }) => {
    const { colors } = useTheme();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy Policy</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.title, { color: colors.primary }]}>AI Career Coach – Privacy Policy</Text>
                <Text style={[styles.intro, { color: colors.textSecondary }]}>Your privacy is important to us.</Text>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>What data we collect</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• Name, email, and basic profile details</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• Uploaded resume (PDF)</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• Extracted resume text (skills, experience)</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• Study progress, exam scores, and app usage data</Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>How we use your data</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• Analyze your resume using AI</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• Recommend job roles and missing skills</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• Generate study plans and practice questions</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• Track your learning progress</Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>AI usage</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• AI is used only to analyze and generate suggestions</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• Your data is NOT used to train any AI model</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• AI results are for guidance purposes only</Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Data storage & security</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• Resume files are stored securely</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• User data is protected and not shared publicly</Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Ads & third parties</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• The app may show ads</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• Ads do not access your resume or personal content</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• We do not sell your personal data</Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Data deletion</Text>
                    <Text style={[styles.text, { color: colors.text }]}>• You can request account and data deletion from the Profile section.</Text>
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

export default PrivacyPolicyScreen;
