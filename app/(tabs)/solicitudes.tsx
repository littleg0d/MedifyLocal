import { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

import { globalStyles, colors } from "../../assets/styles";
import { Cotizacion, Farmacia } from "../../assets/types";

import { useCotizaciones, useUltimoPedidoPorReceta} from "../../src/lib/firebasehooks";
import { recetaEstaBloqueada } from "../../src/solicitudes/helpers";
import { BannerBloqueo, TarjetaCotizacion, DetalleFarmacia } from "../../src/solicitudes/components";

export default function Solicitudes() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const recetaId = params.recetaId as string;

  // Hooks primero
  const { pedido: pedidoActivo, loading: loadingPedido } = useUltimoPedidoPorReceta(recetaId);
  const { cotizaciones, loading: loadingCotizaciones, error:errorCotizaciones, } = useCotizaciones(recetaId);

  const [filtroConStock, setFiltroConStock] = useState(false);
  const [farmaciaSeleccionada, setFarmaciaSeleccionada] = useState<Farmacia | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const bloqueada = recetaEstaBloqueada(pedidoActivo);

  const handlePagar = (cotizacion: Cotizacion) => {
    if (bloqueada && pedidoActivo) {
      mostrarAlertaBloqueo(pedidoActivo);
      return;
    }

    router.push({
      pathname: "/pagar",
      params: {
        recetaId: recetaId,
        cotizacionId: cotizacion.id,
      },
    });
  };

  const mostrarAlertaBloqueo = (pedido: any) => {
    const { estado, nombreComercialFarmacia } = pedido;

    if (estado === "pagado") {
      Alert.alert(
        "Ya pagaste esta receta",
        `Ya compraste este medicamento en ${nombreComercialFarmacia}. Puedes ver el estado en 'Mis Pedidos'.`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Ver Pedidos", onPress: () => router.push("/(tabs)/pedidos") },
        ]
      );
    } else {
      Alert.alert(
        "Pago en Proceso",
        `Ya tienes un pago en proceso para esta receta en ${nombreComercialFarmacia}.\n\nPor favor verifica el estado del pago.`,
        [
          { text: "Entendido", style: "cancel" },
          { text: "Ver Estado", onPress: () => router.push("/(tabs)/pedidos") },
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

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={globalStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={globalStyles.loadingText}>Cargando solicitudes...</Text>
        </View>
      </SafeAreaView>
    );
  }
  // COMPROBAMOS EL ERROR ANTES DE RENDERIZAR LA LISTA
  if (errorCotizaciones) {
    return (
      <SafeAreaView style={globalStyles.container}>
      {/* Podemos reusar el header si queremos */}
      <View style={globalStyles.headerWithBorder}>
      <Pressable onPress={() => router.push("/(tabs)/recetas")} style={styles.backButton}>
      <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </Pressable>
      <Text style={globalStyles.titleSmall}>Farmacias Cercanas</Text>
       <View style={styles.placeholder} />
      </View>

 {/* Mensaje de Error */}
  <View style={globalStyles.emptyContainer}>
    <Ionicons
    name="cloud-offline-outline"
    size={64}
    color={colors.errorDark} 
  />
    <Text style={globalStyles.emptyTitle}>Error de Conexión</Text>
    <Text style={globalStyles.emptyText}>
     No pudimos cargar las cotizaciones. Por favor, revisa tu conexión.
    </Text>
    </View>
    </SafeAreaView>
    );
    }
  // ============================================
  return (
    <SafeAreaView style={globalStyles.container} edges={["top"]}>
      <View style={globalStyles.headerWithBorder}>
        <Pressable onPress={() => router.push("/(tabs)/recetas")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={globalStyles.titleSmall}>Farmacias Cercanas</Text>
        <View style={styles.placeholder} />
      </View>

      {bloqueada && pedidoActivo && (
        <BannerBloqueo
          pedido={pedidoActivo}
          onVerEstado={() => router.push("/(tabs)/pedidos")}
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

      <ScrollView style={styles.scrollView}>
        {cotizacionesFiltradas.length === 0 ? (
          <View style={globalStyles.emptyContainer}>
            <Ionicons name="file-tray-outline" size={64} color={colors.textTertiary} />
            <Text style={globalStyles.emptyTitle}>Sin solicitudes</Text>
            <Text style={globalStyles.emptyText}>
              {filtroConStock
                ? "No hay farmacias con stock disponible aún"
                : "Aún no hay respuestas de farmacias"}
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
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
          </View>
        )}
        <View style={globalStyles.spacer} />
      </ScrollView>

      <DetalleFarmacia
        visible={modalVisible}
        farmacia={farmaciaSeleccionada}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    width: 40,
    height: 40,
  },
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
  },
  scrollView: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
});