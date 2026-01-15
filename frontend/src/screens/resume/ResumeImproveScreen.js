import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { resumeAPI } from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';

const ResumeImproveScreen = ({ navigation, route }) => {
    const { colors } = useTheme();
    const { resumeId } = route.params;
    const [goal, setGoal] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleImprove = async () => {
        if (!resumeId) {
            Alert.alert("Error", "No Resume ID found. Please go back and select a resume.");
            return;
        }

        setLoading(true);
        try {
            const response = await resumeAPI.improveResume(resumeId, goal || 'General professional polish');

            if (response.data.success) {
                setResult(response.data.data);
            } else {
                throw new Error(response.data.message || 'Failed to improve resume');
            }
        } catch (error) {
            console.error('Error improving resume:', error);
            const msg = error.response?.data?.message || error.message || 'Failed to generate improvements.';
            Alert.alert('Improvement Failed ❌', `Server Error: ${msg}\n\nPlease try re-uploading your resume.`);
        } finally {
            setLoading(false);
        }
    };

    const renderResultSection = (title, icon, content, color = colors.primary) => (
        <View style={styles.sectionContainer}>
            <View style={[styles.sectionHeader, { borderLeftColor: color }]}>
                <Ionicons name={icon} size={24} color={color} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
            </View>
            <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
                {content}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <LinearGradient
                colors={result ? ['#059669', '#10b981'] : ['#4338CA', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{result ? "Improvement Report" : "AI Resume Coach"}</Text>
                    <View style={{ width: 24 }} />
                </View>
                {!result && <Text style={styles.headerSubtitle}>Personalized tips to land your dream job.</Text>}
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {!result ? (
                    <Card style={styles.mainCard}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="sparkles" size={32} color={colors.primary} />
                        </View>
                        <Text style={[styles.cardTitleOriginal, { color: colors.text }]}>What's your career goal?</Text>
                        <Text style={[styles.description, { color: colors.textSecondary }]}>
                            Tell us the role you are targeting (e.g. "Senior React Developer" or "Data Scientist").
                            Our AI will review your resume and give you specific tips.
                        </Text>

                        <TextInput
                            style={[styles.input, {
                                backgroundColor: colors.surface,
                                color: colors.text,
                                borderColor: colors.border
                            }]}
                            placeholder="E.g. I want to improve my resume for a Senior Java Developer role..."
                            placeholderTextColor={colors.textSecondary}
                            value={goal}
                            onChangeText={setGoal}
                            multiline
                            numberOfLines={4}
                        />

                        <Button
                            title="🚀 Analyze & Improve"
                            onPress={handleImprove}
                            loading={loading}
                            style={styles.generateButton}
                            textStyle={{ fontSize: 16, fontWeight: 'bold' }}
                        />
                    </Card>
                ) : (
                    <View>
                        <View style={styles.successBanner}>
                            <Ionicons name="checkmark-circle" size={20} color="#059669" style={{ marginRight: 8 }} />
                            <Text style={styles.successText}>Analysis Complete!</Text>
                        </View>

                        {/* 1. CRITIQUE (REVIEW) */}
                        {renderResultSection(
                            "AI Critique & Review",
                            "analytics-outline",
                            <Text style={[styles.resultText, { color: colors.textSecondary }]}>
                                {result.critique || "No specific critique generated."}
                            </Text>,
                            "#EA580C" // Orange
                        )}

                        {/* 2. IMPROVEMENTS (TIPS) */}
                        {renderResultSection(
                            "Actionable Tips",
                            "bulb-outline",
                            (result.improvements || []).map((item, index) => (
                                <View key={index} style={styles.tipItem}>
                                    <View style={styles.tipNumber}>
                                        <Text style={styles.tipNumberText}>{index + 1}</Text>
                                    </View>
                                    <Text style={[styles.tipText, { color: colors.text }]}>{item}</Text>
                                </View>
                            )),
                            "#0284c7" // Blue
                        )}

                        {/* 3. REWRITTEN SUMMARY */}
                        {renderResultSection(
                            "Rewritten Summary",
                            "create-outline",
                            <>
                                <Text style={[styles.summaryText, { color: colors.text, fontStyle: 'italic' }]}>
                                    "{result.rewrittenSummary}"
                                </Text>
                                <TouchableOpacity
                                    style={styles.copyButton}
                                    onPress={() => Alert.alert("Copied!", "Summary copied to clipboard.")}
                                >
                                    <Text style={styles.copyButtonText}>Copy to Clipboard</Text>
                                    <Ionicons name="copy-outline" size={16} color={colors.primary} />
                                </TouchableOpacity>
                            </>,
                            "#7c3aed" // Purple
                        )}

                        <Button
                            title="Start Over"
                            variant="secondary"
                            onPress={() => setResult(null)}
                            style={{ marginVertical: 20 }}
                        />
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerGradient: {
        paddingTop: 40,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5
    },
    headerContent: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center' },
    backButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },
    scrollContent: { padding: 20 },

    // Main Card
    mainCard: { padding: 24, alignItems: 'center', borderRadius: 24, elevation: 2 },
    iconContainer: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginBottom: 16
    },
    cardTitleOriginal: { fontSize: 22, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
    description: { fontSize: 15, marginBottom: 24, lineHeight: 22, textAlign: 'center' },
    input: {
        borderWidth: 1, borderRadius: 16, padding: 16, textAlignVertical: 'top',
        minHeight: 120, marginBottom: 20, width: '100%', fontSize: 16
    },
    generateButton: { width: '100%' },

    // Results
    sectionContainer: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingLeft: 12, borderLeftWidth: 4 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 10 },
    sectionContent: { padding: 20, borderRadius: 20 },

    successBanner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#ECFDF5', padding: 12, borderRadius: 12, marginBottom: 24
    },
    successText: { color: '#059669', fontWeight: 'bold' },

    resultText: { fontSize: 16, lineHeight: 26 },

    tipItem: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' },
    tipNumber: {
        width: 24, height: 24, borderRadius: 12, backgroundColor: '#0284c7',
        justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2
    },
    tipNumberText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
    tipText: { flex: 1, fontSize: 16, lineHeight: 24 },

    summaryText: { fontSize: 16, lineHeight: 26 },
    copyButton: { flexDirection: 'row', alignItems: 'center', padding: 8, marginTop: 12, alignSelf: 'flex-end' },
    copyButtonText: { color: '#7c3aed', marginRight: 6, fontWeight: '600' }
});

export default ResumeImproveScreen;
