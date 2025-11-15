import React from "react";
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, Pressable} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { globalStyles, colors } from "../../../assets/styles";

// ============================================================================
// LOADING SCREEN
// ============================================================================

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Cargando..." }: LoadingScreenProps) {
  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={globalStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={globalStyles.loadingText}>{message}</Text>
      </View>
    </SafeAreaView>
  );
}

// ============================================================================
// ERROR SCREEN
// ============================================================================

interface ErrorScreenProps {
  title?: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  header?: React.ReactNode;
}

export function ErrorScreen({
  title = "Error de Conexión",
  message = "No pudimos cargar los datos. Por favor, revisa tu conexión.",
  icon = "cloud-offline-outline",
  header,
}: ErrorScreenProps) {
  return (
    <SafeAreaView style={globalStyles.container} edges={["top"]}>
      {header}
      <View style={globalStyles.emptyContainer}>
        <Ionicons name={icon} size={64} color={colors.errorDark} />
        <Text style={globalStyles.emptyTitle}>{title}</Text>
        <Text style={globalStyles.emptyText}>{message}</Text>
      </View>
    </SafeAreaView>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  iconColor?: string;
}

export function EmptyState({
  icon,
  title,
  message,
  iconColor = colors.textMutedDark,
}: EmptyStateProps) {
  return (
    <View style={globalStyles.emptyContainer}>
      <Ionicons name={icon} size={64} color={iconColor} />
      <Text style={globalStyles.emptyTitle}>{title}</Text>
      <Text style={globalStyles.emptyText}>{message}</Text>
    </View>
  );
}

// ============================================================================
// SIMPLE HEADER (centrado con placeholders)
// ============================================================================

interface SimpleHeaderProps {
  title: string;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
}

export function SimpleHeader({ 
  title, 
  rightElement, 
  leftElement 
}: SimpleHeaderProps) {
  return (
    <View style={globalStyles.header}>
      {leftElement || <View style={styles.placeholder} />}
      <Text style={globalStyles.titleMedium}>{title}</Text>
      {rightElement || <View style={styles.placeholder} />}
    </View>
  );
}

// ============================================================================
// HEADER WITH BACK BUTTON
// ============================================================================

interface HeaderWithBackProps {
  title: string;
  onBack: () => void;
  rightElement?: React.ReactNode;
}

export function HeaderWithBack({ title, onBack, rightElement }: HeaderWithBackProps) {
  return (
    <View style={globalStyles.headerWithBorder}>
      <Pressable onPress={onBack} style={styles.iconButton}>
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </Pressable>
      <Text style={globalStyles.titleSmall}>{title}</Text>
      {rightElement || <View style={styles.placeholder} />}
    </View>
  );
}

// ============================================================================
// SCREEN WRAPPER (maneja loading, error, y contenido)
// ============================================================================

interface ScreenWrapperProps {
  loading: boolean;
  error?: Error | null;
  loadingMessage?: string;
  errorTitle?: string;
  errorMessage?: string;
  header?: React.ReactNode;
  children: React.ReactNode;
}

export function ScreenWrapper({
  loading,
  error,
  loadingMessage,
  errorTitle,
  errorMessage,
  header,
  children,
}: ScreenWrapperProps) {
  if (loading) {
    return <LoadingScreen message={loadingMessage} />;
  }

  if (error) {
    return (
      <ErrorScreen
        title={errorTitle}
        message={errorMessage}
        header={header}
      />
    );
  }

  return <>{children}</>;
}

// ============================================================================
// SCREEN CONTAINER (wrapper genérico con SafeAreaView)
// ============================================================================

interface ScreenContainerProps {
  children: React.ReactNode;
  edges?: Array<'top' | 'bottom' | 'left' | 'right'>;
}

export function ScreenContainer({ 
  children, 
  edges = ["top"] 
}: ScreenContainerProps) {
  return (
    <SafeAreaView style={globalStyles.container} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

// ============================================================================
// CONTENT SCROLL VIEW (ScrollView con padding y spacer automático)
// ============================================================================

interface ContentScrollViewProps {
  children: React.ReactNode;
  showsVerticalScrollIndicator?: boolean;
}

export function ContentScrollView({ 
  children,
  showsVerticalScrollIndicator = false 
}: ContentScrollViewProps) {
  return (
    <ScrollView 
      style={styles.scrollView}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
    >
      {children}
      <View style={globalStyles.spacer} />
    </ScrollView>
  );
}

// ============================================================================
// LIST CONTAINER (contenedor con padding y gap para listas)
// ============================================================================

interface ListContainerProps {
  children: React.ReactNode;
  padding?: number;
  gap?: number;
}

export function ListContainer({ 
  children, 
  padding = 16, 
  gap = 16 
}: ListContainerProps) {
  return (
    <View style={[styles.listContainer, { padding, gap }]}>
      {children}
    </View>
  );
}

// ============================================================================
// ESTILOS
// ============================================================================



const styles = StyleSheet.create({
  placeholder: {
    width: 48,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});