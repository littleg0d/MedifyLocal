import React from "react";
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { globalStyles, colors } from "../../../assets/styles";
import { PaymentViewProps } from "../types";
import { PaymentHeader } from "./PaymentHeader";
import { PaymentEstadoCard } from "./PaymentEstadoCard";
import { PaymentMedicamentoCard } from "./PaymentMedicamentoCard";
import { PaymentDireccionCard } from "./PaymentDireccionCard";
import { PaymentSeguridadCard } from "./PaymentSeguridadCard";
import { PaymentActionButton } from "./PaymentActionButton";
export function PaymentView(props: PaymentViewProps) {
  const {
    isLoading,
    procesandoPago,
    cotizacion,
    receta,
    direccionUsuario,
    pedidoExistente,
    errorPedido,
    estadoConfig,
    tipoBoton,
    cotizacionId,
    handlePagar,
    onGoBack,
    onGoToProfile,
    onGoToPedidos,
  } = props;

  // ============ PANTALLA DE CARGA ============
  if (isLoading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={globalStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={globalStyles.loadingText}>Cargando información...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ============ PANTALLA DE ERROR DE CONEXIÓN ============
  if (errorPedido) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <PaymentHeader onGoBack={onGoBack} />
        <View style={globalStyles.emptyContainer}>
          <Ionicons name="cloud-offline-outline" size={64} color={colors.errorDark} />
          <Text style={globalStyles.emptyTitle}>Error de Conexión</Text>
          <Text style={globalStyles.emptyText}>
            No pudimos verificar el estado del pedido. Por favor, revisa tu conexión e
            inténtalo de nuevo.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ============ PANTALLA DE ERROR DE DATOS ============
  if (!cotizacion || !receta) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <PaymentHeader onGoBack={onGoBack} />
        <View style={globalStyles.emptyContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.textTertiary} />
          <Text style={globalStyles.emptyTitle}>Error</Text>
          <Text style={globalStyles.emptyText}>
            No se pudieron cargar los datos del pago
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ============ PANTALLA PRINCIPAL ============
  return (
    <SafeAreaView style={globalStyles.container} edges={["top"]}>
      <PaymentHeader onGoBack={onGoBack} />

      <ScrollView style={styles.scrollView}>
        {/* Card de Estado (si existe pedido) */}
        {pedidoExistente && estadoConfig && (
          <PaymentEstadoCard
            estadoConfig={estadoConfig}
            pedido={pedidoExistente}
            cotizacionId={cotizacionId}
          />
        )}

        {/* Card de Medicamento */}
        <PaymentMedicamentoCard cotizacion={cotizacion} />

        {/* Card de Dirección */}
        <PaymentDireccionCard
          direccion={direccionUsuario}
          onConfigureAddress={onGoToProfile}
        />

        {/* Card de Seguridad */}
        <PaymentSeguridadCard />

        {/* Espaciador */}
        <View style={globalStyles.spacer} />
      </ScrollView>

      {/* Botón de Acción */}
      <PaymentActionButton
        tipoBoton={tipoBoton}
        procesandoPago={procesandoPago}
        onPagar={handlePagar}
        onGoToPedidos={onGoToPedidos}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    padding: 16,
  },
});