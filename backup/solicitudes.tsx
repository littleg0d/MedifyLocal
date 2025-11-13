import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db, auth } from "../../src/lib/firebase";
import { collection, getDocs, doc, getDoc, query, where, orderBy, limit } from "firebase/firestore";
import { globalStyles, colors } from "../../assets/styles";

// ------------------- IMPORTACIONES CENTRALIZADAS -------------------
import { 
  PAYMENT_CONFIG, 
  EstadoPedido,
  formatearTiempoRestante,
  recetaEstaBloqueada,
  calcularEdadPedidoMinutos
} from "../../src/config/paymentConfig";
// -----------------------------------------------------------------

interface Cotizacion {
  id: string;
  farmaciaId: string;
  nombreComercial: string;
  direccion: string;
  precio?: number;
  estado: "esperando" | "sin_stock" | "ilegible" | "cotizado";
  fechaCreacion: Date;
}

interface Farmacia {
  id: string;
  nombreComercial: string;
  direccion: string;
  telefono?: string;
  email?: string;
  horario?: string;
}

interface PedidoActivoReceta {
  id: string;
  estado: EstadoPedido;
  cotizacionId: string;
  nombreComercialFarmacia: string;
  precio: number;
  fechaCreacion: Date;
  paymentId?: string;
}

export default function Solicitudes() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const recetaId = params.recetaId as string;

  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroConStock, setFiltroConStock] = useState(false);
  const [farmaciaSeleccionada, setFarmaciaSeleccionada] = useState<Farmacia | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [pedidoActivoReceta, setPedidoActivoReceta] = useState<PedidoActivoReceta | null>(null);
  const [recetaBloqueada, setRecetaBloqueada] = useState(false);
  
  // Contador en tiempo real (fuerza re-render cada segundo)
  const [, setContadorActualizado] = useState(0);

  useEffect(() => {
    if (recetaId) {
      loadDatos();
    }
  }, [recetaId]);

  // Contador en tiempo real
  useEffect(() => {
    if (!pedidoActivoReceta) return;

    const intervalo = setInterval(() => {
      setContadorActualizado(prev => prev + 1);
    }, PAYMENT_CONFIG.INTERVALO_ACTUALIZACION_CONTADOR * 1000);

    return () => clearInterval(intervalo);
  }, [pedidoActivoReceta]);

  const loadDatos = async () => {
    try {
      setLoading(true);
      const bloqueo = await verificarBloqueoReceta();
      await loadCotizaciones();
      console.log("✅ Datos cargados. Receta bloqueada:", bloqueo);
    } catch (error) {
      console.error("❌ Error al cargar datos:", error);
      Alert.alert("Error", "No pudimos cargar las solicitudes.");
    } finally {
      setLoading(false);
    }
  };

  const verificarBloqueoReceta = async (): Promise<boolean> => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return false;

      const pedidosRef = collection(db, "pedidos");
      const q = query(
        pedidosRef,
        where("userId", "==", userId),
        where("recetaId", "==", recetaId),
        orderBy("fechaCreacion", "desc"),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const pedidoDoc = querySnapshot.docs[0];
        const pedidoData = pedidoDoc.data();
        
        const fechaCreacion = pedidoData.fechaCreacion.toDate();
        const edadMinutos = calcularEdadPedidoMinutos(fechaCreacion);
        const estado = pedidoData.estado as EstadoPedido;

        const debeBloquear = recetaEstaBloqueada(estado, edadMinutos);

        if (debeBloquear) {
          setPedidoActivoReceta({
            id: pedidoDoc.id,
            estado,
            cotizacionId: pedidoData.cotizacionId,
            nombreComercialFarmacia: pedidoData.nombreComercial || "Farmacia",
            precio: pedidoData.precio,
            fechaCreacion,
            paymentId: pedidoData.paymentId,
          });
          setRecetaBloqueada(true);
          return true;
        }
      }
      
      setPedidoActivoReceta(null);
      setRecetaBloqueada(false);
      return false;
    } catch (error) {
      console.error("Error verificando bloqueo:", error);
      return false;
    }
  };

  const loadCotizaciones = async () => {
    try {
      const cotizacionesRef = collection(db, "recetas", recetaId, "cotizaciones");
      const querySnapshot = await getDocs(cotizacionesRef);

      const cotizacionesData: Cotizacion[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        cotizacionesData.push({
          id: doc.id,
          farmaciaId: data.farmaciaId,
          nombreComercial: data.nombreComercial,
          direccion: data.direccion,
          precio: data.precio,
          estado: data.estado,
          fechaCreacion: data.fechaCreacion.toDate(),
        });
      });

      setCotizaciones(cotizacionesData);
    } catch (error) {
      console.error("❌ Error al cargar cotizaciones:", error);
      throw error;
    }
  };

  const handlePagar = (cotizacion: Cotizacion) => {
    if (recetaBloqueada && pedidoActivoReceta) {
      const { estado, nombreComercialFarmacia } = pedidoActivoReceta;
      const edadMinutos = calcularEdadPedidoMinutos(pedidoActivoReceta.fechaCreacion);
      
      if (estado === 'pagado') {
        Alert.alert(
          "Ya pagaste esta receta",
          `Ya compraste este medicamento en ${nombreComercialFarmacia}. Puedes ver el estado en 'Mis Pedidos'.`,
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Ver Pedidos", onPress: () => router.push("/(tabs)/pedidos") }
          ]
        );
      } else {
        const minutosRestantes = Math.max(0, Math.ceil(PAYMENT_CONFIG.MINUTOS_EXPIRACION_PAGO - edadMinutos));
        Alert.alert(
          "Pago en Proceso",
          `Ya tienes un pago en proceso para esta receta en ${nombreComercialFarmacia}.\n\nPor favor espera ${minutosRestantes} minuto${minutosRestantes !== 1 ? 's' : ''} más o verifica el estado del pago.`,
          [
            { text: "Entendido", style: "cancel" },
            { text: "Ver Estado", onPress: () => router.push("/(tabs)/pedidos") }
          ]
        );
      }
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

  const handleVerDetalles = async (farmaciaId: string) => {
    try {
      const farmaciaRef = doc(db, "farmacias", farmaciaId);
      const farmaciaSnap = await getDoc(farmaciaRef);

      if (farmaciaSnap.exists()) {
        const data = farmaciaSnap.data();
        setFarmaciaSeleccionada({
          id: farmaciaSnap.id,
          nombreComercial: data.nombreComercial,
          direccion: data.direccion,
          telefono: data.telefono,
          email: data.email,
          horario: data.horario,
        });
        setModalVisible(true);
      } else {
        Alert.alert("Error", "No se encontraron los detalles de la farmacia");
      }
    } catch (error) {
      console.error("❌ Error al cargar farmacia:", error);
      Alert.alert("Error", "No pudimos cargar los detalles");
    }
  };

  const handleLlamar = (telefono?: string) => {
    if (telefono) Linking.openURL(`tel:${telefono}`);
  };

  const handleEmail = (email?: string) => {
    if (email) Linking.openURL(`mailto:${email}`);
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "esperando":
        return { bg: colors.warning, text: colors.warningDark, label: "Esperando respuesta" };
      case "cotizado":
        return { bg: colors.successLight, text: colors.successDark, label: "Disponible" };
      case "sin_stock":
        return { bg: colors.gray200, text: colors.gray700, label: "Sin stock" };
      case "ilegible":
        return { bg: colors.errorLight, text: colors.errorDark, label: "Rechazada" };
      default:
        return { bg: colors.gray100, text: colors.textSecondary, label: "Desconocido" };
    }
  };

  const getEstadoPedidoConfig = (estado: EstadoPedido) => {
    const configs = {
      pagado: { icon: "checkmark-circle", color: colors.successDark, bg: colors.successLight, label: "Ya Pagado" },
      pendiente_de_pago: { icon: "time", color: colors.warningDark, bg: colors.warning, label: "Pago en Proceso" },
      pendiente: { icon: "sync", color: colors.primary, bg: colors.primaryLight, label: "En Revisión" },
      rechazado: { icon: "close-circle", color: colors.errorDark, bg: colors.errorLight, label: "Rechazado" },
      cancelado: { icon: "close-circle", color: colors.textSecondary, bg: colors.gray200, label: "Cancelado" },
      abandonada: { icon: "alert-circle", color: colors.warningDark, bg: colors.warning, label: "Abandonado" },
    };

    return configs[estado] || { icon: "help-circle", color: colors.textSecondary, bg: colors.gray200, label: "Desconocido" };
  };

  const cotizacionesFiltradas = filtroConStock
    ? cotizaciones.filter(c => c.estado === "cotizado")
    : cotizaciones;

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

  return (
    <SafeAreaView style={globalStyles.container} edges={["top"]}>
      <View style={globalStyles.headerWithBorder}>
        <Pressable onPress={() => router.push("/(tabs)/recetas")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={globalStyles.titleSmall}>Farmacias Cercanas</Text>
        <Pressable onPress={() => loadDatos()} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      {recetaBloqueada && pedidoActivoReceta && (
        <View style={[styles.bloqueoRecetaBanner, { backgroundColor: getEstadoPedidoConfig(pedidoActivoReceta.estado).bg }]}>
          <View style={styles.bloqueoHeader}>
            <Ionicons 
              name={getEstadoPedidoConfig(pedidoActivoReceta.estado).icon as any}
              size={28} 
              color={getEstadoPedidoConfig(pedidoActivoReceta.estado).color}
            />
            <View style={styles.bloqueoInfo}>
              <Text style={[styles.bloqueoTitulo, { color: getEstadoPedidoConfig(pedidoActivoReceta.estado).color }]}>
                {getEstadoPedidoConfig(pedidoActivoReceta.estado).label}
              </Text>
              <Text style={[styles.bloqueoSubtitulo, { color: getEstadoPedidoConfig(pedidoActivoReceta.estado).color }]}>
                {pedidoActivoReceta.estado === 'pagado' 
                  ? `Ya compraste en ${pedidoActivoReceta.nombreComercialFarmacia}`
                  : `Farmacia: ${pedidoActivoReceta.nombreComercialFarmacia}`
                }
              </Text>
            </View>
          </View>

          {pedidoActivoReceta.estado !== 'pagado' && (
            <View style={styles.contadorContainer}>
              <Ionicons name="timer-outline" size={20} color={getEstadoPedidoConfig(pedidoActivoReceta.estado).color} />
              <Text style={[styles.contadorTexto, { color: getEstadoPedidoConfig(pedidoActivoReceta.estado).color }]}>
                Tiempo restante: {formatearTiempoRestante(pedidoActivoReceta.fechaCreacion)}
              </Text>
            </View>
          )}

          <Pressable style={styles.verEstadoButton} onPress={() => router.push("/(tabs)/pedidos")}>
            <Text style={[styles.verEstadoButtonText, { color: getEstadoPedidoConfig(pedidoActivoReceta.estado).color }]}>
              {pedidoActivoReceta.estado === 'pagado' ? 'Ver en Mis Pedidos' : 'Ver Estado del Pago'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={getEstadoPedidoConfig(pedidoActivoReceta.estado).color} />
          </Pressable>
        </View>
      )}

      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Mostrar solo con stock</Text>
        <Pressable
          style={[globalStyles.toggle, filtroConStock && globalStyles.toggleActive]}
          onPress={() => setFiltroConStock(!filtroConStock)}
        >
          <View style={[globalStyles.toggleThumb, filtroConStock && globalStyles.toggleThumbActive]} />
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView}>
        {cotizacionesFiltradas.length === 0 ? (
          <View style={globalStyles.emptyContainer}>
            <Ionicons name="file-tray-outline" size={64} color={colors.textTertiary} />
            <Text style={globalStyles.emptyTitle}>Sin solicitudes</Text>
            <Text style={globalStyles.emptyText}>
              {filtroConStock ? "No hay farmacias con stock disponible aún" : "Aún no hay respuestas de farmacias"}
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {cotizacionesFiltradas.map((cotizacion) => {
              const badge = getEstadoBadge(cotizacion.estado);
              const tienePrecio = cotizacion.estado === "cotizado";
              const esCotizacionActiva = pedidoActivoReceta?.cotizacionId === cotizacion.id;

              return (
                <View key={cotizacion.id} style={globalStyles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardInfo}>
                      <Text style={styles.farmaciaName}>{cotizacion.nombreComercial}</Text>
                      <Text style={styles.farmaciaAddress}>{cotizacion.direccion}</Text>
                    </View>
                    <Pressable onPress={() => handleVerDetalles(cotizacion.farmaciaId)} style={styles.detailsButton}>
                      <Ionicons name="chevron-forward" size={24} color={colors.textTertiary} />
                    </Pressable>
                  </View>

                  {esCotizacionActiva && recetaBloqueada && (
                    <View style={styles.cotizacionActivaBadge}>
                      <Ionicons name="radio-button-on" size={16} color={colors.primary} />
                      <Text style={styles.cotizacionActivaTexto}>Pedido en curso</Text>
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    {tienePrecio ? (
                      <>
                        <View style={[globalStyles.badgePill, { backgroundColor: badge.bg, flex: 1 }]}>
                          <Text style={[globalStyles.badgeTextMedium, { color: badge.text }]}>
                            Disponible: ${cotizacion.precio?.toFixed(2)}
                          </Text>
                        </View>
                        
                        {recetaBloqueada ? (
                          <View style={[styles.payButton, styles.disabledButton]}>
                            <Ionicons name="lock-closed" size={16} color={colors.surface} />
                            <Text style={styles.payButtonText}>Bloqueado</Text>
                          </View>
                        ) : (
                          <Pressable
                            style={({ pressed }) => [styles.payButton, pressed && globalStyles.buttonPressed]}
                            onPress={() => handlePagar(cotizacion)}
                          >
                            <Text style={styles.payButtonText}>Pagar</Text>
                          </Pressable>
                        )}
                      </>
                    ) : (
                      <View style={[globalStyles.badgePill, styles.badgeFull, { backgroundColor: badge.bg }]}>
                        <Text style={[globalStyles.badgeTextMedium, { color: badge.text }]}>{badge.label}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={globalStyles.spacer} />
      </ScrollView>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles de Farmacia</Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={28} color={colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Ionicons name="storefront" size={24} color={colors.primary} />
                <View style={styles.detailText}>
                  <Text style={styles.detailLabel}>Nombre</Text>
                  <Text style={styles.detailValue}>{farmaciaSeleccionada?.nombreComercial}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Ionicons name="location" size={24} color={colors.primary} />
                <View style={styles.detailText}>
                  <Text style={styles.detailLabel}>Dirección</Text>
                  <Text style={styles.detailValue}>{farmaciaSeleccionada?.direccion}</Text>
                </View>
              </View>

              {farmaciaSeleccionada?.telefono && (
                <Pressable style={styles.detailSection} onPress={() => handleLlamar(farmaciaSeleccionada.telefono)}>
                  <Ionicons name="call" size={24} color={colors.primary} />
                  <View style={styles.detailText}>
                    <Text style={styles.detailLabel}>Teléfono</Text>
                    <Text style={[styles.detailValue, styles.linkText]}>{farmaciaSeleccionada.telefono}</Text>
                  </View>
                </Pressable>
              )}

              {farmaciaSeleccionada?.email && (
                <Pressable style={styles.detailSection} onPress={() => handleEmail(farmaciaSeleccionada.email)}>
                  <Ionicons name="mail" size={24} color={colors.primary} />
                  <View style={styles.detailText}>
                    <Text style={styles.detailLabel}>Email</Text>
                    <Text style={[styles.detailValue, styles.linkText]}>{farmaciaSeleccionada.email}</Text>
                  </View>
                </Pressable>
              )}

              {farmaciaSeleccionada?.horario && (
                <View style={styles.detailSection}>
                  <Ionicons name="time" size={24} color={colors.primary} />
                  <View style={styles.detailText}>
                    <Text style={styles.detailLabel}>Horario</Text>
                    <Text style={styles.detailValue}>{farmaciaSeleccionada.horario}</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            <Pressable style={styles.modalButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalButtonText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  refreshButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  bloqueoRecetaBanner: { padding: 16, marginHorizontal: 16, marginTop: 12, marginBottom: 8, borderRadius: 12, gap: 12 },
  bloqueoHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  bloqueoInfo: { flex: 1, gap: 4 },
  bloqueoTitulo: { fontSize: 18, fontWeight: "700" },
  bloqueoSubtitulo: { fontSize: 14, fontWeight: "500" },
  contadorContainer: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.1)" },
  contadorTexto: { fontSize: 16, fontWeight: "600", fontVariant: ["tabular-nums"] },
  verEstadoButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 8 },
  verEstadoButtonText: { fontSize: 15, fontWeight: "600" },
  filterContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterLabel: { fontSize: 16, color: colors.textPrimary },
  scrollView: { flex: 1 },
  listContainer: { padding: 16, gap: 16 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  cardInfo: { flex: 1, gap: 4 },
  farmaciaName: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },
  farmaciaAddress: { fontSize: 16, color: colors.textSecondary },
  detailsButton: { padding: 4 },
  cotizacionActivaBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.primaryLight, borderRadius: 6, alignSelf: "flex-start", marginBottom: 12 },
  cotizacionActivaTexto: { fontSize: 13, fontWeight: "600", color: colors.primary },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 12 },
  badgeFull: { alignItems: "center", flex: 1 },
  payButton: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, flex: 1, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 },
  payButtonText: { color: colors.surface, fontSize: 16, fontWeight: "700" },
  disabledButton: { backgroundColor: colors.textSecondary, opacity: 0.7 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 22, fontWeight: "700", color: colors.textPrimary },
  closeButton: { padding: 4 },
  modalBody: { padding: 20 },
  detailSection: { flexDirection: "row", alignItems: "flex-start", gap: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailText: { flex: 1, gap: 4 },
  detailLabel: { fontSize: 14, color: colors.textSecondary, fontWeight: "600" },
  detailValue: { fontSize: 16, color: colors.textPrimary },
  linkText: { color: colors.primary, textDecorationLine: "underline" },
  modalButton: { backgroundColor: colors.primary, marginHorizontal: 20, marginVertical: 20, paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  modalButtonText: { color: colors.surface, fontSize: 16, fontWeight: "700" },
});