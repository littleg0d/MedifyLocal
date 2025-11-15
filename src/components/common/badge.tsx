// src/components/common/Badge.tsx
import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { globalStyles } from "../../../assets/styles";

interface BadgeProps {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  backgroundColor: string;
  textColor: string;
  text: string;
  size?: "small" | "medium" | "large";
  style?: ViewStyle;
}

export function Badge({
  icon,
  iconColor,
  backgroundColor,
  textColor,
  text,
  size = "medium",
  style,
}: BadgeProps) {
  const getIconSize = () => {
    switch (size) {
      case "small":
        return 12;
      case "large":
        return 16;
      default:
        return 14;
    }
  };

  const textStyle = size === "small" 
    ? globalStyles.badgeText 
    : globalStyles.badgeTextMedium;

  return (
    <View style={[globalStyles.badge, { backgroundColor }, style]}>
      {icon && (
        <Ionicons
          name={icon}
          size={getIconSize()}
          color={iconColor || textColor}
          style={styles.icon}
        />
      )}
      <Text style={[textStyle, { color: textColor }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    marginRight: 4,
  },
});