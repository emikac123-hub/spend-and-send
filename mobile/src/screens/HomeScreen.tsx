// Spend & Send - Home Screen
//
// Main chat interface with collapsible per diem header

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PerDiemHeader } from '../components/PerDiemHeader';
import { ChatBubble } from '../components/ChatBubble';
import { ChatInput } from '../components/ChatInput';
import { useTheme } from '../theme';
import { budgetService } from '../services/budgetService';

// Message type for chat
interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  text: "Hi! I'm Spend & Send, your budgeting companion. Log your spending by typing something like \"I spent $12 on lunch\" or ask me how you're doing this pay period.",
  isUser: false,
  timestamp: new Date(),
};

export const HomeScreen: React.FC = () => {
  const { colors, spacing, typography } = useTheme();
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [perDiemData, setPerDiemData] = useState({
    perDiem: 0,
    remaining: 0,
    daysUntilPayday: 0,
  });
  const flatListRef = useRef<FlatList>(null);

  // Load per diem data from database
  const loadPerDiemData = useCallback(async () => {
    try {
      const status = await budgetService.getTodaysStatus();
      setPerDiemData({
        perDiem: status.perDiem,
        remaining: status.remaining,
        daysUntilPayday: status.daysUntilPayday,
      });
    } catch (error) {
      console.error('Error loading per diem data:', error);
      // If no pay period exists, show default values
      setPerDiemData({
        perDiem: 0,
        remaining: 0,
        daysUntilPayday: 0,
      });
    }
  }, []);

  // Load data on mount and when screen comes into focus
  useEffect(() => {
    loadPerDiemData();
  }, [loadPerDiemData]);

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
      // Use budgetService which handles database persistence
      const response = await budgetService.processMessage(text);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Reload per diem data after transaction is saved
      if (response.action === 'log_transaction') {
        await loadPerDiemData();
      }
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
  }, [loadPerDiemData]);

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Collapsible Per Diem Header */}
      <PerDiemHeader
        perDiem={perDiemData.perDiem}
        remaining={perDiemData.remaining}
        daysUntilPayday={perDiemData.daysUntilPayday}
        isCollapsed={isHeaderCollapsed}
        onToggle={toggleHeader}
      />

      {/* Chat Messages */}
      <FlatList
        ref={flatListRef}
        style={styles.chatContainer}
        contentContainerStyle={{ paddingVertical: spacing.md }}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>Thinking...</Text>
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
  },
  chatContainer: {
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
  },
});

export default HomeScreen;
