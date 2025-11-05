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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../src/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { globalStyles, colors } from "../../assets/styles";

interface Cotizacion {
  id: string;
  farmaciaId: string;
  nombreComercial: string;
  direccion: string;
  precio?: number;
  estado: "esperando" | "sin_stock" | "ilegible" | "cotizado";
  fechaCreacion: Date;
}

export default function Solicitudes() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const recetaId = params.recetaId as string;

  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroConStock, setFiltroConStock] = useState(false);

  useEffect(() => {
    if (recetaId) {
      loadCotizaciones();
    }
  }, [recetaId]);

  const loadCotizaciones = async () => {
    try {
      setLoading(true);

      console.log("🔍 Cargando cotizaciones para receta:", recetaId);

      // Obtener cotizaciones de la subcollection
      const cotizacionesRef = collection(db, "recetas", recetaId, "cotizaciones");
      const querySnapshot = await getDocs(cotizacionesRef);

      console.log("📦 Cotizaciones encontradas:", querySnapshot.size);

      const cotizacionesData: Cotizacion[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log("💊 Cotización:", doc.id, data);
        cotizacionesData.push({
          id: doc.id,
          farmaciaId: data.farmaciaId,
          nombreComercial: data.nombreComercial,
          direccion: data.direccion,
          precio: data.precio, // Solo existe si estado === "cotizado"
          estado: data.estado,
          fechaCreacion: data.fechaCreacion.toDate(),
        });
      });

      console.log("✅ Cotizaciones cargadas:", cotizacionesData.length);
      setCotizaciones(cotizacionesData);
    } catch (error) {
      console.error("❌ Error al cargar cotizaciones:", error);
      Alert.alert("Error", "No pudimos cargar las solicitudes.");
    } finally {
      setLoading(false);
    }
  };

  const handlePagar = (cotizacion: Cotizacion) => {
    router.push({
      pathname: "/(tabs)/pagar",
      params: {
        recetaId: recetaId,
        cotizacionId: cotizacion.id,
      },
    });
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
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={globalStyles.titleSmall}>Farmacias Cercanas</Text>
        <View style={{ width: 40 }} />
      </View>

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
            {cotizacionesFiltradas.map((cotizacion) => {
              const badge = getEstadoBadge(cotizacion.estado);
              const tienePrecio = cotizacion.estado === "cotizado";

              return (
                <View key={cotizacion.id} style={globalStyles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardInfo}>
                      <Text style={styles.farmaciaName}>
                        {cotizacion.nombreComercial}
                      </Text>
                      <Text style={styles.farmaciaAddress}>
                        {cotizacion.direccion}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={colors.textTertiary} />
                  </View>

                  <View style={styles.cardFooter}>
                    {tienePrecio ? (
                      <>
                        <View style={[globalStyles.badgePill, { backgroundColor: badge.bg, flex: 1 }]}>
                          <Text style={[globalStyles.badgeTextMedium, { color: badge.text }]}>
                            Disponible: ${cotizacion.precio?.toFixed(2)}
                          </Text>
                        </View>
                        <Pressable
                          style={({ pressed }) => [
                            styles.payButton,
                            pressed && globalStyles.buttonPressed,
                          ]}
                          onPress={() => handlePagar(cotizacion)}
                        >
                          <Text style={styles.payButtonText}>Pagar</Text>
                        </Pressable>
                      </>
                    ) : (
                      <View style={[globalStyles.badgePill, styles.badgeFull, { backgroundColor: badge.bg }]}>
                        <Text style={[globalStyles.badgeTextMedium, { color: badge.text }]}>
                          {badge.label}
                        </Text>
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  farmaciaName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  farmaciaAddress: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  badgeFull: {
    alignItems: "center",
    flex: 1,
  },
  payButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    flex: 1,
    alignItems: "center",
  },
  payButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "700",
  },
});