// Spend & Send - Home Screen
//
// Main chat interface with collapsible per diem header

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Text,
} from 'react-native';
import { PerDiemHeader } from '../components/PerDiemHeader';
import { ChatBubble } from '../components/ChatBubble';
import { ChatInput } from '../components/ChatInput';
import { colors, spacing, typography } from '../theme/colors';
import { claudeService } from '../services/claudeService';

// Message type for chat
interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Demo data - replace with real data from budgetService
const DEMO_PER_DIEM = {
  perDiem: 45.00,
  remaining: 42.50,
  daysUntilPayday: 12,
};

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  text: "Hi! I'm Spend & Send, your budgeting companion. Log your spending by typing something like \"I spent $12 on lunch\" or ask me how you're doing this pay period.",
  isUser: false,
  timestamp: new Date(),
};

export const HomeScreen: React.FC = () => {
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Toggle header collapse
  const toggleHeader = useCallback(() => {
    setIsHeaderCollapsed((prev) => !prev);
  }, []);

  // Send message handler
  const handleSendMessage = useCallback(async (text: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Call the real Claude API
      const response = await claudeService.sendMessage(text);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I had trouble processing that. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, []);

  // Render chat message
  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => (
    <ChatBubble
      message={item.text}
      isUser={item.isUser}
      timestamp={formatTime(item.timestamp)}
    />
  ), []);

  // Key extractor
  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Collapsible Per Diem Header */}
      <PerDiemHeader
        perDiem={DEMO_PER_DIEM.perDiem}
        remaining={DEMO_PER_DIEM.remaining}
        daysUntilPayday={DEMO_PER_DIEM.daysUntilPayday}
        isCollapsed={isHeaderCollapsed}
        onToggle={toggleHeader}
      />

      {/* Chat Messages */}
      <FlatList
        ref={flatListRef}
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContent}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          ) : null
        }
      />

      {/* Chat Input */}
      <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
    </SafeAreaView>
  );
};

// Helper: Format time
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    paddingVertical: spacing.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: typography.sm,
  },
});

export default HomeScreen;
