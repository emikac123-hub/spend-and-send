// Spend & Send - Chat Bubble Component

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

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
  const { colors, spacing, borderRadius, typography } = useTheme();

  return (
    <View style={[
      styles.container,
      { marginVertical: spacing.xs, marginHorizontal: spacing.md },
      isUser ? styles.userContainer : styles.assistantContainer
    ]}>
      <View style={[
        styles.bubble,
        { 
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.lg,
        },
        isUser 
          ? { backgroundColor: colors.userBubble, borderBottomRightRadius: spacing.xs }
          : { 
              backgroundColor: colors.assistantBubble, 
              borderBottomLeftRadius: spacing.xs,
              borderWidth: 1,
              borderColor: colors.border,
            }
      ]}>
        <Text style={[
          styles.message,
          { fontSize: typography.md, color: colors.textPrimary }
        ]}>
          {message}
        </Text>
      </View>
      {timestamp && (
        <Text style={[
          styles.timestamp,
          { 
            fontSize: typography.xs, 
            marginTop: spacing.xs,
            color: colors.textMuted,
            textAlign: isUser ? 'right' : 'left',
          }
        ]}>
          {timestamp}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: '80%',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {},
  message: {
    lineHeight: 22,
  },
  timestamp: {},
});

export default ChatBubble;

