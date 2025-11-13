import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../assets/styles";
import { EstadoConfig } from "../../../assets/types";

interface PaymentEstadoCardProps {
  estadoConfig: EstadoConfig;
  pedido: any;
  cotizacionId: string;
}

export function PaymentEstadoCard({
  estadoConfig,
  pedido,
  cotizacionId,
}: PaymentEstadoCardProps) {
  return (
    <View style={[styles.estadoCard, { backgroundColor: estadoConfig.bg }]}>
      <View style={styles.estadoHeader}>
        <Ionicons
          name={estadoConfig.icon as any}
          size={32}
          color={estadoConfig.color}
        />
        <View style={styles.estadoInfo}>
          <Text style={[styles.estadoLabel, { color: estadoConfig.color }]}>
            {estadoConfig.label}
          </Text>
          <Text style={[styles.estadoDescripcion, { color: estadoConfig.color }]}>
            {estadoConfig.descripcion}
          </Text>
          {pedido.cotizacionId !== cotizacionId && (
            <Text
              style={[
                styles.estadoDescripcion,
                {
                  color: estadoConfig.color,
                  marginTop: 4,
                  fontWeight: "700",
                },
              ]}
            >
              ⚠️ Este estado es en {pedido.nombreComercialFarmacia}
            </Text>
          )}
        </View>
      </View>

      {pedido.paymentId && (
        <Text style={styles.paymentId}>ID de pago: {pedido.paymentId}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  estadoCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  estadoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  estadoInfo: {
    flex: 1,
    gap: 4,
  },
  estadoLabel: {
    fontSize: 18,
    fontWeight: "700",
  },
  estadoDescripcion: {
    fontSize: 14,
    fontWeight: "500",
  },
  paymentId: {
    marginTop: 12,
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: "monospace",
  },
});