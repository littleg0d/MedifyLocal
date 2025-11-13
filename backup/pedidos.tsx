import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { globalStyles, colors } from "../assets/styles"; // ⚠️ Ajusta tu ruta
import { auth, db } from "../src/lib/firebase"; // ⚠️ Ajusta tu ruta
import {
  doc,
  getDoc,
  Timestamp, // ✅ Necesitamos Timestamp para el mapeo
} from "firebase/firestore"; // ❌ Eliminamos query, where, onSnapshot, etc.
import { useRouter } from "expo-router";

// ------------------- IMPORTACIONES CENTRALIZADAS -------------------
import type {
  Pedido,
  EstadoPedido, // ✅ Importamos los tipos que necesitamos
  DetallePedido,
  EstadoConfig,
  PAYMENT_CONFIG, // ✅ Importamos la config
} from "../assets/types"; // ⚠️ Ajusta tu ruta

// ✅ ¡ESTE ES EL IMPORT CORRECTO!
import { usePedidosDelUsuario } from "../src/hooks/usePedidosDelUsuario";
// -----------------------------------------------------------------

export default function Pedidos() {
  const router = useRouter();
  // ❌ Eliminamos useState para 'pedidos' y 'loading'
  const [modalVisible, setModalVisible] = useState(false);
  const [detalleSeleccionado, setDetalleSeleccionado] =
    useState<DetallePedido | null>(null);

  // ❌ ELIMINAMOS el 'useEffect' que hacía el 'onSnapshot' manual
  
  // ✅ ¡AQUÍ USAMOS EL HOOK!
  // 'usePedidosDelUsuario' ya hace el onSnapshot y nos da los datos en tiempo real
  const { pedidos, loading } = usePedidosDelUsuario();


  // ✅ getEstadoBadge (usando los tipos de assets/types.ts)
  const getEstadoBadge = (estado: EstadoPedido): EstadoConfig => { // Usamos EstadoConfig
    const badges: Record<EstadoPedido, EstadoConfig> = {
      pendiente_de_pago: {
        bg: colors.warning,
        color: colors.warningDark,
        label: "Esperando pago",
        icon: "time-outline",
      },
      pagado: {
        bg: colors.successLight,
        color: colors.successDark,
        label: "Pagado",
        icon: "checkmark-circle-outline",
      },
      rechazada: { // Asumiendo que 'rechazado' se mapea a 'rechazada'
        bg: colors.errorLight,
        color: colors.errorDark,
        label: "Rechazado",
        icon: "close-circle-outline",
      },
      abandonada: {
        bg: colors.gray200,
        color: colors.gray700,
        label: "Abandonado",
        icon: "alert-circle-outline",
      },
      pendiente: {
        bg: colors.primaryLight,
        color: colors.primaryDark,
        label: "Pendiente",
        icon: "hourglass-outline",
      },
      desconocido: {
        bg: colors.gray200,
        color: colors.gray700,
        label: "Desconocido",
        icon: "help-circle-outline",
      },
      // ❌ 'cancelado' ya no está en tus tipos
    };

    return badges[estado] || badges.desconocido;
  };

  // ✅ handleReintentarPago (simplificado)
  const handleReintentarPago = (pedido: Pedido) => {
    // ❌ Eliminamos la lógica de 'edadMinutos' y 'puedeReintentarPago'
    Alert.alert(
      "Reintentar Pago",
      "¿Deseas volver a intentar el pago para este pedido?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, reintentar",
          onPress: () => {
            router.push({
              pathname: "/pagar",
              params: {
                recetaId: pedido.recetaId,
                cotizacionId: pedido.cotizacionId,
              },
            });
          },
        },
      ]
    );
  };

  const formatDate = (date: Date): string => {
    const meses = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
    ];
    
    return `${date.getDate()} de ${meses[date.getMonth()]}, ${date.getFullYear()}`;
  };

  const handleVerDetalle = async (pedido: Pedido, index: number) => {
    try {
      const userDocRef = doc(db, "users", pedido.userId);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();

      const cotizacionRef = doc(
        db,
        "recetas",
        pedido.recetaId,
        "cotizaciones",
        pedido.cotizacionId
      );
      const cotizacionDoc = await getDoc(cotizacionRef);
      const cotizacionData = cotizacionDoc.data();

      let direccionEnvio = "Dirección no configurada";
      if (pedido.addressUser) {
        const addr = pedido.addressUser;
        direccionEnvio = `${addr.street}, ${addr.city}, ${addr.province}`;
      } else if (userData?.address) {
        const addr = userData.address;
        direccionEnvio = `${addr.street || ""}, ${addr.city || ""}, ${addr.province || ""}`.trim();
      }

      const detalle: DetallePedido = {
        pedido: pedido,
        pedidoNumero: pedidos.length - index,
        farmacia: {
          nombre: cotizacionData?.nombreComercial || "Farmacia no disponible",
          direccion: cotizacionData?.direccion || "Dirección no disponible",
        },
        usuario: {
          nombre:
            `${userData?.firstName || ""} ${userData?.lastName || ""}`.trim() ||
            "Usuario",
          direccionEnvio: direccionEnvio,
          obraSocial: userData?.obraSocial?.name || "Sin obra social",
        },
      };

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

  return (
    <SafeAreaView style={globalStyles.container} edges={["top"]}>
      <View style={globalStyles.header}>
        <View style={styles.placeholder} />
        <Text style={globalStyles.titleMedium}>Mis Pedidos</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {pedidos.length === 0 ? (
          <View style={globalStyles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color={colors.textMutedDark} />
            <Text style={globalStyles.emptyTitle}>Sin pedidos aún</Text>
            <Text style={globalStyles.emptyText}>
              Cuando realices tu primer pedido, aparecerá aquí
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {pedidos.map((pedido, index) => {
              const badge = getEstadoBadge(pedido.estado);
              const pedidoNumero = pedidos.length - index;
              
              // ✅ LÓGICA DE REINTENTO SIMPLIFICADA
              const puedeReintentar = PAYMENT_CONFIG.ESTADOS_FALLIDOS.includes(
                pedido.estado as any
              );

              return (
                <View key={pedido.id} style={globalStyles.cardSimple}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.cardContent,
                      pressed && globalStyles.cardPressed,
                    ]}
                    onPress={() => handleVerDetalle(pedido, index)}
                  >
                    <View style={styles.cardInfo}>
                      <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderInfo}>
                          <Text style={styles.pedidoTitle}>Pedido #{pedidoNumero}</Text>
                          <Text style={styles.pedidoDate}>
                            {formatDate(pedido.fechaCreacion)}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={colors.textTertiary} />
                      </View>

                      <View style={styles.cardBody}>
                        <View style={[globalStyles.badge, { backgroundColor: badge.bg }]}>
                          <Ionicons
                            name={badge.icon as any}
                            size={14}
                            color={badge.color}
                            style={styles.badgeIcon}
                          />
                          <Text style={[globalStyles.badgeText, { color: badge.color }]}>
                            {badge.label}
                          </Text>
                        </View>

                        <Text style={styles.precio}>${pedido.precio.toFixed(2)}</Text>
                      </View>
                    </View>
                  </Pressable>

                  {puedeReintentar && (
                    <Pressable
                      style={({ pressed }) => [
                        styles.retryButton,
                        pressed && globalStyles.buttonPressed,
                      ]}
                      onPress={() => handleReintentarPago(pedido)}
                    >
                      <Ionicons name="refresh" size={16} color={colors.primary} />
                      <Text style={styles.retryButtonText}>Reintentar pago</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={globalStyles.spacer} />
      </ScrollView>

      {/* --- Modal --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={globalStyles.modalOverlay}>
          <View style={globalStyles.modalContent}>
            <View style={globalStyles.modalHeader}>
              <Text style={globalStyles.modalTitle}>
                Pedido #{detalleSeleccionado?.pedidoNumero}
              </Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.iconButton}>
                <Ionicons name="close" size={28} color={colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Estado</Text>
                <View style={styles.modalInfo}>
                  {(() => {
                    const badge = getEstadoBadge(
                      detalleSeleccionado?.pedido.estado || "desconocido"
                    );
                    return (
                      <>
                        <Ionicons name={badge.icon as any} size={20} color={badge.color} />
                        <Text style={styles.modalText}>{badge.label}</Text>
                      </>
                    );
                  })()}
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Medicamento</Text>
                <View style={styles.modalInfo}>
                  <Ionicons name="medical-outline" size={20} color={colors.primary} />
                  <Text style={[styles.modalText, styles.modalTextFlex]}>
                    {detalleSeleccionado?.farmacia.nombre}
                  </Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Datos del cliente</Text>
                <View style={styles.modalInfo}>
                  <Ionicons name="person-outline" size={20} color={colors.primary} />
                  <Text style={styles.modalText}>
                    {detalleSeleccionado?.usuario.nombre}
                  </Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Dirección de envío</Text>
                <View style={styles.modalInfo}>
                  <Ionicons name="location-outline" size={20} color={colors.primary} />
                  <Text style={styles.modalText}>
                    {detalleSeleccionado?.usuario.direccionEnvio}
                  </Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Obra Social</Text>
                <View style={styles.modalInfo}>
                  <Ionicons name="medkit-outline" size={20} color={colors.primary} />
                  <Text style={styles.modalText}>
                    {detalleSeleccionado?.usuario.obraSocial}
                  </Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Fecha de creación</Text>
                <View style={styles.modalInfo}>
                  <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                  <Text style={styles.modalText}>
                    {detalleSeleccionado?.pedido.fechaCreacion &&
                      formatDate(detalleSeleccionado.pedido.fechaCreacion)}
                  </Text>
                </View>
              </View>

              {detalleSeleccionado?.pedido.fechaPago && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Fecha de pago</Text>
                  <View style={styles.modalInfo}>
                    <Ionicons name="card-outline" size={20} color={colors.primary} />
                    <Text style={styles.modalText}>
                      {formatDate(detalleSeleccionado.pedido.fechaPago)}
                    </Text>
                  </View>
                </View>
              )}

              {detalleSeleccionado?.pedido.paymentId && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>ID de pago</Text>
                  <View style={styles.modalInfo}>
                    <Ionicons name="receipt-outline" size={20} color={colors.primary} />
                    <Text style={styles.modalText}>
                      {detalleSeleccionado.pedido.paymentId}
                    </Text>
                  </View>
                </View>
              )}

              <View style={[styles.modalSection, styles.modalPriceSection]}>
                <Text style={styles.modalSectionTitle}>Total</Text>
                <Text style={styles.modalPrice}>
                  ${detalleSeleccionado?.pedido.precio.toFixed(2)}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              {detalleSeleccionado &&
                PAYMENT_CONFIG.ESTADOS_FALLIDOS.includes(
                  detalleSeleccionado.pedido.estado as any
                ) && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalRetryButton,
                      pressed && globalStyles.buttonPressed,
                    ]}
                    onPress={() => {
                      setModalVisible(false);
                      handleReintentarPago(detalleSeleccionado.pedido);
                    }}
                  >
                    <Ionicons name="refresh" size={20} color={colors.surface} />
                    <Text style={styles.modalRetryButtonText}>Reintentar pago</Text>
                  </Pressable>
                )}

              <Pressable
                style={({ pressed }) => [
                  styles.modalCloseButton,
                  pressed && globalStyles.buttonPressed,
                ]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCloseButtonText}>Cerrar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ✅ ESTILOS (los que tenías antes)
const styles = StyleSheet.create({
  placeholder: {
    width: 48,
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
  cardContent: {
    padding: 16,
  },
  cardInfo: {
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardHeaderInfo: {
    flex: 1,
  },
  pedidoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  pedidoDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  cardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgeIcon: {
    marginRight: 4,
  },
  precio: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },
  modalOverlay: { // Añadido desde el 'Pedidos.tsx' original
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: { // Añadido desde el 'Pedidos.tsx' original
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: "80%",
  },
  modalHeader: { // Añadido desde el 'Pedidos.tsx' original
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { // Añadido desde el 'Pedidos.tsx' original
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  modalBody: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textTertiary,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  modalInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 12,
  },
  modalText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  modalTextFlex: {
    flex: 1,
  },
  modalPriceSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    padding: 16,
    borderRadius: 12,
  },
  modalPrice: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.primary,
  },
  modalFooter: {
    padding: 20,
    gap: 12,
  },
  modalRetryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  modalRetryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.surface,
  },
  modalCloseButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
});