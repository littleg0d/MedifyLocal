import { StyleSheet, Platform } from "react-native";

// Colores del tema
export const colors = {
  // Principales
  primary: "#22C55E",
  primaryLight: "#38E07B",
  primaryDark: "#16A34A",
  
  // Backgrounds
  background: "#F6F8F7",
  backgroundDark: "#122017",
  surface: "#FFFFFF",
  surfaceHover: "#F9FAFB",
  
  // Textos
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",
  textLight: "#111714",
  textMuted: "#648772",
  textMutedDark: "#A0B5AB",
  
  // Bordes
  border: "#E5E7EB",
  borderLight: "#F3F4F6",
  
  // Estados
  success: "#22C55E",
  successLight: "#D1FAE5",
  successDark: "#065F46",
  
  warning: "#FEF3C7",
  warningDark: "#92400E",
  
  error: "#EF4444",
  errorLight: "#FEE2E2",
  errorDark: "#991B1B",
  errorBorder: "#FCA5A5",
  
  info: "#3B82F6",
  
  // Grises
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",
};

// Fuente por defecto
const defaultFontFamily = Platform.select({
  ios: "System",
  android: "Roboto",
  default: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
});

// Estilos globales compartidos
export const globalStyles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  scrollView: {
    flex: 1,
    padding: 16,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  
  // Headers
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.background,
  },
  
  headerWithBorder: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  
  // Títulos
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
    fontFamily: defaultFontFamily,
  },
  
  titleMedium: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textLight,
    fontFamily: defaultFontFamily,
  },
  
  titleSmall: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    fontFamily: defaultFontFamily,
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 16,
    fontFamily: defaultFontFamily,
  },
  
  // Subtítulos y textos
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    fontFamily: defaultFontFamily,
  },
  
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textMuted,
    marginTop: 16,
    textAlign: "center",
    fontFamily: defaultFontFamily,
  },
  
  emptyText: {
    fontSize: 14,
    color: colors.textMutedDark,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
    fontFamily: defaultFontFamily,
  },
  
  loadingText: {
    marginTop: 12,
    color: colors.textMuted,
    fontSize: 16,
    fontFamily: defaultFontFamily,
  },
  
  // Inputs
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontFamily: defaultFontFamily,
  },
  
  inputDisabled: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  inputError: {
    borderColor: colors.errorBorder,
    backgroundColor: colors.errorLight,
  },
  
  // Labels
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.gray700,
    marginBottom: 8,
    fontFamily: defaultFontFamily,
  },
  
  // Buttons
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  
  primaryButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: defaultFontFamily,
  },
  
  secondaryButton: {
    backgroundColor: colors.gray100,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: "600",
    fontFamily: defaultFontFamily,
  },
  
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.errorLight,
    backgroundColor: "#FEF2F2",
  },
  
  dangerButtonText: {
    color: colors.error,
    fontWeight: "600",
    fontSize: 16,
    fontFamily: defaultFontFamily,
  },
  
  buttonPressed: {
    opacity: 0.7,
  },
  
  buttonDisabled: {
    opacity: 0.5,
  },
  
  // Cards
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  
  cardSimple: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  
  cardPressed: {
    opacity: 0.7,
  },
  
  // Badges
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  badgePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: defaultFontFamily,
  },
  
  badgeTextMedium: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: defaultFontFamily,
  },
  
  // Layout helpers
  row: {
    flexDirection: "row",
    gap: 12,
  },
  
  section: {
    marginBottom: 20,
  },
  
  halfWidth: {
    flex: 1,
  },
  
  spacer: {
    height: 80,
  },
  
  spacerSmall: {
    height: 40,
  },
  
  // Error containers
  errorContainer: {
    width: "100%",
    backgroundColor: colors.errorLight,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.errorBorder,
  },
  
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    fontFamily: defaultFontFamily,
  },
  
  // Dividers
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
    marginTop: 8,
  },
  
  dividerText: {
    color: colors.textTertiary,
    fontFamily: defaultFontFamily,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "90%",
  },
  
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    fontFamily: defaultFontFamily,
  },
  
  // Notification button
  notificationButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  
  notificationDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  
  // Icon containers
  iconContainer: {
    marginBottom: 20,
  },
  
  iconContainerRound: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  
  // Toggle switch
  toggle: {
    width: 51,
    height: 31,
    borderRadius: 16,
    backgroundColor: colors.gray300,
    padding: 2,
    justifyContent: "center",
  },
  
  toggleActive: {
    backgroundColor: colors.primary,
    justifyContent: "flex-end",
  },
  
  toggleThumb: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  
  toggleThumbActive: {
    alignSelf: "flex-end",
  },
});

// Estilos de tipografía
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: "700" as const,
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: "700" as const,
    lineHeight: 28,
  },
  h5: {
    fontSize: 18,
    fontWeight: "600" as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: "600" as const,
    lineHeight: 24,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 20,
  },
  smallBold: {
    fontSize: 14,
    fontWeight: "600" as const,
    lineHeight: 20,
  },
  tiny: {
    fontSize: 12,
    fontWeight: "400" as const,
    lineHeight: 16,
  },
};

// Espaciados consistentes
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// Border radius consistentes
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};