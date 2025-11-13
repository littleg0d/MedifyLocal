import { useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { globalStyles, colors } from "../../assets/styles";
import { DetallePedido } from "../../assets/types";

import { usePedidosDelUsuario } from "../../src/pedidos/hooks";
import { loadDetallePedido } from "../../src/pedidos/helpers";
import { EmptyState, PedidoCard, DetalleModal } from "../../src/pedidos/components";

export default function Pedidos() {
  const router = useRouter();
  
  const { pedidos, loading , error: errorPedidos} = usePedidosDelUsuario();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [detalleSeleccionado, setDetalleSeleccionado] = useState<DetallePedido | null>(null);

  const handleReintentarPago = (recetaId: string, cotizacionId: string) => {
    Alert.alert(
      "Reintentar Pago",
      "¿Deseas volver a intentar el pago para este pedido?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, reintentar",
          onPress: () => {
            setModalVisible(false);
            router.push({
              pathname: "/pagar",
              params: { recetaId, cotizacionId },
            });
          },
        },
      ]
    );
  };

  const handleVerDetalle = async (pedidoId: string, index: number) => {
    try {
      const detalle = await loadDetallePedido(pedidoId, pedidos, index);
      setDetalleSeleccionado(detalle);
      setModalVisible(true);
    } catch (error) {
      console.error("Error al cargar detalle:", error);
      Alert.alert("Error", "No pudimos cargar los detalles del pedido.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={globalStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={globalStyles.loadingText}>Cargando pedidos...</Text>
        </View>
      </SafeAreaView>
    );
  }
//  MANEJO DE ERROR
if (errorPedidos) {
  return (
    <SafeAreaView style={globalStyles.container} edges={["top"]}>
      <View style={globalStyles.header}>
        <View style={styles.placeholder} />
        <Text style={globalStyles.titleMedium}>Mis Pedidos</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={globalStyles.emptyContainer}>
        <Ionicons
          name="cloud-offline-outline"
          size={64}
          color={colors.errorDark}
        />
        <Text style={globalStyles.emptyTitle}>Error de Conexión</Text>
        <Text style={globalStyles.emptyText}>
          No pudimos cargar tus pedidos. Por favor, revisa tu conexión.
        </Text>
      </View>
    </SafeAreaView>
  );
}
  return (
    <SafeAreaView style={globalStyles.container} edges={["top"]}>
      <View style={globalStyles.header}>
        <View style={styles.placeholder} />
        <Text style={globalStyles.titleMedium}>Mis Pedidos</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {pedidos.length === 0 ? (
          <EmptyState />
        ) : (
          <View style={styles.listContainer}>
            {pedidos.map((pedido, index) => (
              <PedidoCard
                key={pedido.id}
                pedido={pedido}
                pedidoNumero={pedidos.length - index}
                onPress={() => handleVerDetalle(pedido.id, index)}
                onReintentarPago={handleReintentarPago}
              />
            ))}
          </View>
        )}
        <View style={globalStyles.spacer} />
      </ScrollView>

      <DetalleModal
        visible={modalVisible}
        detalle={detalleSeleccionado}
        onClose={() => setModalVisible(false)}
        onReintentarPago={handleReintentarPago}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    width: 48,
  },
  scrollView: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
});