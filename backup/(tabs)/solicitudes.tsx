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
  cuit: string;
  email: string;
  direccion: string;
  distancia?: number;
  precio: number | null;
  estado: "esperando" | "sin_stock" | "ilegible" | "cotizado";
  fechaCreacion: Date;
}

// 🔴 DATOS DE PRUEBA
const COTIZACIONES_PRUEBA: { [key: string]: Cotizacion[] } = {
  receta_2: [
    {
      id: "cot_1",
      farmaciaId: "farm_1",
      nombreComercial: "Farmacia del Sol",
      cuit: "20-12345678-9",
      email: "contacto@farmaciasol.com",
      direccion: "Av. Siempre Viva 123",
      distancia: 1.2,
      precio: 15.50,
      estado: "cotizado",
      fechaCreacion: new Date(),
    },
    {
      id: "cot_2",
      farmaciaId: "farm_2",
      nombreComercial: "Farmacia Central",
      cuit: "20-98765432-1",
      email: "info@farmaciacentral.com",
      direccion: "Calle Falsa 456",
      distancia: 2.5,
      precio: null,
      estado: "sin_stock",
      fechaCreacion: new Date(),
    },
    {
      id: "cot_3",
      farmaciaId: "farm_3",
      nombreComercial: "Farma Vida",
      cuit: "20-55555555-5",
      email: "ventas@farmavida.com",
      direccion: "Bulevar de los Sueños 789",
      distancia: 3.1,
      precio: null,
      estado: "ilegible",
      fechaCreacion: new Date(),
    },
  ],
  receta_4: [
    {
      id: "cot_4",
      farmaciaId: "farm_1",
      nombreComercial: "Farmacia del Sol",
      cuit: "20-12345678-9",
      email: "contacto@farmaciasol.com",
      direccion: "Av. Siempre Viva 123",
      distancia: 1.2,
      precio: 22.00,
      estado: "cotizado",
      fechaCreacion: new Date(),
    },
    {
      id: "cot_5",
      farmaciaId: "farm_4",
      nombreComercial: "Farmacia La Salud",
      cuit: "20-44444444-4",
      email: "hola@lasalud.com",
      direccion: "Av. Libertador 1500",
      distancia: 0.8,
      precio: 18.75,
      estado: "cotizado",
      fechaCreacion: new Date(),
    },
    {
      id: "cot_6",
      farmaciaId: "farm_5",
      nombreComercial: "Farmacia Plus",
      cuit: "20-33333333-3",
      email: "ventas@farmplus.com",
      direccion: "Calle Corrientes 890",
      distancia: 4.2,
      precio: null,
      estado: "esperando",
      fechaCreacion: new Date(),
    },
    {
      id: "cot_7",
      farmaciaId: "farm_2",
      nombreComercial: "Farmacia Central",
      cuit: "20-98765432-1",
      email: "info@farmaciacentral.com",
      direccion: "Calle Falsa 456",
      distancia: 2.5,
      precio: 25.50,
      estado: "cotizado",
      fechaCreacion: new Date(),
    },
    {
      id: "cot_8",
      farmaciaId: "farm_6",
      nombreComercial: "Farmacia Express",
      cuit: "20-66666666-6",
      email: "info@farmexpress.com",
      direccion: "Av. Santa Fe 2200",
      distancia: 1.9,
      precio: null,
      estado: "sin_stock",
      fechaCreacion: new Date(),
    },
  ],
};

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
      await new Promise(resolve => setTimeout(resolve, 600));
      const data = COTIZACIONES_PRUEBA[recetaId] || [];
      setCotizaciones(data);
    } catch (error) {
      console.error("Error al cargar cotizaciones:", error);
      Alert.alert("Error", "No pudimos cargar las solicitudes.");
    } finally {
      setLoading(false);
    }
  };

  const handlePagar = (cotizacion: Cotizacion) => {
    Alert.alert(
      "Ir a pago",
      `Farmacia: ${cotizacion.nombreComercial}\nPrecio: $${cotizacion.precio}`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Continuar", onPress: () => {} },
      ]
    );
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
    ? cotizaciones.filter(c => c.estado === "cotizado" && c.precio !== null)
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
              const tienePrecio = cotizacion.estado === "cotizado" && cotizacion.precio !== null;

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
                      {cotizacion.distancia && (
                        <Text style={styles.farmaciaDistance}>
                          a {cotizacion.distancia.toFixed(1)} km
                        </Text>
                      )}
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
  farmaciaDistance: {
    fontSize: 14,
    color: colors.textTertiary,
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