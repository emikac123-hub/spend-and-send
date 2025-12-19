// Spend & Send - Chat Bubble Component

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme/colors';

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: string;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isUser,
  timestamp,
}) => {
  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.message, isUser ? styles.userMessage : styles.assistantMessage]}>
          {message}
        </Text>
      </View>
      {timestamp && (
        <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.assistantTimestamp]}>
          {timestamp}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
    marginHorizontal: spacing.md,
    maxWidth: '80%',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  userBubble: {
    backgroundColor: colors.userBubble,
    borderBottomRightRadius: spacing.xs,
  },
  assistantBubble: {
    backgroundColor: colors.assistantBubble,
    borderBottomLeftRadius: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  message: {
    fontSize: typography.md,
    lineHeight: 22,
  },
  userMessage: {
    color: colors.textPrimary,
  },
  assistantMessage: {
    color: colors.textPrimary,
  },
  timestamp: {
    fontSize: typography.xs,
    marginTop: spacing.xs,
  },
  userTimestamp: {
    color: colors.textMuted,
    textAlign: 'right',
  },
  assistantTimestamp: {
    color: colors.textMuted,
    textAlign: 'left',
  },
});

export default ChatBubble;
