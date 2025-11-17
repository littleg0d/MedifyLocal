import React from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../assets/styles";

interface PaymentStatusModalProps {
  visible: boolean;
  success: boolean; // true = pagado, false = rechazado
  onClose: () => void;
}

export function PaymentStatusModal({
  visible,
  success,
  onClose,
}: PaymentStatusModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Ícono */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: success ? colors.successLight : colors.errorLight },
            ]}
          >
            <Ionicons
              name={success ? "checkmark-circle" : "close-circle"}
              size={64}
              color={success ? colors.successDark : colors.errorDark}
            />
          </View>

          {/* Título */}
          <Text style={styles.title}>
            {success ? "¡Pago Exitoso!" : "Pago Rechazado"}
          </Text>

          {/* Descripción */}
          <Text style={styles.description}>
            {success
              ? "Tu pago fue procesado correctamente. Puedes ver el estado de tu pedido en la sección de 'Mis Pedidos'."
              : "Tu pago fue rechazado por MercadoPago. Por favor, intenta nuevamente o verifica tu método de pago."}
          </Text>

          {/* Botón */}
          <Pressable
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: success ? colors.successDark : colors.primary },
              pressed && styles.buttonPressed,
            ]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>
              {success ? "Ver Mis Pedidos" : "Entendido"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "700",
  },
});