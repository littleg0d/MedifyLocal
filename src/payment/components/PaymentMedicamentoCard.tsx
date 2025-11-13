import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { globalStyles, colors } from "../../../assets/styles";
import { Cotizacion } from "../../../assets/types";
import { formatCurrency } from "../../lib/formatHelpers";

interface PaymentMedicamentoCardProps {
  cotizacion: Cotizacion;
}

export function PaymentMedicamentoCard({ cotizacion }: PaymentMedicamentoCardProps) {
  return (
    <View style={globalStyles.card}>
      <Text style={globalStyles.sectionTitle}>Detalle del Medicamento</Text>
      <View style={styles.medicamentoInfo}>
        {cotizacion.imagenUrl && (
          <Image
            source={{ uri: cotizacion.imagenUrl }}
            style={styles.medicamentoImagen}
          />
        )}
        <View style={styles.medicamentoTexto}>
          <Text style={styles.medicamentoNombre}>{cotizacion.nombreComercial}</Text>
          <Text style={styles.infoSecundaria}>
            <Ionicons name="storefront" size={16} color={colors.textSecondary} />{" "}
            {cotizacion.direccion}
          </Text>
        </View>
      </View>
      <View style={styles.precioContainer}>
        <Text style={styles.precioLabel}>Total a pagar:</Text>
        <Text style={styles.precioValor}>{formatCurrency(cotizacion.precio || 0)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  medicamentoInfo: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  medicamentoImagen: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.gray100,
  },
  medicamentoTexto: {
    flex: 1,
    gap: 8,
  },
  medicamentoNombre: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  infoSecundaria: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  precioContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  precioLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  precioValor: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.primary,
  },
});