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
import { colors, spacing, borderRadius, typography } from '../theme/colors';

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
  const animatedHeight = useRef(new Animated.Value(isCollapsed ? COLLAPSED_HEIGHT : HEADER_HEIGHT)).current;
  const animatedOpacity = useRef(new Animated.Value(isCollapsed ? 0 : 1)).current;
  const collapsedOpacity = useRef(new Animated.Value(isCollapsed ? 1 : 0)).current;

  // Determine status
  const getStatusText = () => {
    const ratio = remaining / perDiem;
    if (ratio >= 1) return 'On track';
    if (ratio > 0.5) return 'Pacing well';
    if (ratio > 0.2) return 'Getting tight';
    if (ratio > 0) return 'Almost there';
    return 'Over for today';
  };

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
      style={[styles.container, { height: animatedHeight }]}
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
            <Text style={styles.collapsedLabel}>Today</Text>
            <Text style={styles.collapsedAmount}>${remaining.toFixed(2)}</Text>
            <Text style={styles.collapsedOf}>left</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Animated.View>

        {/* Expanded View */}
        <Animated.View style={[styles.expandedContent, { opacity: animatedOpacity }]}>
          {/* Top label */}
          <Text style={styles.topLabel}>Today's Budget</Text>
          
          {/* Main amount - GREEN */}
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <Text style={styles.mainAmount}>{remaining.toFixed(2)}</Text>
          </View>
          
          {/* Subtitle */}
          <Text style={styles.subtitle}>
            of ${perDiem.toFixed(2)} per day
          </Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Bottom row */}
          <View style={styles.bottomRow}>
            <View style={styles.bottomItem}>
              <Text style={styles.bottomValue}>{daysUntilPayday}</Text>
              <Text style={styles.bottomLabel}>days left</Text>
            </View>
            <View style={styles.bottomDivider} />
            <View style={styles.bottomItem}>
              <Text style={styles.bottomValue}>{getStatusText()}</Text>
              <Text style={styles.bottomLabel}>status</Text>
            </View>
          </View>

          {/* Collapse hint */}
          <View style={styles.hintContainer}>
            <View style={styles.hintPill} />
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
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
    color: colors.textSecondary,
  },
  collapsedAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#34C759', // Apple green
  },
  collapsedOf: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.textMuted,
  },
  chevron: {
    fontSize: 24,
    color: colors.textMuted,
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
    color: colors.textSecondary,
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
    color: '#34C759', // Apple green
    marginTop: 8,
    marginRight: 2,
  },
  mainAmount: {
    fontSize: 56,
    fontWeight: '700',
    color: '#34C759', // Apple green
    letterSpacing: -2,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: colors.border,
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
    color: colors.textPrimary,
  },
  bottomLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textMuted,
    marginTop: 2,
  },
  bottomDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
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
    backgroundColor: colors.border,
  },
});

export default PerDiemHeader;
