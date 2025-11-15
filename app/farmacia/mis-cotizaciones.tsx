// app/farmacia/mis-cotizaciones.tsx
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
  Alert, // ✅ Importado
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../src/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query, // ✅ Importado
  where, // ✅ Importado
} from "firebase/firestore";
import { globalStyles, colors } from "../../assets/styles";

interface Cotizacion {
  id: string;
  recetaId: string;
  estado: string;
  descripcion?: string;
  precio?: number;
  fechaRespuesta?: any;
  // Datos de la receta
  direccion?: string;
  recetaDescripcion?: string;
  userName?: string;
  userPhone?: string;
  userDNI?: string;
  userObraSocial?: {
    name: string;
    number?: string;
  };
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

export default function MisCotizaciones() {
  const router = useRouter();
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true); // ✅ Inicia en true
  const [refreshing, setRefreshing] = useState(false);
  const [farmaciaId, setFarmaciaId] = useState<string | null>(null);

  useEffect(() => {
    loadFarmaciaAndCotizaciones();
  }, []);

  const loadFarmaciaAndCotizaciones = async () => {
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
      await loadCotizaciones(fId);
    } catch (error) {
      console.error("Error cargando farmacia:", error);
    }
  };

  const loadCotizaciones = async (fId: string) => {
    try {
      if (!refreshing) {
        setLoading(true);
      }

      const recetasRef = collection(db, "recetas");

      // ✅ CAMBIO: Query eficiente. Excluye recetas finalizadas.
      // Esto PUEDE requerir un índice en Firestore (sobre el campo 'estado')
      const q = query(recetasRef, where("estado", "!=", "finalizada"));

      const recetasSnap = await getDocs(q);

      const misCotizaciones: Cotizacion[] = [];

      for (const recetaDoc of recetasSnap.docs) {
        const recetaData = recetaDoc.data();

        // ❗ Ya no es necesario filtrar por 'finalizada' aquí

        // Buscar si respondimos en esta receta
        const farmaciaRespondioRef = doc(
          db,
          "recetas",
          recetaDoc.id,
          "farmaciasRespondieron",
          fId
        );
        const farmaciaRespondioSnap = await getDoc(farmaciaRespondioRef);

        if (farmaciaRespondioSnap.exists()) {
          const farmaciaData = farmaciaRespondioSnap.data();

          misCotizaciones.push({
            id: farmaciaData.cotizacionId || farmaciaRespondioSnap.id,
            recetaId: recetaDoc.id,
            estado: farmaciaData.estado || "cotizado",
            descripcion: farmaciaData.descripcion,
            precio: farmaciaData.precio,
            fechaRespuesta: farmaciaData.fechaRespuesta,
            // Datos de la receta
            userObraSocial: recetaData.userObraSocial,
            userDNI: recetaData.userDNI,
            userPhone: recetaData.userPhone,
            userName: recetaData.userName,
            direccion: recetaData.userAddress
              ? `${recetaData.userAddress.street}, ${recetaData.userAddress.city}`
              : undefined,
            recetaDescripcion: recetaData.descripcion,
          });
        }
      }

      // Ordenar por fecha más reciente
      misCotizaciones.sort((a, b) => {
        if (!a.fechaRespuesta || !b.fechaRespuesta) return 0;
        const aTime = a.fechaRespuesta.seconds || 0;
        const bTime = b.fechaRespuesta.seconds || 0;
        return bTime - aTime;
      });

      setCotizaciones(misCotizaciones);
    } catch (error) {
      console.error("Error cargando cotizaciones:", error);
      Alert.alert(
        "Error de consulta",
        "No se pudieron cargar las cotizaciones. Es posible que falte un índice en Firestore (sobre el campo 'estado'). Revisa la consola."
      );
    } finally {
      setLoading(false); // ✅ Desactiva el "cargando"
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    if (farmaciaId) {
      setRefreshing(true);
      await loadCotizaciones(farmaciaId);
    }
  };

  const formatPrice = (price?: number) => {
    // ... (formatPrice logic)
  };
  const formatDate = (timestamp?: any) => {
    // ... (formatDate logic)
  };
  const getEstadoBadge = (estado: string) => {
    // ... (getEstadoBadge logic)
  };

  // ✅ VISTA DE CARGANDO
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
          <View style={styles.emptyContainer}>
            {/* ... (empty view) */}
          </View>
        ) : (
          <View style={styles.cotizacionesList}>
            {cotizaciones.map((cotizacion) => (
              <View
                key={`${cotizacion.recetaId}-${cotizacion.id}`}
                style={styles.cotizacionCard}
              >
                {/* ... (Header) ... */}
                <View style={styles.cotizacionHeader}>
                  <Text style={styles.cotizacionId}>
                    Receta #{cotizacion.recetaId.slice(0, 8)}
                  </Text>
                  {getEstadoBadge(cotizacion.estado)}
                </View>

                {/* Paciente (Condicional) */}
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

                {/* Obra Social */}
                <View style={styles.infoRow}>
                  <Ionicons
                    name="medical-outline"
                    size={18}
                    color={colors.textTertiary}
                  />
                  <Text style={styles.infoText}>
                    {formatObraSocial(cotizacion.userObraSocial)}
                  </Text>
                </View>

                {/* DNI (Condicional) */}
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

                {/* Teléfono (Condicional) */}
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

                {/* ... (Precio, Descripcion, Direccion, Fecha) ... */}
                {cotizacion.precio != null && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="cash-outline"
                      size={18}
                      color={colors.textTertiary}
                    />
                    <Text style={styles.infoText}>
                      Precio: {formatPrice(cotizacion.precio)}
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
                {cotizacion.direccion && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={colors.textTertiary}
                    />
                    <Text style={styles.infoText}>{cotizacion.direccion}</Text>
                  </View>
                )}
                {cotizacion.fechaRespuesta && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color={colors.textTertiary}
                    />
                    <Text style={styles.infoTextSmall}>
                      {formatDate(cotizacion.fechaRespuesta)}
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
  // ... (todos los estilos)
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
  cotizacionesList: {
    gap: 12,
  },
  cotizacionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
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
});