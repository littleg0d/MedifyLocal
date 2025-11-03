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

// Tipos de datos
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

// 🔴 DATOS DE PRUEBA - BORRAR CUANDO FIREBASE ESTÉ LISTO
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
      
      // 🔴 COMENTAR ESTO Y USAR DATOS DE PRUEBA
      // const cotizacionesRef = collection(db, "recetas", recetaId, "cotizaciones");
      // const snapshot = await getDocs(cotizacionesRef);
      
      // const data = snapshot.docs.map(doc => {
      //   const d = doc.data();
      //   return {
      //     id: doc.id,
      //     farmaciaId: d.farmaciaId || "",
      //     nombreComercial: d.nombreComercial || "Farmacia",
      //     cuit: d.cuit || "",
      //     email: d.email || "",
      //     direccion: d.direccion || "Sin dirección",
      //     distancia: d.distancia,
      //     precio: d.precio || null,
      //     estado: d.estado || "esperando",
      //     fechaCreacion: d.fechaCreacion?.toDate() || new Date(),
      //   };
      // });

      // setCotizaciones(data);

      // 🔴 USAR DATOS DE PRUEBA
      await new Promise(resolve => setTimeout(resolve, 600)); // Simular carga
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
    // Navegar a pantalla de pago
    Alert.alert(
      "Ir a pago",
      `Farmacia: ${cotizacion.nombreComercial}\nPrecio: $${cotizacion.precio}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Continuar",
          onPress: () => {
            // router.push({
            //   pathname: "/pago",
            //   params: {
            //     recetaId,
            //     cotizacionId: cotizacion.id,
            //     farmaciaId: cotizacion.farmaciaId,
            //     precio: cotizacion.precio?.toString() || "0",
            //   },
            // });
          },
        },
      ]
    );
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "esperando":
        return {
          bg: "#FEF3C7",
          text: "#92400E",
          label: "Esperando respuesta",
        };
      case "cotizado":
        return {
          bg: "#D1FAE5",
          text: "#065F46",
          label: "Disponible",
        };
      case "sin_stock":
        return {
          bg: "#E5E7EB",
          text: "#374151",
          label: "Sin stock",
        };
      case "ilegible":
        return {
          bg: "#FEE2E2",
          text: "#991B1B",
          label: "Rechazada",
        };
      default:
        return {
          bg: "#F3F4F6",
          text: "#6B7280",
          label: "Desconocido",
        };
    }
  };

  const cotizacionesFiltradas = filtroConStock
    ? cotizaciones.filter(c => c.estado === "cotizado" && c.precio !== null)
    : cotizaciones;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Cargando solicitudes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.title}>Farmacias Cercanas</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filtro */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Mostrar solo con stock</Text>
        <Pressable
          style={[styles.toggle, filtroConStock && styles.toggleActive]}
          onPress={() => setFiltroConStock(!filtroConStock)}
        >
          <View
            style={[
              styles.toggleThumb,
              filtroConStock && styles.toggleThumbActive,
            ]}
          />
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView}>
        {cotizacionesFiltradas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="file-tray-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Sin solicitudes</Text>
            <Text style={styles.emptyText}>
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
                <View key={cotizacion.id} style={styles.card}>
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
                    <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
                  </View>

                  <View style={styles.cardFooter}>
                    {tienePrecio ? (
                      <>
                        <View
                          style={[
                            styles.badge,
                            { backgroundColor: badge.bg },
                          ]}
                        >
                          <Text style={[styles.badgeText, { color: badge.text }]}>
                            Disponible: ${cotizacion.precio?.toFixed(2)}
                          </Text>
                        </View>
                        <Pressable
                          style={({ pressed }) => [
                            styles.payButton,
                            pressed && styles.buttonPressed,
                          ]}
                          onPress={() => handlePagar(cotizacion)}
                        >
                          <Text style={styles.payButtonText}>Pagar</Text>
                        </Pressable>
                      </>
                    ) : (
                      <View
                        style={[
                          styles.badge,
                          styles.badgeFull,
                          { backgroundColor: badge.bg },
                        ]}
                      >
                        <Text style={[styles.badgeText, { color: badge.text }]}>
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

        {/* Espaciado para el tab bar */}
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F8F7",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F6F8F7",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#F6F8F7",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filterLabel: {
    fontSize: 16,
    color: "#111827",
  },
  toggle: {
    width: 51,
    height: 31,
    borderRadius: 16,
    backgroundColor: "#D1D5DB",
    padding: 2,
    justifyContent: "center",
  },
  toggleActive: {
    backgroundColor: "#22C55E",
    justifyContent: "flex-end",
  },
  toggleThumb: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  toggleThumbActive: {
    alignSelf: "flex-end",
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#374151",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
    color: "#111827",
  },
  farmaciaAddress: {
    fontSize: 16,
    color: "#6B7280",
  },
  farmaciaDistance: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
  },
  badgeFull: {
    alignItems: "center",
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  payButton: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    flex: 1,
    alignItems: "center",
  },
  payButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.7,
  },
});