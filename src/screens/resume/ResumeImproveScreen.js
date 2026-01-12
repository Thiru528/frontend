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
        if (!resumeId) return;

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
            Alert.alert('Improvement Failed', `Could not improve resume: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    AI Resume Improve
                </Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {!result ? (
                    <>
                        <Card>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                What is your goal?
                            </Text>
                            <Text style={[styles.description, { color: colors.textSecondary }]}>
                                Tell the AI how you want to improve your resume (e.g., "Targeting Senior Developer roles", "Highlight leadership skills", or leave empty for general polish).
                            </Text>

                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: colors.surface,
                                    color: colors.text,
                                    borderColor: colors.border
                                }]}
                                placeholder="E.g. Make it sound more professional..."
                                placeholderTextColor={colors.textSecondary}
                                value={goal}
                                onChangeText={setGoal}
                                multiline
                                numberOfLines={3}
                            />

                            <Button
                                title="✨ Generate Improvements"
                                onPress={handleImprove}
                                loading={loading}
                                style={styles.generateButton}
                            />
                        </Card>
                    </>
                ) : (
                    <>
                        {/* Critique */}
                        <Card>
                            <View style={styles.cardHeader}>
                                <Ionicons name="analytics" size={24} color={colors.primary} />
                                <Text style={[styles.cardTitle, { color: colors.text }]}>AI Critique</Text>
                            </View>
                            <Text style={[styles.resultText, { color: colors.text }]}>
                                {result.critique}
                            </Text>
                        </Card>

                        {/* Actionable Improvements */}
                        <Card>
                            <View style={styles.cardHeader}>
                                <Ionicons name="list" size={24} color={colors.secondary} />
                                <Text style={[styles.cardTitle, { color: colors.text }]}>Top Improvements</Text>
                            </View>
                            {(result.improvements || []).map((item, index) => (
                                <View key={index} style={styles.listItem}>
                                    <Text style={[styles.bullet, { color: colors.secondary }]}>•</Text>
                                    <Text style={[styles.listText, { color: colors.text }]}>{item}</Text>
                                </View>
                            ))}
                        </Card>

                        {/* Rewritten Summary */}
                        <Card>
                            <View style={styles.cardHeader}>
                                <Ionicons name="create" size={24} color={colors.success} />
                                <Text style={[styles.cardTitle, { color: colors.text }]}>Rewritten Summary</Text>
                            </View>
                            <View style={[styles.summaryBox, { backgroundColor: colors.background }]}>
                                <Text style={[styles.summaryText, { color: colors.text }]}>
                                    {result.rewrittenSummary}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => Alert.alert("Copied!", "Summary copied to clipboard.")}>
                                <Text style={[styles.copyText, { color: colors.primary }]}>Copy to Clipboard</Text>
                            </TouchableOpacity>
                        </Card>

                        <Button
                            title="Try Again"
                            variant="secondary"
                            onPress={() => setResult(null)}
                            style={{ marginTop: 12 }}
                        />
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    placeholder: {
        width: 32,
    },
    scrollContent: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        marginBottom: 16,
        lineHeight: 20,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        textAlignVertical: 'top',
        minHeight: 100,
        marginBottom: 16,
    },
    generateButton: {
        marginTop: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    resultText: {
        fontSize: 14,
        lineHeight: 22,
    },
    listItem: {
        flexDirection: 'row',
        marginBottom: 8,
        alignItems: 'flex-start',
    },
    bullet: {
        fontSize: 16,
        marginRight: 8,
        marginTop: -2,
    },
    listText: {
        fontSize: 14,
        lineHeight: 20,
        flex: 1,
    },
    summaryBox: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    summaryText: {
        fontSize: 14,
        lineHeight: 22,
        fontStyle: 'italic',
    },
    copyText: {
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default ResumeImproveScreen;
