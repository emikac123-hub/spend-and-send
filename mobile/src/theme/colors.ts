// Spend & Send - Color Theme
//
// Calm, muted colors that reduce financial anxiety

export const colors = {
  // Primary - Muted Green (cash/safety)
  primary: '#6B9B7A',
  primaryLight: '#8FB89D',
  primaryMuted: '#A8C5B2',
  primaryBackground: '#E8F0EB',

  // Secondary - Calm Blue
  secondary: '#5B7B8C',
  secondaryLight: '#7A9BAC',

  // Backgrounds
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Text
  textPrimary: '#2C3E35',
  textSecondary: '#5A6B62',
  textMuted: '#8A9B92',
  textInverse: '#FFFFFF',

  // Status (Apple-like)
  safe: '#34C759',        // Apple green - under per diem
  caution: '#FF9500',     // Apple orange - approaching limit
  warning: '#FF3B30',     // Apple red - over per diem

  // Money green
  moneyGreen: '#34C759',  // Apple system green

  // Categories
  fourWalls: '#5B7B8C',
  discretionary: '#8B7BA5',

  // Borders & Dividers
  border: '#E0E5E2',
  divider: '#EAEFEC',

  // Chat
  userBubble: '#E8F0EB',
  assistantBubble: '#FFFFFF',

  // Shadows
  shadow: 'rgba(0, 0, 0, 0.08)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  // Font sizes
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 40,

  // Font weights (as strings for React Native)
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export default { colors, spacing, borderRadius, typography };
