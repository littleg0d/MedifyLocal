import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { globalStyles, colors } from "../../../assets/styles";
import { Address } from "../../../assets/types";
import { formatAddress } from "../../lib/formatHelpers";

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
            <Text style={styles.direccionCalle}>
              {formatAddress(direccion)}
            </Text>
            <Text style={styles.infoAclaracion}>
              Esta es la dirección que tenías configurada al subir la receta
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.sinDireccion}>
          <Ionicons name="alert-circle" size={24} color={colors.warningDark} />
          <Text style={styles.sinDireccionTexto}>
            Esta receta no tiene dirección de entrega configurada
          </Text>
          <Text style={styles.infoSecundaria}>
            Configura tu dirección en el perfil y vuelve a cargar la receta
          </Text>
          <Pressable style={styles.configurarButton} onPress={onConfigureAddress}>
            <Text style={styles.configurarButtonText}>Ir a Perfil</Text>
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
    gap: 8,
  },
  direccionCalle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    lineHeight: 22,
  },
  infoAclaracion: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: "italic",
  },
  infoSecundaria: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
  sinDireccion: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  sinDireccionTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.warningDark,
    textAlign: "center",
  },
  configurarButton: {
    marginTop: 8,
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