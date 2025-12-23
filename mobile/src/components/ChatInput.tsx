// Spend & Send - Chat Input Component

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../theme';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  isLoading = false,
  placeholder = 'Log spending or ask a question...',
}) => {
  const { colors, spacing, borderRadius, typography } = useTheme();
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage('');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[
        styles.container,
        { 
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          paddingBottom: spacing.lg,
        }
      ]}>
        <View style={[
          styles.inputContainer,
          { 
            backgroundColor: colors.background,
            borderRadius: borderRadius.xl,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
          }
        ]}>
          <TextInput
            style={[
              styles.input,
              { 
                fontSize: typography.md,
                color: colors.textPrimary,
                paddingVertical: spacing.sm,
              }
            ]}
            value={message}
            onChangeText={setMessage}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
            editable={!isLoading}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { 
                backgroundColor: message.trim() && !isLoading 
                  ? colors.primaryBackground 
                  : colors.background,
              }
            ]}
            onPress={handleSend}
            disabled={!message.trim() || isLoading}
          >
            <SendIcon color={message.trim() && !isLoading ? colors.primary : colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

// Simple send icon component
const SendIcon: React.FC<{ color: string }> = ({ color }) => (
  <View style={styles.sendIcon}>
    <View style={[styles.arrow, { borderLeftColor: color }]} />
  </View>
);

const styles = StyleSheet.create({
  container: {},
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: 44,
  },
  input: {
    flex: 1,
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 2,
  },
});

export default ChatInput;

