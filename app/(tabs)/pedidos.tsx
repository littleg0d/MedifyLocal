import { useState } from "react";
import { Alert , Platform} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { globalStyles } from "../../assets/styles";
import { DetallePedido, Pedido } from "../../assets/types";
import { usePedidosDelUsuario } from "../../src/lib/firestoreHooks";
import { loadDetallePedido } from "../../src/pedidos/helpers";
import { EmptyState, PedidoCard, DetalleModal } from "../../src/pedidos/components";
import { 
  LoadingScreen, 
  ErrorScreen, 
  SimpleHeader, 
  ContentScrollView, 
  ListContainer
} from "../../src/components/common";
import { navigateToPagar } from "../../src/lib/navigationHelpers";

export default function Pedidos() {
  const router = useRouter();
  
  const { pedidos, loading, error: errorPedidos } = usePedidosDelUsuario();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [detalleSeleccionado, setDetalleSeleccionado] = useState<DetallePedido | null>(null);

  // Maneja el reintento de pago
  const handleReintentarPago = (recetaId: string, cotizacionId: string) => {
    
    if (Platform.OS === 'web') {
      const confirmar = window.confirm("¿Deseas volver a intentar el pago para este pedido?");
      if (confirmar) {
        setModalVisible(false);
        navigateToPagar(router, recetaId, cotizacionId);
      } 
    } else {
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

  // Muestra el detalle del pedido en el modal
  const handleVerDetalle = (pedidoId: string, index: number) => {
    
    const detalle = loadDetallePedido(pedidoId, pedidos, index);
    
    setDetalleSeleccionado(detalle);
    setModalVisible(true);
  };

  // Renderiza estado de carga
  if (loading) {
    return <LoadingScreen message="Cargando pedidos..." />;
  }

  // Renderiza estado de error
  if (errorPedidos) {
    console.log("❌❌❌❌ [Render] Estado: Error en hook usePedidosDelUsuario", errorPedidos);
    return (
      <ErrorScreen
        title="Error de Conexión"
        message="No pudimos cargar tus pedidos. Por favor, revisa tu conexión."
        header={<SimpleHeader title="Mis Pedidos" />}
      />
    );
  }

  // Renderiza contenido principal
  console.log(`[Render] Estado: OK. Mostrando ${pedidos.length} pedidos.`);
  return (
    <SafeAreaView style={globalStyles.container} edges={["top"]}>
      <SimpleHeader title="Mis Pedidos" />

      <ContentScrollView>
        {pedidos.length === 0 ? (
          <>
            {console.log("[Render] Mostrando estado vacio (empty).")}
            <EmptyState />
          </>
        ) : (
          <ListContainer>
            {pedidos.map((pedido, index) => (
              <PedidoCard
                key={pedido.id}
                pedido={pedido}
                // Número de pedido en orden descendente
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
        onClose={() => {
          setModalVisible(false);
        }}
        onReintentarPago={handleReintentarPago}
      />
    </SafeAreaView>
  );
}