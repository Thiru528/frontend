import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { chatAPI } from '../../services/api';
import Input from '../../components/Input';
import Logo from '../../components/Logo';

const ChatScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const flatListRef = useRef();

  useEffect(() => {
    loadChatHistory();
    // Default welcome if empty
    if (messages.length === 0) {
      // We use a timeout to not conflict with state updates
      setTimeout(() => {
        if (messages.length === 0) {
          addMessage({
            id: 'welcome',
            text: `Hi ${user?.name || 'there'}! 👋 I'm your AI Career Coach.\n\nAsk me about:\n• Resume improvement\n• Interview prep\n• Salary negotiation\n• Skill gaps`,
            isBot: true,
            timestamp: new Date(),
          }, false);
        }
      }, 500);
    }
  }, []);

  const loadChatHistory = async () => {
    try {
      const response = await chatAPI.getChatHistory();
      if (response.data.success && response.data.data.length > 0) {
        // Filter out empty messages to prevent UI bugs
        const validMessages = response.data.data.filter(msg => msg.text && msg.text.trim().length > 0);
        setMessages(validMessages);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const addMessage = (message, shouldScroll = true) => {
    // Guard against empty messages
    if (!message || !message.text || !message.text.trim()) return;

    setMessages(prev => [...prev, message]);
    if (shouldScroll) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputText.trim(),
      isBot: false,
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInputText('');
    setLoading(true);
    setTyping(true);

    try {
      const context = `User: ${user?.name || 'Candidate'}. Target Role: ${user?.targetRole || 'Software Engineer'}. Focus on actionable career advice.`;
      const response = await chatAPI.sendMessage(userMessage.text, context);

      if (response.data.success) {
        addMessage({
          id: Date.now() + 1,
          text: response.data.data.text,
          isBot: true,
          timestamp: new Date(),
        });
      } else {
        throw new Error(response.data.message || 'Failed to get response');
      }

    } catch (error) {
      console.error('Error sending message:', error);
      if (error.response?.status === 403) {
        setLimitModalVisible(true);
      } else {
        addMessage({
          id: Date.now() + 1,
          text: "I'm having trouble connecting to the AI brain right now. Please try again.",
          isBot: true,
          timestamp: new Date(),
        });
      }
    } finally {
      setLoading(false);
      setTyping(false);
    }
  };

  const quickQuestions = [
    { text: 'Improve my resume 📄', prompt: 'How can I improve my resume?' },
    { text: 'Salary Tips 💰', prompt: 'What skills result in high salary?' },
    { text: 'Mock Interview 🎤', prompt: 'Prepare me for a React interview.' },
    { text: 'System Design 🏗️', prompt: 'Explain System Design basics.' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            {/* Use Logo Component */}
            <Logo size={32} style={{ marginRight: 10 }} />
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>AI Career Coach</Text>
              <View style={styles.statusRow}>
                <View style={styles.onlineDot} />
                <Text style={[styles.headerStatus, { color: colors.textSecondary }]}>Online</Text>
              </View>
            </View>
          </View>
          {/* Empty View to balance back button */}
          <View style={{ width: 40, flexDirection: 'row', justifyContent: 'flex-end' }}>
            <TouchableOpacity onPress={() => {
              Alert.alert(
                'Clear History',
                'Delete all messages?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await chatAPI.clearHistory();
                        setMessages([]);
                      } catch (e) { console.error(e); }
                    }
                  }
                ]
              );
            }} style={{ padding: 4 }}>
              <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item: msg }) => {
            // CRITICAL FIX: Do not render empty messages
            if (!msg.text || !msg.text.trim()) return null;

            return (
              <View style={[
                styles.messageRow,
                msg.isBot ? styles.botRow : styles.userRow
              ]}>
                {msg.isBot && (
                  <View style={[styles.avatar, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="sparkles" size={16} color={colors.primary} />
                  </View>
                )}

                {msg.isBot ? (
                  <View style={[styles.bubble, styles.botBubble, { backgroundColor: colors.surface, borderRadius: 16 }]}>
                    <Text style={[styles.messageText, { color: colors.text }]}>{msg.text}</Text>
                  </View>
                ) : (
                  <LinearGradient
                    colors={['#6366F1', '#4F46E5']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={[styles.bubble, styles.userBubble]}
                  >
                    <Text style={[styles.messageText, { color: '#FFF' }]}>{msg.text}</Text>
                  </LinearGradient>
                )}
              </View>
            );
          }}
          ListFooterComponent={
            <>
              {typing && (
                <View style={[styles.messageRow, styles.botRow]}>
                  <View style={[styles.avatar, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="sparkles" size={16} color={colors.primary} />
                  </View>
                  <View style={[styles.bubble, styles.botBubble, { backgroundColor: colors.surface }]}>
                    <View style={styles.typingDots}>
                      <View style={[styles.dot, { backgroundColor: colors.textSecondary }]} />
                      <View style={[styles.dot, { backgroundColor: colors.textSecondary, opacity: 0.6 }]} />
                      <View style={[styles.dot, { backgroundColor: colors.textSecondary, opacity: 0.3 }]} />
                    </View>
                  </View>
                </View>
              )}
              {/* Spacer for bottom input */}
              <View style={{ height: 10 }} />
            </>
          }
        />

        {/* Quick Questions Chips */}
        {!typing && (
          <View style={styles.quickScroll}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {quickQuestions.map((q, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setInputText(q.prompt)}
                >
                  <LinearGradient
                    colors={[colors.surface, colors.surface]}
                    style={[styles.chip, { borderColor: colors.border }]}
                  >
                    <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '500' }}>{q.text}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input Area */}
        <View style={[styles.inputArea, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <View style={[styles.inputWrapper, { backgroundColor: colors.background }]}>
            <Input
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask guidance..."
              style={styles.inputField}
              containerStyle={{ marginBottom: 0, flex: 1 }}
              inputStyle={{ borderWidth: 0, backgroundColor: 'transparent' }}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: (inputText.trim() || loading) ? colors.primary : colors.textSecondary }]}
            disabled={!inputText.trim() && !loading}
            onPress={sendMessage}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Ionicons name="paper-plane" size={20} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
      <Modal
        animationType="fade"
        transparent={true}
        visible={limitModalVisible}
        onRequestClose={() => setLimitModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '85%', backgroundColor: colors.surface, borderRadius: 24, padding: 0, overflow: 'hidden', elevation: 10 }}>
            <LinearGradient
              colors={[colors.premium, '#7F3DB5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 20, alignItems: 'center', justifyContent: 'center' }}
            >
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <Ionicons name="lock-closed" size={32} color="#FFF" />
              </View>
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#FFF', textAlign: 'center' }}>
                Daily Limit Reached
              </Text>
            </LinearGradient>

            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, color: colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 24 }}>
                You've hit your free message limit for today. Upgrade to <Text style={{ fontWeight: 'bold', color: colors.premium }}>CareerLoop Pro</Text> for unlimited coaching and advanced AI features.
              </Text>

              <TouchableOpacity
                style={{ width: '100%', backgroundColor: colors.premium, paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 12, shadowColor: colors.premium, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
                onPress={() => {
                  setLimitModalVisible(false);
                  navigation.navigate('Premium');
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#FFF' }}>
                  Unlock Unlimited Access 🚀
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                padding={10}
                onPress={() => setLimitModalVisible(false)}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary }}>
                  Maybe Later
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    zIndex: 10
  },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontWeight: 'bold', fontSize: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 6 },
  headerStatus: { fontSize: 12 },

  messagesContent: { padding: 16, paddingBottom: 20, flexGrow: 1 },

  messageRow: { flexDirection: 'row', marginBottom: 16, width: '100%' },
  botRow: { justifyContent: 'flex-start' },
  userRow: { justifyContent: 'flex-end' },

  avatar: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8, marginTop: 4
  },

  bubble: {
    padding: 14,
    borderRadius: 18,
    maxWidth: '80%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 10
  },
  botBubble: { borderTopLeftRadius: 4 },
  userBubble: { borderBottomRightRadius: 4 },

  messageText: { fontSize: 15, lineHeight: 22 },

  typingDots: { flexDirection: 'row', alignItems: 'center', width: 40, justifyContent: 'space-between', padding: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },

  quickScroll: { paddingHorizontal: 10, paddingBottom: 10, height: 50 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, marginRight: 8,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 3, elevation: 2
  },

  inputArea: {
    padding: 12, borderTopWidth: 1,
    flexDirection: 'row', alignItems: 'center',
    gap: 12
  },
  inputWrapper: {
    flex: 1, borderRadius: 24, paddingHorizontal: 4,
  },
  inputField: {
    marginBottom: 0
  },
  sendBtn: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 4, elevation: 4
  }
});

export default ChatScreen;