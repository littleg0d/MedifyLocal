import React from "react";
import { View, Text, Image, StyleSheet, Linking, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { globalStyles, colors } from "../../../assets/styles";
import { Cotizacion, Receta } from "../../../assets/types";
import { formatCurrency } from "../../lib/formatHelpers";

interface PaymentMedicamentoCardProps {
  cotizacion: Cotizacion;
  receta: Receta | null;
}

export function PaymentMedicamentoCard({ cotizacion, receta }: PaymentMedicamentoCardProps) {
  const handlePhonePress = () => {
    if (cotizacion.telefono) {
      Linking.openURL(`tel:${cotizacion.telefono}`);
    }
  };

  const handleEmailPress = () => {
    if (cotizacion.email) {
      Linking.openURL(`mailto:${cotizacion.email}`);
    }
  };

  return (
    <View style={globalStyles.card}>
      <Text style={globalStyles.sectionTitle}>Detalle de la Compra</Text>
      
      {/* Imagen de la receta */}
      {cotizacion.imagenUrl && (
        <View style={styles.imagenContainer}>
          <Text style={styles.imagenLabel}>Receta</Text>
          <Image
            source={{ uri: cotizacion.imagenUrl }}
            style={styles.recetaImagen}
            resizeMode="contain"
          />
        </View>
      )}

      {/* Descripción de medicamentos */}
      {cotizacion.descripcion && (
        <View style={styles.descripcionContainer}>
          <View style={styles.descripcionHeader}>
            <Ionicons name="medical" size={20} color={colors.primary} />
            <Text style={styles.descripcionLabel}>Descripción</Text>
          </View>
          <Text style={styles.descripcionTexto}>{cotizacion.descripcion}</Text>
        </View>
      )}

      {/* Info de la farmacia */}
      <View style={styles.farmaciaInfo}>
        <View style={styles.farmaciaRow}>
          <Ionicons name="storefront" size={20} color={colors.textSecondary} />
          <View style={styles.farmaciaTexto}>
            <Text style={styles.farmaciaLabel}>Farmacia</Text>
            <Text style={styles.farmaciaNombre}>{cotizacion.nombreComercial}</Text>
          </View>
        </View>
        
        <View style={styles.farmaciaRow}>
          <Ionicons name="location" size={20} color={colors.textSecondary} />
          <View style={styles.farmaciaTexto}>
            <Text style={styles.farmaciaLabel}>Ubicación</Text>
            <Text style={styles.farmaciaDireccion}>{cotizacion.direccion}</Text>
          </View>
        </View>

        {/* Obra Social */}
        <View style={styles.farmaciaRow}>
          <Ionicons name="medkit" size={20} color={colors.textSecondary} />
          <View style={styles.farmaciaTexto}>
            <Text style={styles.farmaciaLabel}>Obra Social</Text>
            {receta?.userObraSocial ? (
              <Text style={styles.farmaciaDireccion}>
                {receta.userObraSocial.name}
                {receta.userObraSocial.number && ` - ${receta.userObraSocial.number}`}
              </Text>
            ) : (
              <Text style={[styles.farmaciaDireccion, styles.sinObraSocial]}>
                Sin obra social
              </Text>
            )}
          </View>
        </View>

        {/* Teléfono */}
        {cotizacion.telefono && (
          <Pressable style={styles.farmaciaRow} onPress={handlePhonePress}>
            <Ionicons name="call" size={20} color={colors.primary} />
            <View style={styles.farmaciaTexto}>
              <Text style={styles.farmaciaLabel}>Teléfono</Text>
              <Text style={[styles.farmaciaDireccion, styles.linkText]}>
                {cotizacion.telefono}
              </Text>
            </View>
          </Pressable>
        )}

        {/* Email */}
        {cotizacion.email && (
          <Pressable style={styles.farmaciaRow} onPress={handleEmailPress}>
            <Ionicons name="mail" size={20} color={colors.primary} />
            <View style={styles.farmaciaTexto}>
              <Text style={styles.farmaciaLabel}>Email</Text>
              <Text style={[styles.farmaciaDireccion, styles.linkText]}>
                {cotizacion.email}
              </Text>
            </View>
          </Pressable>
        )}
      </View>

      {/* Precio total */}
      <View style={styles.precioContainer}>
        <Text style={styles.precioLabel}>Total a pagar:</Text>
        <Text style={styles.precioValor}>{formatCurrency(cotizacion.precio || 0)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  imagenContainer: {
    marginBottom: 16,
    gap: 8,
  },
  imagenLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  recetaImagen: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    backgroundColor: colors.gray100,
  },
  descripcionContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.gray50,
    borderRadius: 8,
    gap: 8,
  },
  descripcionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  descripcionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  descripcionTexto: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  farmaciaInfo: {
    marginBottom: 16,
    gap: 12,
  },
  farmaciaRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  farmaciaTexto: {
    flex: 1,
    gap: 4,
  },
  farmaciaLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  farmaciaNombre: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  farmaciaDireccion: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  linkText: {
    color: colors.primary,
    textDecorationLine: "underline",
  },
  sinObraSocial: {
    fontStyle: "italic",
    color: colors.textMuted,
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