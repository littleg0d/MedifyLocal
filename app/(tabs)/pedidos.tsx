import { useState } from "react";
import { Alert , Platform} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";


import { globalStyles } from "../../assets/styles";
import { DetallePedido } from "../../assets/types";
import { usePedidosDelUsuario } from "../../src/lib/firestoreHooks";
import { loadDetallePedido } from "../../src/pedidos/helpers";
import { EmptyState, PedidoCard, DetalleModal } from "../../src/pedidos/components";
import { LoadingScreen, ErrorScreen, SimpleHeader, ContentScrollView, ListContainer} from "../../src/components/common";
import { navigateToPagar } from "../../src/lib/navigationHelpers";

export default function Pedidos() {
  const router = useRouter();
  
  const { pedidos, loading, error: errorPedidos } = usePedidosDelUsuario();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [detalleSeleccionado, setDetalleSeleccionado] = useState<DetallePedido | null>(null);

  const handleReintentarPago = (recetaId: string, cotizacionId: string) => {
    if (Platform.OS === 'web') {
      // En web usar confirm nativo
      const confirmar = window.confirm("¿Deseas volver a intentar el pago para este pedido?");
      if (confirmar) {
        setModalVisible(false);
        navigateToPagar(router, recetaId, cotizacionId);
      }
    } else {
      // En móvil usar Alert de React Native
      Alert.alert(
        "Reintentar Pago",
        "¿Deseas volver a intentar el pago para este pedido?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Sí, reintentar",
            onPress: () => {
              setModalVisible(false);
              navigateToPagar(router, recetaId, cotizacionId);
            },
          },
        ]
      );
    }
  };

  const handleVerDetalle = async (pedidoId: string, index: number) => {
    try {
      const detalle = await loadDetallePedido(pedidoId, pedidos, index);
      setDetalleSeleccionado(detalle);
      setModalVisible(true);
    } catch (error) {
      console.error("Error al cargar detalle:", error);
      const mensaje = "No pudimos cargar los detalles del pedido.";
      Platform.OS === 'web' ? window.alert(`Error: ${mensaje}`) : Alert.alert("Error", mensaje);
    }
  };

  // Loading state
  if (loading) {
    return <LoadingScreen message="Cargando pedidos..." />;
  }

  // Error state
  if (errorPedidos) {
    return (
      <ErrorScreen
        title="Error de Conexión"
        message="No pudimos cargar tus pedidos. Por favor, revisa tu conexión."
        header={<SimpleHeader title="Mis Pedidos" />}
      />
    );
  }

  // Main content
  return (
    <SafeAreaView style={globalStyles.container} edges={["top"]}>
      <SimpleHeader title="Mis Pedidos" />

      <ContentScrollView>
        {pedidos.length === 0 ? (
          <EmptyState />
        ) : (
          <ListContainer>
            {pedidos.map((pedido, index) => (
              <PedidoCard
                key={pedido.id}
                pedido={pedido}
                pedidoNumero={pedidos.length - index}
                onPress={() => handleVerDetalle(pedido.id, index)}
                onReintentarPago={handleReintentarPago}
              />
            ))}
          </ListContainer>
        )}
      </ContentScrollView>  

      <DetalleModal
        visible={modalVisible}
        detalle={detalleSeleccionado}
        onClose={() => setModalVisible(false)}
        onReintentarPago={handleReintentarPago}
      />
    </SafeAreaView>
  );
}

