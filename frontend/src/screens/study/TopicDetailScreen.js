import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    ActivityIndicator,
    Alert,
    Pressable,
    Linking
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { studyAPI } from '../../services/api';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Markdown from 'react-native-markdown-display';

const TopicDetailScreen = ({ route, navigation }) => {
    const { topic } = route.params;
    const topicTitle = typeof topic === 'string' ? topic : topic?.title || "Unknown Topic";
    const { colors } = useTheme();
    const { user, updateUser } = useAuth(); // Access sync function

    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);

    // UseRef ensures the start time survives re-renders correctly for cleanup closure
    const startTimeRef = React.useRef(Date.now());

    useEffect(() => {
        startTimeRef.current = Date.now();
        loadTopicContent();

        return () => {
            const endTime = Date.now();
            const durationMinutes = Math.round((endTime - startTimeRef.current) / 60000);

            if (durationMinutes >= 1) {
                console.log(`Logging ${durationMinutes} mins`);
                // 1. API Call (Async, fire & forget)
                studyAPI.logTime(durationMinutes).catch(err => console.log("Failed to log time:", err));

                // 2. Optimistic Local Update (Instant feedback on StudyScreen)
                if (user && updateUser) {
                    updateUser({
                        ...user,
                        studyMinutes: (user.studyMinutes || 0) + durationMinutes
                    });
                }
            }
        };
    }, []);

    const loadTopicContent = async () => {
        try {
            // Fetch AI generated content for this specific topic
            const response = await studyAPI.generateTopicLesson(topicTitle);

            if (response.data.success && response.data.data) {
                setContent(response.data.data);
            } else {
                throw new Error("Invalid content structure");
            }
            setLoading(false);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load topic content. Using offline mode.');
            // Fallback content if API fails
            setContent({
                title: topicTitle,
                pages: [
                    {
                        title: "1. Introduction",
                        content: `### ${topicTitle}\nContent is currently being generated. Please check your connection.`
                    }
                ]
            });
            setLoading(false);
        }

    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                    Generating 5-Page AI Lesson for {topicTitle}...
                </Text>
            </SafeAreaView>
        );
    }

    const activePage = content.pages[currentPage];

    // Navigation handlers
    const handleNext = () => {
        if (currentPage < content.pages.length - 1) setCurrentPage(p => p + 1);
    };
    const handlePrev = () => {
        if (currentPage > 0) setCurrentPage(p => p - 1);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: 24, marginRight: 5 }}>←</Text>
                            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Back</Text>
                        </View>
                    </Pressable>
                </View>

                <Text style={[styles.title, { color: colors.text }]}>{content.title}</Text>

                {/* Progress Indicator */}
                <View style={styles.paginationIndicator}>
                    {content.pages.map((_, idx) => (
                        <View
                            key={idx}
                            style={[
                                styles.dot,
                                { backgroundColor: idx === currentPage ? colors.primary : colors.border }
                            ]}
                        />
                    ))}
                </View>

                {/* Content Card */}
                <Card style={styles.sectionCard}>
                    <Text style={[styles.sectionHeader, { color: colors.primary }]}>{activePage.title}</Text>
                    <Markdown style={markdownStyles(colors)}>
                        {activePage.content}
                    </Markdown>

                    {/* Resources Section - Show on all pages or just last? Showing on all for easy access */}
                    {content.resources && content.resources.length > 0 && (
                        <View style={styles.resourcesContainer}>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            <Text style={[styles.resourceHeader, { color: colors.text }]}>📚 Recommended Resources</Text>
                            {content.resources.map((resource, idx) => (
                                <Pressable
                                    key={idx}
                                    style={({ processed }) => [
                                        styles.resourceItem,
                                        { backgroundColor: colors.surface, borderColor: colors.border, opacity: processed ? 0.7 : 1 }
                                    ]}
                                    onPress={() => {
                                        const url = resource.url ||
                                            (resource.type === 'YouTube' ? `https://www.youtube.com/results?search_query=${encodeURIComponent(resource.searchTerm)}` :
                                                resource.type === 'GitHub' ? `https://github.com/search?q=${encodeURIComponent(resource.searchTerm)}` :
                                                    `https://www.google.com/search?q=${encodeURIComponent(resource.searchTerm)}`);

                                        Linking.openURL(url).catch(err => Alert.alert("Error", "Could not open link"));
                                    }}
                                >
                                    <View style={[styles.resourceIcon, { backgroundColor: resource.type === 'YouTube' ? '#FF0000' : resource.type === 'GitHub' ? '#333' : '#2196F3' }]}>
                                        <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>
                                            {resource.type === 'YouTube' ? 'YT' : resource.type === 'GitHub' ? 'GH' : 'WEB'}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.resourceTitle, { color: colors.text }]}>{resource.title}</Text>
                                        <Text style={[styles.resourceType, { color: colors.textSecondary }]}>
                                            Tap to Open • {resource.type}
                                        </Text>
                                    </View>
                                </Pressable>
                            ))}
                        </View>
                    )}
                </Card>

                {/* Navigation Buttons */}
                <View style={styles.navContainer}>
                    <Button
                        title="← Previous"
                        onPress={handlePrev}
                        disabled={currentPage === 0}
                        variant="secondary"
                        style={{ flex: 1, marginRight: 8, opacity: currentPage === 0 ? 0.5 : 1 }}
                    />

                    {currentPage === content.pages.length - 1 ? (
                        <View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
                            {/* "Mark Complete" is the primary action requested by user */}
                            <Button
                                title="Done ✅"
                                onPress={async () => {
                                    try {
                                        setLoading(true);
                                        // Mark day as complete
                                        await studyAPI.completeDay(topic.day);
                                        // Refresh user context to show new streak immediately
                                        if (updateUser && user) {
                                            // We can't know the exact new streak without API, but StudyPlan reload will happen.
                                            // Best to trigger a silent refreshUser if available from context
                                            updateUser({ ...user });
                                        }

                                        Alert.alert("Great Job! 🎉", "Day marked as completed.", [
                                            { text: "Continue", onPress: () => navigation.navigate('StudyPlan') }
                                        ]);
                                    } catch (error) {
                                        console.log("Completion error", error);
                                        // Still navigate back even on error to not block user
                                        navigation.navigate('StudyPlan');
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                variant="primary"
                                style={{ flex: 1 }}
                            />
                            {/* Optional Quiz button */}
                            <Button
                                title="Quiz ▶"
                                onPress={() => navigation.navigate('MCQArena', {
                                    topic: topic.title,
                                    dayNumber: topic.day,
                                    freeAccess: topic.day <= 5
                                })}
                                variant="secondary"
                                style={{ flex: 0.6 }} // Smaller width for quiz
                            />
                        </View>
                    ) : (
                        <Button
                            title="Next Page →"
                            onPress={handleNext}
                            variant="primary"
                            style={{ flex: 1, marginLeft: 8 }}
                        />
                    )}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const markdownStyles = (colors) => ({
    body: { color: colors.text, fontSize: 16 },
    heading3: { color: colors.text, fontWeight: 'bold', marginBottom: 8 },
    heading4: { color: colors.text, fontWeight: '600', marginBottom: 6, marginTop: 10 },
    code_block: { backgroundColor: colors.surface, padding: 10, borderRadius: 8, color: colors.text, fontFamily: 'monospace' },
    paragraph: { marginBottom: 10, lineHeight: 24 },
    list_item: { marginBottom: 6 }
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center'
    },
    paginationIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4
    },
    sectionCard: {
        marginBottom: 20,
        minHeight: 300
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    navContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40
    },
    resourcesContainer: {
        marginTop: 20,
    },
    divider: {
        height: 1,
        marginBottom: 16,
    },
    resourceHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    resourceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 8,
    },
    resourceIcon: {
        width: 30,
        height: 30,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    resourceTitle: {
        fontSize: 14,
        fontWeight: '600',
    },
    resourceType: {
        fontSize: 12,
    }
});

export default TopicDetailScreen;
