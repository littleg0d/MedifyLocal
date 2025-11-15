import { useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, StyleSheet  } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";

import { globalStyles, colors } from "../../assets/styles";
import { Cotizacion, Farmacia } from "../../assets/types";
import { navigateToPagar, navigateToPedidos, navigateToRecetas } from "../../src/lib/navigationHelpers";
import { useCotizaciones, useUltimoPedidoPorReceta } from "../../src/lib/firestoreHooks";
import { recetaEstaBloqueada } from "../../src/lib/estadosHelpers";
import { BannerBloqueo, TarjetaCotizacion, DetalleFarmacia } from "../../src/solicitudes/components";
import { LoadingScreen, ErrorScreen, HeaderWithBack,EmptyState, ListContainer, ContentScrollView} from "../../src/components/common";
export default function Solicitudes() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const recetaId = params.recetaId as string;

  // Hooks primero
  const { pedido: pedidoActivo, loading: loadingPedido } = useUltimoPedidoPorReceta(recetaId);
  const { cotizaciones, loading: loadingCotizaciones, error: errorCotizaciones } = useCotizaciones(recetaId);

  const [filtroConStock, setFiltroConStock] = useState(false);
  const [farmaciaSeleccionada, setFarmaciaSeleccionada] = useState<Farmacia | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const bloqueada = recetaEstaBloqueada(pedidoActivo);

  const handlePagar = (cotizacion: Cotizacion) => {
    if (bloqueada && pedidoActivo) {
      mostrarAlertaBloqueo(pedidoActivo);
      return;
    }

    navigateToPagar(router, recetaId, cotizacion.id);
  };

  const mostrarAlertaBloqueo = (pedido: any) => {
    const { estado, nombreComercialFarmacia } = pedido;

    if (estado === "pagado") {
      Alert.alert(
        "Ya pagaste esta receta",
        `Ya compraste este medicamento en ${nombreComercialFarmacia}. Puedes ver el estado en 'Mis Pedidos'.`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Ver Pedidos", onPress: () =>navigateToPedidos(router) },
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

  const handleVerDetalles = async (farmacia: Farmacia) => {
    setFarmaciaSeleccionada(farmacia);
    setModalVisible(true);
  };

  const cotizacionesFiltradas = filtroConStock
    ? cotizaciones.filter((c) => c.estado === "cotizado")
    : cotizaciones;

  const loading = loadingPedido || loadingCotizaciones;

 
  if (loading) return <LoadingScreen message="Cargando solicitudes..." />;

if (errorCotizaciones) {
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
  );}

  return (
    <SafeAreaView style={globalStyles.container} edges={["top"]}>
    <HeaderWithBack
  title="Farmacias Cercanas"
  onBack={() => navigateToRecetas(router)}
/>

      {bloqueada && pedidoActivo && (
        <BannerBloqueo
          pedido={pedidoActivo}
          onVerEstado={() =>navigateToPedidos(router)}
        />
      )}

      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Mostrar solo con stock</Text>
        <Pressable
          style={[globalStyles.toggle, filtroConStock && globalStyles.toggleActive]}
          onPress={() => setFiltroConStock(!filtroConStock)}
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
) : (
  <ListContainer>
            {cotizacionesFiltradas.map((cotizacion) => (
              <TarjetaCotizacion
                key={cotizacion.id}
                cotizacion={cotizacion}
                bloqueada={bloqueada}
                esActiva={pedidoActivo?.cotizacionId === cotizacion.id}
                onPagar={() => handlePagar(cotizacion)}
                onVerDetalles={handleVerDetalles}
              />
            ))}
          </ListContainer>
        )}
        <View style={globalStyles.spacer} />
      </ContentScrollView>

      <DetalleFarmacia
        visible={modalVisible}
        farmacia={farmaciaSeleccionada}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}
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