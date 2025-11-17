// app/(tabs)/solicitudes.tsx
import { useState } from "react";
import { View, Text, Pressable, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";

import { globalStyles, colors } from "../../assets/styles";
import { Cotizacion } from "../../assets/types";
import { navigateToPagar, navigateToPedidos, navigateToRecetas } from "../../src/lib/navigationHelpers";
import { useCotizaciones, useUltimoPedidoPorReceta } from "../../src/lib/firestoreHooks";
import { recetaEstaBloqueada } from "../../src/lib/estadosHelpers";
import { BannerBloqueo, TarjetaCotizacion, DetalleCotizacion } from "../../src/solicitudes/components";
import { LoadingScreen, ErrorScreen, HeaderWithBack, EmptyState, ListContainer, ContentScrollView } from "../../src/components/common";

// Pantalla que muestra las cotizaciones (respuestas) de las farmacias para UNA receta
export default function Solicitudes() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Obtener recetaId de los parametros de la URL
  const recetaId = params.recetaId as string;
  console.log(`[SolicitudesScreen] recetaId from params: ${recetaId}`);

  // Hooks para traer datos
  // Hook 1: Trae el pedido activo (si existe) para esta receta (para bloquear)
  const { pedido: pedidoActivo, loading: loadingPedido } = useUltimoPedidoPorReceta(recetaId);
  // Hook 2: Trae todas las cotizaciones para esta receta
  const { cotizaciones, loading: loadingCotizaciones, error: errorCotizaciones } = useCotizaciones(recetaId);

  // Estados locales
  const [filtroConStock, setFiltroConStock] = useState(false);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState<Cotizacion | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Logica de bloqueo
  const bloqueada = recetaEstaBloqueada(pedidoActivo);
  const loading = loadingPedido || loadingCotizaciones; // Carga total
  

  // Navegar a Pagar
  const handlePagar = (cotizacion: Cotizacion) => {
    console.log(`[handlePagar] Click en pagar para cotizacionId: ${cotizacion.id}`);
    // Si la receta ya tiene un pago en proceso o pagado, mostrar alerta
    if (bloqueada && pedidoActivo) {
      mostrarAlertaBloqueo(pedidoActivo);
      return;
    }
    
    navigateToPagar(router, recetaId, cotizacion.id);
  };

  // Alerta si la receta ya esta pagada o en proceso
  const mostrarAlertaBloqueo = (pedido: any) => {
    const { estado, nombreComercialFarmacia } = pedido;
    console.log(`[mostrarAlertaBloqueo] Estado del pedido: ${estado}`);

    if (estado === "pagado") {
      Alert.alert(
        "Ya pagaste esta receta",
        `Ya compraste este medicamento en ${nombreComercialFarmacia}. Puedes ver el estado en 'Mis Pedidos'.`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Ver Pedidos", onPress: () => navigateToPedidos(router) },
        ]
      );
    } else {
      Alert.alert(
        "Pago en Proceso",
        `Ya tienes un pago en proceso para esta receta en ${nombreComercialFarmacia}.\n\nPor favor verifica el estado del pago.`,
        [
          { text: "Entendido", style: "cancel" },
          { text: "Ver Estado", onPress: () => navigateToPedidos(router) },
        ]
      );
    }
  };

  // Abrir modal de detalles de cotización
  const handleVerDetalles = (cotizacion: Cotizacion) => {
    setCotizacionSeleccionada(cotizacion);
    setModalVisible(true);
  };

  // Filtrar cotizaciones localmente
  const cotizacionesFiltradas = filtroConStock
    ? cotizaciones.filter((c) => c.estado === "cotizado")
    : cotizaciones;
    
  console.log(`[RenderLogic] Filtro con stock: ${filtroConStock}. Mostrando ${cotizacionesFiltradas.length} de ${cotizaciones.length}`);

  // Estado de Carga
  if (loading) {
    return <LoadingScreen message="Cargando solicitudes..." />;
  }

  // Estado de Error
  if (errorCotizaciones) {
    console.log("[Render] Estado: Error");
    return (
      <ErrorScreen
        title="Error de Conexión"
        message="No pudimos cargar las cotizaciones. Por favor, revisa tu conexión."
        header={
          <HeaderWithBack
            title="Farmacias Cercanas"
            onBack={() => navigateToRecetas(router)}
          />
        }
      />
    );
  }

  // Render principal
  return (
    <SafeAreaView style={globalStyles.container} edges={["top"]}>
      <HeaderWithBack
        title="Farmacias Cercanas"
        onBack={() => navigateToRecetas(router)}
      />

      {/* Banner de bloqueo si ya se pago o esta en proceso */}
      {bloqueada && pedidoActivo && (
        <BannerBloqueo
          pedido={pedidoActivo}
          onVerEstado={() => navigateToPedidos(router)}
        />
      )}

      {/* Filtro de "Solo con stock" */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Mostrar solo con stock</Text>
        <Pressable
          style={[globalStyles.toggle, filtroConStock && globalStyles.toggleActive]}
          onPress={() => {
            setFiltroConStock(!filtroConStock);
          }}
        >
          <View
            style={[
              globalStyles.toggleThumb,
              filtroConStock && globalStyles.toggleThumbActive,
            ]}
          />
        </Pressable>
      </View>

      <ContentScrollView>
        {cotizacionesFiltradas.length === 0 ? (
          // Estado vacio
          <>
            {console.log("[Render] Mostrando estado vacio (empty).")}
            <EmptyState
              icon="file-tray-outline"
              title="Sin solicitudes"
              message={
                filtroConStock
                  ? "No hay farmacias con stock disponible aún"
                  : "Aún no hay respuestas de farmacias"
              }
              iconColor={colors.textTertiary}
            />
          </>
        ) : (
          // Lista de cotizaciones
          <ListContainer>
            {cotizacionesFiltradas.map((cotizacion) => (
              <TarjetaCotizacion
                key={cotizacion.id}
                cotizacion={cotizacion}
                bloqueada={bloqueada}
                esActiva={pedidoActivo?.cotizacionId === cotizacion.id}
                onPagar={() => handlePagar(cotizacion)}
                onVerDetalles={() => handleVerDetalles(cotizacion)}
              />
            ))}
          </ListContainer>
        )}
        <View style={globalStyles.spacer} />
      </ContentScrollView>

      {/* Modal para ver detalles completos de la cotización */}
      <DetalleCotizacion
        visible={modalVisible}
        cotizacion={cotizacionSeleccionada}
        bloqueada={bloqueada}
        onClose={() => {
          setModalVisible(false);
        }}
        onPagar={() => {
          if (cotizacionSeleccionada) {
            handlePagar(cotizacionSeleccionada);
          }
        }}
      />
    </SafeAreaView>
  );
}

// Estilos
const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterLabel: {
    fontSize: 16,
    color: colors.textPrimary,
  }
});