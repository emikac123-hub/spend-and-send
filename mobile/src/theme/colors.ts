// Spend & Send - Color Theme
//
// Calm, muted colors that reduce financial anxiety
// Supports both light and dark modes

export const lightColors = {
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

export const darkColors = {
  // Primary - Muted Green (slightly brighter for dark mode)
  primary: '#7AAF8A',
  primaryLight: '#8FB89D',
  primaryMuted: '#5A7A64',
  primaryBackground: '#1A2E22',

  // Secondary - Calm Blue
  secondary: '#6B8B9C',
  secondaryLight: '#7A9BAC',

  // Backgrounds
  background: '#0D1110',
  surface: '#1A1F1C',
  surfaceElevated: '#242A26',

  // Text
  textPrimary: '#E8F0EB',
  textSecondary: '#A8B5AD',
  textMuted: '#6B7A72',
  textInverse: '#1A1F1C',

  // Status (Apple-like - same in dark mode)
  safe: '#30D158',        // Apple green dark mode
  caution: '#FF9F0A',     // Apple orange dark mode
  warning: '#FF453A',     // Apple red dark mode

  // Money green
  moneyGreen: '#30D158',  // Apple system green dark mode

  // Categories
  fourWalls: '#6B8B9C',
  discretionary: '#9B8BB5',

  // Borders & Dividers
  border: '#2A3530',
  divider: '#242A26',

  // Chat
  userBubble: '#1A2E22',
  assistantBubble: '#242A26',

  // Shadows
  shadow: 'rgba(0, 0, 0, 0.3)',
};

// Type for colors object
export type Colors = typeof lightColors;

// Default export (will be overridden by context)
export const colors = lightColors;

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

export default { lightColors, darkColors, colors, spacing, borderRadius, typography };
