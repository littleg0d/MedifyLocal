import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../assets/styles";

export function PaymentSeguridadCard() {
  return (
    <View style={styles.seguridadCard}>
      <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
      <View style={styles.seguridadTexto}>
        <Text style={styles.seguridadTitulo}>Pago seguro</Text>
        <Text style={styles.infoSecundaria}>
          Tu pago es procesado de forma segura por MercadoPago
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  seguridadCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    marginTop: 8,
  },
  seguridadTexto: {
    flex: 1,
    gap: 4,
  },
  seguridadTitulo: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  infoSecundaria: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});