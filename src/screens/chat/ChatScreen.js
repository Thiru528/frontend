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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { chatAPI } from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';

const ChatScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const scrollViewRef = useRef();

  useEffect(() => {
    loadChatHistory();
    // Add welcome message
    addMessage({
      id: Date.now(),
      text: `Hi ${user?.name || 'there'}! 👋 I'm your AI Career Coach. I'm here to help you with:\n\n• Resume and career advice\n• Skill development guidance\n• Job search strategies\n• Interview preparation\n• Study plan recommendations\n\nWhat would you like to know?`,
      isBot: true,
      timestamp: new Date(),
    });
  }, []);

  const loadChatHistory = async () => {
    try {
      const response = await chatAPI.getChatHistory();
      if (response.data.success && response.data.data.length > 0) {
        setMessages(response.data.data);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
    // For now, let's keep the welcome message as default if history is empty
  };

  const addMessage = (message) => {
    setMessages(prev => [...prev, message]);
    // Scroll to bottom after message is added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
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
      // Create context from user profile
      const context = `User: ${user?.name || 'Candidate'}. Target Role: ${user?.targetRole || 'Software Engineer'}. Focus on helping them achieve this role.`;

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

      // Check for Premium Lock
      if (error.response?.status === 403) {
        Alert.alert(
          'Daily Limit Reached 🔒',
          'You have used your 3 free messages for today. Upgrade to Unlimited to keep chatting!',
          [
            { text: 'Okay', style: 'cancel' },
            { text: 'Upgrade', onPress: () => navigation.navigate('Premium') }
          ]
        );
        // Optimistically remove the failed user message or mark error?
        // Simplest is to just reload history or do nothing.
      } else {
        addMessage({
          id: Date.now() + 1,
          text: 'Sorry, I encountered an error. Please try again.',
          isBot: true,
          timestamp: new Date(),
        });
      }
    } finally {
      setLoading(false);
      setTyping(false);
    }
  };



  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const clearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => setMessages([]),
        },
      ]
    );
  };

  const quickQuestions = [
    'How can I improve my resume?',
    'What skills should I learn?',
    'How to prepare for interviews?',
    'Job search strategies?',
    'How to negotiate salary?',
  ];

  const handleQuickQuestion = (question) => {
    setInputText(question);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              AI Career Coach
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {typing ? 'Typing...' : 'Online'}
            </Text>
          </View>

          <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
            <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                Start a conversation with your AI Career Coach
              </Text>
            </View>
          )}

          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.isBot ? styles.botMessageContainer : styles.userMessageContainer,
              ]}
            >
              {message.isBot && (
                <View style={[styles.botAvatar, { backgroundColor: colors.primary }]}>
                  <Ionicons name="happy" size={16} color="#FFFFFF" />
                </View>
              )}

              <View
                style={[
                  styles.messageBubble,
                  {
                    backgroundColor: message.isBot ? colors.surface : colors.primary,
                    maxWidth: '80%',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    {
                      color: message.isBot ? colors.text : '#FFFFFF',
                    },
                  ]}
                >
                  {message.text}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    {
                      color: message.isBot ? colors.textSecondary : 'rgba(255,255,255,0.7)',
                    },
                  ]}
                >
                  {formatTime(message.timestamp)}
                </Text>
              </View>
            </View>
          ))}

          {typing && (
            <View style={[styles.messageContainer, styles.botMessageContainer]}>
              <View style={[styles.botAvatar, { backgroundColor: colors.primary }]}>
                <Ionicons name="happy" size={16} color="#FFFFFF" />
              </View>
              <View style={[styles.messageBubble, { backgroundColor: colors.surface }]}>
                <View style={styles.typingIndicator}>
                  <View style={[styles.typingDot, { backgroundColor: colors.textSecondary }]} />
                  <View style={[styles.typingDot, { backgroundColor: colors.textSecondary }]} />
                  <View style={[styles.typingDot, { backgroundColor: colors.textSecondary }]} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Limit Banner */}
        {!user?.isPremium && (
          <View style={{ backgroundColor: colors.surface, padding: 8, alignItems: 'center', borderTopWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              Daily Free Limit: {3 - (user?.dailyChatCount || 0)} messages left
            </Text>
          </View>
        )}

        {/* Quick Questions */}
        {messages.length <= 1 && (3 - (user?.dailyChatCount || 0)) > 0 && (
          <View style={styles.quickQuestionsContainer}>
            <Text style={[styles.quickQuestionsTitle, { color: colors.textSecondary }]}>
              Quick questions:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {quickQuestions.map((question, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleQuickQuestion(question)}
                  style={[
                    styles.quickQuestionButton,
                    { backgroundColor: colors.surface, borderColor: colors.border }
                  ]}
                >
                  <Text style={[styles.quickQuestionText, { color: colors.text }]}>
                    {question}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
          <View style={styles.inputWrapper}>
            <Input
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask me anything about your career..."
              multiline
              style={styles.textInput}
              inputStyle={styles.textInputStyle}
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!inputText.trim() || loading}
              style={[
                styles.sendButton,
                {
                  backgroundColor: inputText.trim() && !loading ? colors.primary : colors.textSecondary,
                }
              ]}
            >
              <Ionicons
                name={loading ? 'hourglass-outline' : 'send'}
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  clearButton: {
    padding: 8,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  quickQuestionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  quickQuestionsTitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  quickQuestionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  quickQuestionText: {
    fontSize: 12,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    marginRight: 12,
    marginVertical: 0,
  },
  textInputStyle: {
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
});

export default ChatScreen;