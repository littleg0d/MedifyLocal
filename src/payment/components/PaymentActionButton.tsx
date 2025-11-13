import React from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { globalStyles, colors } from "../../../assets/styles";
import { TipoBoton } from "../types";

interface PaymentActionButtonProps {
  tipoBoton: TipoBoton;
  procesandoPago: boolean;
  onPagar: () => void;
  onGoToPedidos: () => void;
}

export function PaymentActionButton({
  tipoBoton,
  procesandoPago,
  onPagar,
  onGoToPedidos,
}: PaymentActionButtonProps) {
  return (
    <View style={styles.buttonContainer}>
      {tipoBoton === "pagado" ? (
        <Pressable
          style={[styles.actionButton, styles.successButton]}
          onPress={onGoToPedidos}
        >
          <Ionicons name="checkmark-circle" size={24} color={colors.surface} />
          <Text style={styles.actionButtonText}>Ver mis pedidos</Text>
        </Pressable>
      ) : tipoBoton === "procesando" ? (
        <View style={[styles.actionButton, globalStyles.buttonDisabled]}>
          <ActivityIndicator size="small" color={colors.surface} />
          <Text style={styles.actionButtonText}>Procesando pago...</Text>
        </View>
      ) : tipoBoton === "reintentar" ? (
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            procesandoPago && globalStyles.buttonDisabled,
            pressed && globalStyles.buttonPressed,
          ]}
          onPress={onPagar}
          disabled={procesandoPago}
        >
          {procesandoPago ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Ionicons name="refresh" size={24} color={colors.surface} />
          )}
          <Text style={styles.actionButtonText}>
            {procesandoPago ? "Procesando..." : "Reintentar pago"}
          </Text>
        </Pressable>
      ) : tipoBoton === "pagar" ? (
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            procesandoPago && globalStyles.buttonDisabled,
            pressed && globalStyles.buttonPressed,
          ]}
          onPress={onPagar}
          disabled={procesandoPago}
        >
          {procesandoPago ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Ionicons name="card" size={24} color={colors.surface} />
          )}
          <Text style={styles.actionButtonText}>
            {procesandoPago ? "Procesando..." : "Pagar con MercadoPago"}
          </Text>
        </Pressable>
      ) : (
        <View style={[styles.actionButton, globalStyles.buttonDisabled]}>
          <Ionicons name="lock-closed" size={24} color={colors.surface} />
          <Text style={styles.actionButtonText}>Pago no disponible</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "700",
  },
  successButton: {
    backgroundColor: colors.successDark,
  },
});