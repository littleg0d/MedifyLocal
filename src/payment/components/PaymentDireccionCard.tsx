import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { globalStyles, colors } from "../../../assets/styles";
import { Address } from "../../../assets/types";

interface PaymentDireccionCardProps {
  direccion: Address | null;
  onConfigureAddress: () => void;
}

export function PaymentDireccionCard({
  direccion,
  onConfigureAddress,
}: PaymentDireccionCardProps) {
  return (
    <View style={globalStyles.card}>
      <Text style={globalStyles.sectionTitle}>Dirección de Entrega</Text>
      {direccion ? (
        <View style={styles.direccionInfo}>
          <Ionicons name="location" size={24} color={colors.primary} />
          <View style={styles.direccionTexto}>
            <Text style={styles.direccionCalle}>{direccion.street}</Text>
            <Text style={styles.infoSecundaria}>
              {direccion.city}, {direccion.province}
            </Text>
            <Text style={styles.infoSecundaria}>CP: {direccion.postalCode}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.sinDireccion}>
          <Ionicons name="alert-circle" size={24} color={colors.warningDark} />
          <Text style={styles.sinDireccionTexto}>
            No tienes una dirección configurada
          </Text>
          <Pressable style={styles.configurarButton} onPress={onConfigureAddress}>
            <Text style={styles.configurarButtonText}>Configurar ahora</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  direccionInfo: {
    flexDirection: "row",
    gap: 12,
  },
  direccionTexto: {
    flex: 1,
    gap: 4,
  },
  direccionCalle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  infoSecundaria: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sinDireccion: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  sinDireccionTexto: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  configurarButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  configurarButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "600",
  },
});