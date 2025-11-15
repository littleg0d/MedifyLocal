// app/farmacia/pedidos.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../src/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { globalStyles, colors } from "../../assets/styles";

interface Pedido {
  id: string;
  userObraSocial?: {
    name: string;
    number: string;
  };
  precio?: number;
  descripcion?: string;
  userAddress?: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
  };
  estado?: string;
  fechaCreacion?: any;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userDNI?: string;
  userPhone?: string;
  imagenUrl?: string;
}

/**
 * Helper para formatear Obra Social
 */
const formatObraSocial = (os?: { name: string; number?: string }) => {
  if (!os || !os.name) {
    return "Sin obra social";
  }
  if (os.number) {
    return `${os.name} (${os.number})`;
  }
  return os.name;
};

export default function FarmaciaPedidos() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [farmaciaId, setFarmaciaId] = useState<string | null>(null);

  useEffect(() => {
    loadFarmaciaAndPedidos();
  }, []);

  const loadFarmaciaAndPedidos = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const farmaciaRef = doc(db, "farmacias", user.uid);
      const farmaciaSnap = await getDoc(farmaciaRef);

      let fId = user.uid;
      if (farmaciaSnap.exists()) {
        fId = farmaciaSnap.id;
      }

      setFarmaciaId(fId);
      await loadPedidos(fId);
    } catch (error) {
      console.error("Error cargando farmacia:", error);
    }
  };

  const loadPedidos = async (fId: string) => {
    try {
      setLoading(true);

      const pedidosRef = collection(db, "pedidos");

      // ✅ CAMBIO: Query para filtrar SOLO pagados o entregados
      const q = query(
        pedidosRef,
        where("farmaciaId", "==", fId),
        where("estado", "in", ["pagado", "entregado"]) // <-- Lógica actualizada
      );

      const snapshot = await getDocs(q);
      const pedidosData: Pedido[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Pedido[];

      // Ordenar manualmente por fecha (más confiable)
      pedidosData.sort((a, b) => {
        if (!a.fechaCreacion || !b.fechaCreacion) return 0;
        const aTime = a.fechaCreacion.seconds || 0;
        const bTime = b.fechaCreacion.seconds || 0;
        return bTime - aTime; // Más reciente primero
      });

      setPedidos(pedidosData);
    } catch (error) {
      console.error("Error cargando pedidos:", error);
      Alert.alert(
        "Error de consulta",
        "No se pudieron cargar los pedidos. Es posible que falte un índice en la base de datos (farmaciaId y estado). Revisa la consola para más detalles."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    if (farmaciaId) {
      setRefreshing(true);
      await loadPedidos(farmaciaId);
    }
  };

  /**
   * Función para marcar como 'entregado'
   */
  const handleMarcarEntregado = async (pedidoId: string) => {
    Alert.alert(
      "Confirmar Entrega",
      "¿Estás seguro de que este pedido ya fue entregado al cliente?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, fue entregado",
          style: "destructive",
          onPress: async () => {
            try {
              const pedidoRef = doc(db, "pedidos", pedidoId);
              await updateDoc(pedidoRef, {
                estado: "entregado",
              });
              await onRefresh(); // Recargar la lista
            } catch (error) {
              console.error("Error al actualizar el pedido:", error);
              Alert.alert(
                "Error",
                "No se pudo actualizar el estado del pedido."
              );
            }
          },
        },
      ]
    );
  };

  const formatPrice = (price?: number) => {
    if (!price) return "Sin precio";
    return `$${price.toLocaleString("es-AR")}`;
  };

  const formatDate = (timestamp?: any) => {
    if (!timestamp) return "";
    try {
      const seconds = timestamp.seconds || 0;
      const date = new Date(seconds * 1000);
      return date.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const getEstadoBadge = (estado?: string) => {
    const estados: Record<
      string,
      { label: string; color: string; bg: string }
    > = {
      // ... (otros estados para referencia)
      pagado: { label: "Pagado", color: "#10B981", bg: "#D1FAE5" },
      en_camino: { label: "En camino", color: "#3B82F6", bg: "#DBEAFE" }, // Se mantiene por si acaso
      entregado: { label: "Entregado", color: "#6B7280", bg: "#F3F4F6" },
    };

    const estadoInfo = estados[estado || "pendiente"] || {
      label: estado || "Pendiente",
      color: "#F59E0B",
      bg: "#FEF3C7",
    };

    return (
      <View style={[styles.badge, { backgroundColor: estadoInfo.bg }]}>
        <Text style={[styles.badgeText, { color: estadoInfo.color }]}>
          {estadoInfo.label}
        </Text>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Pedidos</Text>
        </View>
        <View style={styles.centerRow}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Pedidos</Text>
      </View>

      <ScrollView
        style={globalStyles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {pedidos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="cart-outline"
              size={64}
              color={colors.textTertiary}
            />
            <Text style={styles.emptyText}>No hay pedidos</Text>
            <Text style={styles.emptySubtext}>
              Los pedidos pagados o entregados aparecerán aquí
            </Text>
          </View>
        ) : (
          <View style={styles.pedidosList}>
            {pedidos.map((pedido) => (
              <View key={pedido.id} style={styles.pedidoCard}>
                <View style={styles.pedidoHeader}>
                  <Text style={styles.pedidoId}>
                    Pedido #{pedido.id.slice(0, 8)}
                  </Text>
                  {getEstadoBadge(pedido.estado)}
                </View>

                {/* Usuario */}
                {pedido.userName && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={colors.textTertiary}
                    />
                    <Text style={styles.infoText}>
                      Cliente: {pedido.userName}
                    </Text>
                  </View>
                )}

                {/* Email */}
                {pedido.userEmail && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color={colors.textTertiary}
                    />
                    <Text style={styles.infoText}>{pedido.userEmail}</Text>
                  </View>
                )}

                {/* Teléfono (Condicional) */}
                {pedido.userPhone && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="call-outline"
                      size={18}
                      color={colors.textTertiary}
                    />
                    <Text style={styles.infoText}>Tel: {pedido.userPhone}</Text>
                  </View>
                )}

                {/* DNI (Condicional) */}
                {pedido.userDNI && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="card-outline"
                      size={18}
                      color={colors.textTertiary}
                    />
                    <Text style={styles.infoText}>DNI: {pedido.userDNI}</Text>
                  </View>
                )}

                {/* Obra Social (Mejorado) */}
                <View style={styles.infoRow}>
                  <Ionicons
                    name="medical-outline"
                    size={18}
                    color={colors.textTertiary}
                  />
                  <Text style={styles.infoText}>
                    {formatObraSocial(pedido.userObraSocial)}
                  </Text>
                </View>

                {/* Precio */}
                <View style={styles.infoRow}>
                  <Ionicons
                    name="cash-outline"
                    size={18}
                    color={colors.textTertiary}
                  />
                  <Text style={styles.infoText}>
                    Precio: {formatPrice(pedido.precio)}
                  </Text>
                </View>

                {/* Descripción */}
                {pedido.descripcion && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="document-text-outline"
                      size={18}
                      color={colors.textTertiary}
                    />
                    <Text style={styles.infoText}>{pedido.descripcion}</Text>
                  </View>
                )}

                {/* Dirección */}
                {pedido.userAddress && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={colors.textTertiary}
                    />
                    <Text style={styles.infoText}>
                      {pedido.userAddress.street}
                      {pedido.userAddress.city &&
                        `, ${pedido.userAddress.city}`}
                    </Text>
                  </View>
                )}

                {/* Fecha */}
                {pedido.fechaCreacion && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color={colors.textTertiary}
                    />
                    <Text style={styles.infoTextSmall}>
                      {formatDate(pedido.fechaCreacion)}
                    </Text>
                  </View>
                )}

                {/* ✅ CAMBIO: Botón condicional */}
                {pedido.estado === "pagado" && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.entregadoButton,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => handleMarcarEntregado(pedido.id)}
                  >
                    <Ionicons
                      name="checkmark-done-outline"
                      size={18}
                      color="white"
                    />
                    <Text style={styles.entregadoButtonText}>
                      Marcar como Entregado
                    </Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  centerRow: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: "center",
  },
  pedidosList: {
    gap: 12,
  },
  pedidoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  pedidoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  pedidoId: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  infoTextSmall: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  // Estilo del botón de entregado
  entregadoButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  entregadoButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});