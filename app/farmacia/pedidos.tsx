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
  doc,
  updateDoc,
  onSnapshot, 
} from "firebase/firestore";
import { globalStyles, colors } from "../../assets/styles";
import { Pedido, Address, ObraSocial } from "../../assets/types"; // ✅ Importar tipos de objetos
import { formatAddress, formatObraSocial, formatCurrency } from "../../src/lib/formatHelpers";

export default function FarmaciaPedidos() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); 
  const [farmaciaId, setFarmaciaId] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    const fId = user.uid;
    setFarmaciaId(fId);

    const unsubscribe = listenForPedidos(fId); 

    return () => {
      unsubscribe();
    };
  }, []);

  const listenForPedidos = (fId: string): () => void => {
    try {
      if (!refreshing) {
        setLoading(true);
      }

      const pedidosRef = collection(db, "pedidos");
      const q = query(
        pedidosRef,
        where("farmaciaId", "==", fId),
        where("estado", "in", ["pagado", "entregado"])
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        
        const pedidosData: Pedido[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            userId: data.userId || "",
            recetaId: data.recetaId || "",
            cotizacionId: data.cotizacionId || "",
            farmaciaId: data.farmaciaId || "",
            
            // Datos del Usuario (Corrección aplicada aquí)
            userName: data.userName || "",
            userEmail: data.userEmail,
            userDNI: data.userDNI,
            userPhone: data.userPhone,
            userAddress: (data.userAddress || {}) as Address, // ✅ Asegurar que es un objeto Address
            userObraSocial: (data.userObraSocial || {}) as ObraSocial, // ✅ Asegurar que es un objeto ObraSocial
            
            // Datos de la Farmacia
            nombreComercial: data.nombreComercial || "",
            farmEmail: data.farmEmail,
            farmPhone: data.farmPhone,
            farmAddress: data.farmAddress || "",
            horario: data.horario,
            
            // Datos del Pedido
            precio: data.precio || 0,
            descripcion: data.descripcion,
            imagenUrl: data.imagenUrl,
            estado: data.estado || "pendiente",
            
            // Fechas
            fechaCreacion: data.fechaCreacion?.toDate() || new Date(),
            fechaPago: data.fechaPago?.toDate() || null,
            fechaCierre: data.fechaCierre?.toDate(),
            
            // MercadoPago
            paymentId: data.paymentId,
            paymentStatus: data.paymentStatus,
          } as Pedido;
        });

        // Ordenar por fecha más reciente
        pedidosData.sort((a, b) => {
          return b.fechaCreacion.getTime() - a.fechaCreacion.getTime();
        });

        setPedidos(pedidosData);
        setLoading(false);
        setRefreshing(false);
      }, (error) => {
        console.error("❌ Error en onSnapshot (Firebase):", error); 
        Alert.alert(
          "Error de consulta en tiempo real",
          "No se pudieron cargar los pedidos. Es posible que falte un índice en la base de datos (farmaciaId y estado)."
        );
        setLoading(false);
        setRefreshing(false);
      });
      
      return unsubscribe;
      
    } catch (error) {
      console.error("❌ Error al configurar el listener de pedidos:", error);
      setLoading(false);
      setRefreshing(false);
      return () => {};
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000); 
  };

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
                fechaCierre: new Date(),
              });
            } catch (error) {
              console.error("❌ Error al actualizar el pedido (Firebase):", error); 
              Alert.alert("Error", "No se pudo actualizar el estado del pedido.");
            }
          },
        },
      ]
    );
  };
  
  

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { label: string; color: string; bg: string }> = {
      pagado: { label: "Pagado", color: "#10B981", bg: "#D1FAE5" },
      entregado: { label: "Entregado", color: "#6B7280", bg: "#F3F4F6" },
    };

    const estadoInfo = estados[estado] || {
      label: estado,
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
            <Ionicons name="cart-outline" size={64} color={colors.textTertiary} />
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

                {pedido.userName && (
                  <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={18} color={colors.textTertiary} />
                    <Text style={styles.infoText}>Cliente: {pedido.userName}</Text>
                  </View>
                )}

                {pedido.userEmail && (
                  <View style={styles.infoRow}>
                    <Ionicons name="mail-outline" size={18} color={colors.textTertiary} />
                    <Text style={styles.infoText}>{pedido.userEmail}</Text>
                  </View>
                )}

                {pedido.userPhone && (
                  <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={18} color={colors.textTertiary} />
                    <Text style={styles.infoText}>Tel: {pedido.userPhone}</Text>
                  </View>
                )}

                {pedido.userDNI && (
                  <View style={styles.infoRow}>
                    <Ionicons name="card-outline" size={18} color={colors.textTertiary} />
                    <Text style={styles.infoText}>DNI: {pedido.userDNI}</Text>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <Ionicons name="medical-outline" size={18} color={colors.textTertiary} />
                  <Text style={styles.infoText}>
                    {formatObraSocial(pedido.userObraSocial)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="cash-outline" size={18} color={colors.textTertiary} />
                  <Text style={styles.infoText}>
                    Precio: {formatCurrency(pedido.precio)}
                  </Text>
                </View>

                {pedido.descripcion && (
                  <View style={styles.infoRow}>
                    <Ionicons name="document-text-outline" size={18} color={colors.textTertiary} />
                    <Text style={styles.infoText}>{pedido.descripcion}</Text>
                  </View>
                )}

                {pedido.userAddress && (
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={18} color={colors.textTertiary} />
                    <Text style={styles.infoText}>{formatAddress(pedido.userAddress)}</Text>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={18} color={colors.textTertiary} />
                  <Text style={styles.infoTextSmall}>
                    {formatDate(pedido.fechaCreacion)}
                  </Text>
                </View>

                {pedido.estado === "pagado" && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.entregadoButton,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => handleMarcarEntregado(pedido.id)}
                  >
                    <Ionicons name="checkmark-done-outline" size={18} color="white" />
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
    paddingHorizontal: 16,
    paddingVertical: 16,
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