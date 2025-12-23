// Spend & Send - Per Diem Header Component
//
// Elegant, Apple-like collapsible header showing today's per diem status
// Swipe up to hide, tap to expand

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../theme';

interface PerDiemHeaderProps {
  perDiem: number;
  remaining: number;
  daysUntilPayday: number;
  isCollapsed: boolean;
  onToggle: () => void;
}

const HEADER_HEIGHT = 200;
const COLLAPSED_HEIGHT = 56;

export const PerDiemHeader: React.FC<PerDiemHeaderProps> = ({
  perDiem,
  remaining,
  daysUntilPayday,
  isCollapsed,
  onToggle,
}) => {
  const { colors, isDark } = useTheme();
  const animatedHeight = useRef(new Animated.Value(isCollapsed ? COLLAPSED_HEIGHT : HEADER_HEIGHT)).current;
  const animatedOpacity = useRef(new Animated.Value(isCollapsed ? 0 : 1)).current;
  const collapsedOpacity = useRef(new Animated.Value(isCollapsed ? 1 : 0)).current;

  // Animate on collapse/expand
  useEffect(() => {
    Animated.parallel([
      Animated.spring(animatedHeight, {
        toValue: isCollapsed ? COLLAPSED_HEIGHT : HEADER_HEIGHT,
        useNativeDriver: false,
        friction: 12,
        tension: 40,
      }),
      Animated.timing(animatedOpacity, {
        toValue: isCollapsed ? 0 : 1,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(collapsedOpacity, {
        toValue: isCollapsed ? 1 : 0,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isCollapsed]);

  // Pan responder for swipe gesture
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -30 && !isCollapsed) {
          onToggle();
        } else if (gestureState.dy > 30 && isCollapsed) {
          onToggle();
        }
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.container,
        { 
          height: animatedHeight,
          backgroundColor: colors.surface,
          shadowColor: isDark ? '#000' : '#000',
          shadowOpacity: isDark ? 0.3 : 0.08,
        }
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        style={styles.touchable}
        onPress={onToggle}
        activeOpacity={0.95}
      >
        {/* Collapsed View */}
        <Animated.View style={[styles.collapsedContent, { opacity: collapsedOpacity }]}>
          <View style={styles.collapsedInner}>
            <Text style={[styles.collapsedLabel, { color: colors.textSecondary }]}>Today</Text>
            <Text style={[styles.collapsedAmount, { color: colors.moneyGreen }]}>${remaining.toFixed(2)}</Text>
            <Text style={[styles.collapsedOf, { color: colors.textMuted }]}>left</Text>
          </View>
          <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
        </Animated.View>

        {/* Expanded View */}
        <Animated.View style={[styles.expandedContent, { opacity: animatedOpacity }]}>
          {/* Top label */}
          <Text style={[styles.topLabel, { color: colors.textSecondary }]}>Today's Budget</Text>
          
          {/* Main amount - GREEN */}
          <View style={styles.amountContainer}>
            <Text style={[styles.currencySymbol, { color: colors.moneyGreen }]}>$</Text>
            <Text style={[styles.mainAmount, { color: colors.moneyGreen }]}>{remaining.toFixed(2)}</Text>
          </View>
          
          {/* Subtitle */}
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            of ${perDiem.toFixed(2)} per day
          </Text>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Bottom row */}
          <View style={styles.bottomRow}>
            <View style={styles.bottomItem}>
              <Text style={[styles.bottomValue, { color: colors.textPrimary }]}>{daysUntilPayday}</Text>
              <Text style={[styles.bottomLabel, { color: colors.textMuted }]}>days left</Text>
            </View>
          </View>

          {/* Collapse hint */}
          <View style={styles.hintContainer}>
            <View style={[styles.hintPill, { backgroundColor: colors.border }]} />
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  touchable: {
    flex: 1,
  },
  
  // Collapsed styles
  collapsedContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: COLLAPSED_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  collapsedInner: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  collapsedLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  collapsedAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  collapsedOf: {
    fontSize: 15,
    fontWeight: '400',
  },
  chevron: {
    fontSize: 24,
    transform: [{ rotate: '90deg' }],
  },

  // Expanded styles
  expandedContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
    paddingBottom: 12,
  },
  topLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '600',
    marginTop: 8,
    marginRight: 2,
  },
  mainAmount: {
    fontSize: 56,
    fontWeight: '700',
    letterSpacing: -2,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    marginTop: 2,
  },
  divider: {
    width: 40,
    height: 1,
    marginVertical: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  bottomItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  bottomValue: {
    fontSize: 17,
    fontWeight: '600',
  },
  bottomLabel: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
  },
  bottomDivider: {
    width: 1,
    height: 28,
  },
  hintContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintPill: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
});

export default PerDiemHeader;

