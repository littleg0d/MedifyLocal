import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { globalStyles, colors } from "../../../assets/styles";

interface PaymentHeaderProps {
  onGoBack: () => void;
}

export function PaymentHeader({ onGoBack }: PaymentHeaderProps) {
  return (
    <View style={globalStyles.headerWithBorder}>
      <Pressable onPress={onGoBack} style={styles.iconButton}>
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </Pressable>
      <Text style={globalStyles.titleSmall}>Confirmar Pago</Text>
      <View style={styles.placeholder} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    width: 40,
  },
});