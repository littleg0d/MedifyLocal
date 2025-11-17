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
  getDocs,
  doc,
  getDoc,
  query,
  where,
  collectionGroup,
}
 from "firebase/firestore";
import { globalStyles, colors } from "../../assets/styles";
import { Cotizacion, Address, ObraSocial } from "../../assets/types"; 
import { 
  formatObraSocial, 
  formatDate, 
  formatPrice,
  formatAddress
} from "../../src/lib/formatHelpers";

// Definición local de un tipo que extiende Cotizacion con los datos denormalizados del paciente (Receta)
interface CotizacionConReceta extends Cotizacion {
    recetaId: string; // La Cotización original no lo tiene, pero se añade aquí
    userName?: string;
    userEmail?: string;
    userDNI?: string;
    userPhone?: string;
    userAddress?: Address;
    userObraSocial?: ObraSocial;
    imagenUrl?: string; // Imagen de la Receta
}


// Pantalla para ver cotizaciones ya enviadas por la farmacia
export default function MisCotizaciones() {
  const router = useRouter();
  // Usamos el tipo extendido
  const [cotizaciones, setCotizaciones] = useState<CotizacionConReceta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [farmaciaId, setFarmaciaId] = useState<string | null>(null);

  // Carga inicial
  useEffect(() => {
    loadFarmaciaAndCotizaciones();
  }, []);

  // Obtiene el ID de la farmacia (user.uid) y dispara la carga
  const loadFarmaciaAndCotizaciones = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const fId = user.uid;
      setFarmaciaId(fId);
      await loadCotizaciones(fId);
    } catch (error) {
      console.log("❌❌❌❌ Error cargando farmacia:", error); 
      Alert.alert("Error", "No se pudo cargar la información de la farmacia");
    }
  };

  // Logica de carga de cotizaciones usando la subcolección
  const loadCotizaciones = async (fId: string) => {
    try {
      if (!refreshing) {
        setLoading(true);
      }

      // Query: Buscar en todas las subcolecciones farmaciasRespondieron
      const farmaciasRespondieronRef = collectionGroup(db, "farmaciasRespondieron");
      const q = query(farmaciasRespondieronRef, where("farmaciaId", "==", fId));
      
      const snapshot = await getDocs(q); 

      // Para cada respuesta, obtener los datos de la receta padre
      const promises = snapshot.docs.map(async (respuestaDoc) => {
        const respuestaData = respuestaDoc.data();
        
        // El path del documento es: recetas/{recetaId}/farmaciasRespondieron/{farmaciaId}
        const recetaId = respuestaDoc.ref.parent.parent?.id;
        
        if (!recetaId) {
          return null;
        }

        // Obtener datos de la receta
        const recetaRef = doc(db, "recetas", recetaId);
        const recetaSnap = await getDoc(recetaRef); 
        
        if (!recetaSnap.exists()) {
          return null;
        }

        const recetaData = recetaSnap.data();

        // Mapeo a CotizacionConReceta
        return {
          // Datos de la Cotización (desde respuestaData)
          id: respuestaData.cotizacionId || respuestaDoc.id,
          farmaciaId: fId,
          nombreComercial: respuestaData.nombreComercial || "",
          direccion: respuestaData.direccion || "",
          estado: respuestaData.estado || "cotizado",
          descripcion: respuestaData.descripcion, 
          precio: respuestaData.precio,
          fechaCreacion: respuestaData.fechaRespuesta?.toDate(), // Asume que fechaRespuesta es un Timestamp
          
          // Datos de la Receta (desde recetaData)
          recetaId: recetaId,
          userName: recetaData.userName,
          userEmail: recetaData.userEmail,
          userPhone: recetaData.userPhone,
          userDNI: recetaData.userDNI,
          userObraSocial: (recetaData.userObraSocial || undefined) as ObraSocial | undefined, 
          userAddress: (recetaData.userAddress || undefined) as Address | undefined, 
          imagenUrl: recetaData.imagenUrl,
        } as CotizacionConReceta;
      });

      const results = await Promise.all(promises);
      const filteredCotizaciones = results.filter((c): c is CotizacionConReceta => c !== null);

      // Ordenar por fecha mas reciente (localmente)
      filteredCotizaciones.sort((a, b) => {
        // Corrección en la lógica de ordenamiento para asegurar que se comparan fechas válidas
        const aTime = a.fechaCreacion instanceof Date ? a.fechaCreacion.getTime() : 0;
        const bTime = b.fechaCreacion instanceof Date ? b.fechaCreacion.getTime() : 0;
        return bTime - aTime;
      });

      setCotizaciones(filteredCotizaciones);

    } catch (error) {
      console.log("❌❌❌❌ Error cargando cotizaciones (Firebase):", error); 
      Alert.alert(
        "Error de consulta",
        "No se pudieron cargar las cotizaciones."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    if (farmaciaId) {
      setRefreshing(true);
      await loadCotizaciones(farmaciaId);
    }
  };

  // Helper para badges
  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { label: string; color: string; bg: string }> = {
      cotizado: { label: "Cotizado", color: "#10B981", bg: "#D1FAE5" },
      no_disponible: { label: "No Disponible", color: "#EF4444", bg: "#FEE2E2" },
      sin_stock: { label: "Sin Stock", color: "#F59E0B", bg: "#FEF3C7" },
      rechazada: { label: "Rechazada", color: "#EF4444", bg: "#FEE2E2" },
    };

    const estadoInfo = estados[estado] || {
      label: estado,
      color: "#6B7280",
      bg: "#F3F4F6",
    };

    return (
      <View style={[styles.badge, { backgroundColor: estadoInfo.bg }]}>
        <Text style={[styles.badgeText, { color: estadoInfo.color }]}>
          {estadoInfo.label}
        </Text>
      </View>
    );
  };

  // Render de carga
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Mis Cotizaciones</Text>
        </View>
        <View style={styles.centerRow}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando cotizaciones...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render principal
  return (
    <SafeAreaView style={globalStyles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Mis Cotizaciones</Text>
      </View>

      <ScrollView
        style={globalStyles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {cotizaciones.length === 0 ? (
          <>
            <View style={styles.emptyContainer}>
              <Ionicons
                name="receipt-outline"
                size={64}
                color={colors.textTertiary}
              />
              <Text style={styles.emptyText}>No hay cotizaciones</Text>
              <Text style={styles.emptySubtext}>
                Tus respuestas a recetas aparecerán aquí
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.cotizacionesList}>
            {cotizaciones.map((cotizacion) => (
              <View
                key={`${cotizacion.recetaId}-${cotizacion.id}`}
                style={styles.cotizacionCard}
              >
                {/* Header */}
                <View style={styles.cotizacionHeader}>
                  <Text style={styles.cotizacionId}>
                    Receta #{cotizacion.recetaId.slice(0, 8)}
                  </Text>
                  {getEstadoBadge(cotizacion.estado)}
                </View>

                {/* Informacion del Paciente */}
                {cotizacion.userName && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={colors.textTertiary}
                    />
                    <Text style={styles.infoText}>
                      Paciente: {cotizacion.userName}
                    </Text>
                  </View>
                )}

                {cotizacion.userEmail && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color={colors.textTertiary}
                    />
                    <Text style={styles.infoText}>
                      {cotizacion.userEmail}
                    </Text>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <Ionicons
                    name="medical-outline"
                    size={18}
                    color={colors.textTertiary}
                  />
                  {/* userObraSocial ahora es un objeto ObraSocial | undefined */}
                  <Text style={styles.infoText}>
                    {formatObraSocial(cotizacion.userObraSocial)}
                  </Text>
                </View>

                {cotizacion.userDNI && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="card-outline"
                      size={18}
                      color={colors.textTertiary}
                    />
                    <Text style={styles.infoText}>
                      DNI: {cotizacion.userDNI}
                    </Text>
                  </View>
                )}

                {cotizacion.userPhone && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="call-outline"
                      size={18}
                      color={colors.textTertiary}
                    />
                    <Text style={styles.infoText}>
                      Tel: {cotizacion.userPhone}
                    </Text>
                  </View>
                )}

                {cotizacion.userAddress && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={colors.textTertiary}
                    />
                    {/* userAddress ahora es un objeto Address | undefined */}
                    <Text style={styles.infoText}>
                      {formatAddress(cotizacion.userAddress)}
                    </Text>
                  </View>
                )}

                {/* Divider */}
                <View style={styles.divider} />

                {/* Informacion de la Cotizacion */}
                {cotizacion.precio != null && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="cash-outline"
                      size={18}
                      color={colors.primary}
                    />
                    <Text style={[styles.infoText, styles.precioText]}>
                      ${formatPrice(cotizacion.precio)}
                    </Text>
                  </View>
                )}

                {cotizacion.descripcion && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="document-text-outline"
                      size={18}
                      color={colors.textTertiary}
                    />
                    <Text style={styles.infoText}>
                      {cotizacion.descripcion}
                    </Text>
                  </View>
                )}

                {cotizacion.fechaCreacion && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color={colors.textTertiary}
                    />
                    <Text style={styles.infoTextSmall}>
                      Respondido: {formatDate(cotizacion.fechaCreacion)}
                    </Text>
                  </View>
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
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
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
  cotizacionesList: {
    gap: 12,
    padding: 16,
  },
  cotizacionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cotizacionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cotizacionId: {
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
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
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
  precioText: {
    fontWeight: "700",
    fontSize: 16,
    color: colors.primary,                                       
  },
  infoTextSmall: {
    fontSize: 13,
    color: colors.textTertiary,
  },
});