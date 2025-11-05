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
import { globalStyles, colors } from "../../assets/styles";
import { auth, db } from "../../src/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

interface Pedido {
  id: string;
  userId: string;
  recetaId: string;
  cotizacionId: string;
  farmaciaId: string;
  precio: number;
  estado: "pagado" | "entregado";
  fechaCreacion: Date;
  fechaPago?: Date;
}

interface DetallePedido {
  pedidoNumero: number;
  farmacia: {
    nombre: string;
    direccion: string;
  };
  usuario: {
    nombre: string;
    direccionEnvio: string;
    obraSocial: string;
  };
  precio: number;
  estado: string;
  fecha: string;
}

export default function Pedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [detalleSeleccionado, setDetalleSeleccionado] = useState<DetallePedido | null>(null);

  useEffect(() => {
    loadPedidos();
  }, []);

  const loadPedidos = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;

      if (!user) {
        Alert.alert("Error", "Debes iniciar sesión para ver tus pedidos.");
        return;
      }

      const pedidosRef = collection(db, "pedidos");
      const q = query(
        pedidosRef,
        where("userId", "==", user.uid),
        orderBy("fechaCreacion", "desc")
      );

      const querySnapshot = await getDocs(q);

      const pedidosData: Pedido[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        pedidosData.push({
          id: doc.id,
          userId: data.userId,
          recetaId: data.recetaId,
          cotizacionId: data.cotizacionId,
          farmaciaId: data.farmaciaId,
          precio: data.precio,
          estado: data.estado,
          fechaCreacion: data.fechaCreacion.toDate(),
          fechaPago: data.fechaPago?.toDate(),
        });
      });

      setPedidos(pedidosData);
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
      Alert.alert("Error", "No pudimos cargar los pedidos.");
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "pagado":
        return {
          bg: colors.warning,
          text: colors.warningDark,
          label: "Pagado - Próximo a enviar",
        };
      case "entregado":
        return {
          bg: colors.successLight,
          text: colors.successDark,
          label: "Completado",
        };
      default:
        return {
          bg: colors.gray200,
          text: colors.gray700,
          label: estado,
        };
    }
  };

  const formatDate = (date: Date) => {
    return `${date.getDate()} de ${
      [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
      ][date.getMonth()]
    }, ${date.getFullYear()}`;
  };

  const handleVerDetalle = async (pedido: Pedido, index: number) => {
    try {
      // Obtener datos del usuario
      const userDocRef = doc(db, "users", pedido.userId);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();

      // Obtener datos de la cotización (que tiene info de la farmacia)
      const cotizacionRef = doc(db, "recetas", pedido.recetaId, "cotizaciones", pedido.cotizacionId);
      const cotizacionDoc = await getDoc(cotizacionRef);
      const cotizacionData = cotizacionDoc.data();

      const detalle: DetallePedido = {
        pedidoNumero: pedidos.length - index,
        farmacia: {
          nombre: cotizacionData?.nombreComercial || "Farmacia no disponible",
          direccion: cotizacionData?.direccion || "Dirección no disponible",
        },
        usuario: {
          nombre: `${userData?.firstName || ""} ${userData?.lastName || ""}`.trim() || "Usuario",
          direccionEnvio: `${userData?.address?.street || ""}, ${userData?.address?.city || ""}, ${userData?.address?.province || ""}`.trim() || "Dirección no configurada",
          obraSocial: userData?.obraSocial?.name || "Sin obra social",
        },
        precio: pedido.precio,
        estado: pedido.estado === "pagado" ? "Pagado - Próximo a enviar" : "Completado",
        fecha: formatDate(pedido.fechaCreacion),
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
        <View style={{ width: 48 }} />
        <Text style={globalStyles.titleMedium}>Mis Pedidos</Text>
        <View style={{ width: 48 }} />
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

              return (
                <Pressable
                  key={pedido.id}
                  style={({ pressed }) => [
                    globalStyles.cardSimple,
                    pressed && globalStyles.cardPressed,
                  ]}
                  onPress={() => handleVerDetalle(pedido, index)}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.cardInfo}>
                      <View style={styles.cardHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.pedidoTitle}>
                            Pedido {pedidoNumero}
                          </Text>
                          <Text style={styles.pedidoDate}>
                            {formatDate(pedido.fechaCreacion)}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={colors.textTertiary} />
                      </View>

                      <View style={styles.cardBody}>
                        <View
                          style={[
                            globalStyles.badge,
                            { backgroundColor: badge.bg },
                          ]}
                        >
                          <Text style={[globalStyles.badgeText, { color: badge.text }]}>
                            {badge.label}
                          </Text>
                        </View>

                        <Text style={styles.precio}>
                          ${pedido.precio.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={globalStyles.spacer} />
      </ScrollView>

      {/* Modal de detalle */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Detalle del Pedido {detalleSeleccionado?.pedidoNumero}
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Farmacia */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Farmacia</Text>
                <View style={styles.modalInfo}>
                  <Ionicons name="storefront-outline" size={20} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalText}>{detalleSeleccionado?.farmacia.nombre}</Text>
                    <Text style={styles.modalTextSecondary}>{detalleSeleccionado?.farmacia.direccion}</Text>
                  </View>
                </View>
              </View>

              {/* Usuario */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Datos del cliente</Text>
                <View style={styles.modalInfo}>
                  <Ionicons name="person-outline" size={20} color={colors.primary} />
                  <Text style={styles.modalText}>{detalleSeleccionado?.usuario.nombre}</Text>
                </View>
              </View>

              {/* Dirección de envío */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Dirección de envío</Text>
                <View style={styles.modalInfo}>
                  <Ionicons name="location-outline" size={20} color={colors.primary} />
                  <Text style={styles.modalText}>{detalleSeleccionado?.usuario.direccionEnvio}</Text>
                </View>
              </View>

              {/* Obra Social */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Obra Social</Text>
                <View style={styles.modalInfo}>
                  <Ionicons name="medical-outline" size={20} color={colors.primary} />
                  <Text style={styles.modalText}>{detalleSeleccionado?.usuario.obraSocial}</Text>
                </View>
              </View>

              {/* Estado */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Estado</Text>
                <View style={styles.modalInfo}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
                  <Text style={styles.modalText}>{detalleSeleccionado?.estado}</Text>
                </View>
              </View>

              {/* Fecha */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Fecha</Text>
                <View style={styles.modalInfo}>
                  <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                  <Text style={styles.modalText}>{detalleSeleccionado?.fecha}</Text>
                </View>
              </View>

              {/* Precio */}
              <View style={[styles.modalSection, styles.modalPriceSection]}>
                <Text style={styles.modalSectionTitle}>Total</Text>
                <Text style={styles.modalPrice}>${detalleSeleccionado?.precio.toFixed(2)}</Text>
              </View>
            </ScrollView>

            <Pressable
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  precio: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
  },
  // Estilos del Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
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
  modalTextSecondary: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
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
  modalCloseButton: {
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.surface,
  },
});