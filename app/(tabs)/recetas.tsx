import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../src/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { globalStyles, colors } from "../../assets/styles";
interface Receta {
  id: string;
  userId: string;
  imagenUrl: string;
  fechaCreacion: Date;
  estado: "esperando_respuestas" | "farmacias_respondiendo" | "finalizada";
  cotizacionesCount: number;
}

// 🔴 DATOS DE PRUEBA - BORRAR CUANDO FIREBASE ESTÉ LISTO
const RECETAS_PRUEBA: Receta[] = [
  {
    id: "receta_1",
    userId: "user_test",
    imagenUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400",
    fechaCreacion: new Date(2023, 9, 23),
    estado: "esperando_respuestas",
    cotizacionesCount: 0,
  },
  {
    id: "receta_2",
    userId: "user_test",
    imagenUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400",
    fechaCreacion: new Date(2023, 9, 21),
    estado: "farmacias_respondiendo",
    cotizacionesCount: 3,
  },
  {
    id: "receta_3",
    userId: "user_test",
    imagenUrl: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400",
    fechaCreacion: new Date(2023, 9, 15),
    estado: "esperando_respuestas",
    cotizacionesCount: 0,
  },
  {
    id: "receta_4",
    userId: "user_test",
    imagenUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400",
    fechaCreacion: new Date(2023, 9, 10),
    estado: "farmacias_respondiendo",
    cotizacionesCount: 5,
  },
];

export default function Recetas() {
  const router = useRouter();
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecetas();
  }, []);

  const loadRecetas = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      setRecetas(RECETAS_PRUEBA);
    } catch (error) {
      console.error("Error al cargar recetas:", error);
      Alert.alert("Error", "No pudimos cargar las recetas.");
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "esperando_respuestas":
        return {
          bg: colors.warning,
          text: colors.warningDark,
          label: "Esperando respuestas",
        };
      case "farmacias_respondiendo":
        return {
          bg: colors.successLight,
          text: colors.successDark,
          label: "Farmacias respondiendo",
        };
      case "finalizada":
        return {
          bg: colors.gray200,
          text: colors.gray700,
          label: "Finalizada",
        };
      default:
        return {
          bg: colors.gray100,
          text: colors.textSecondary,
          label: "Desconocido",
        };
    }
  };

  const formatDate = (date: Date) => {
    return `Enviada el ${date.getDate()} de ${
      [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
      ][date.getMonth()]
    }, ${date.getFullYear()}`;
  };

  const handleVerSolicitudes = (recetaId: string) => {
    router.push({
      pathname: "/(tabs)/solicitudes",
      params: { recetaId },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={globalStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryLight} />
          <Text style={globalStyles.loadingText}>Cargando recetas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container} edges={["top"]}>
      <View style={globalStyles.header}>
        <View style={{ width: 48 }} />
        <Text style={globalStyles.titleMedium}>Mis Recetas</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {recetas.length === 0 ? (
          <View style={globalStyles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={colors.textMutedDark} />
            <Text style={globalStyles.emptyTitle}>Sin recetas aún</Text>
            <Text style={globalStyles.emptyText}>
              Subí tu primera receta para que las farmacias te coticen
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {recetas.map((receta) => {
              const badge = getEstadoBadge(receta.estado);
              const puedeVerRespuestas = receta.estado === "farmacias_respondiendo";

              return (
                <Pressable
                  key={receta.id}
                  style={({ pressed }) => [
                    globalStyles.cardSimple,
                    pressed && globalStyles.cardPressed,
                  ]}
                  onPress={() => puedeVerRespuestas && handleVerSolicitudes(receta.id)}
                  disabled={!puedeVerRespuestas}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.imageContainer}>
                      {receta.imagenUrl ? (
                        <Image
                          source={{ uri: receta.imagenUrl }}
                          style={styles.recetaImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.imagePlaceholder}>
                          <Ionicons name="document-outline" size={32} color={colors.textMutedDark} />
                        </View>
                      )}
                    </View>

                    <View style={styles.cardInfo}>
                      <Text style={styles.dateText}>
                        {formatDate(receta.fechaCreacion)}
                      </Text>
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

                      {puedeVerRespuestas && (
                        <View style={styles.viewButton}>
                          <Text style={styles.viewButtonText}>
                            Ver respuestas de farmacias
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
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
  scrollView: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
  cardContent: {
    flexDirection: "row",
    padding: 16,
    gap: 16,
  },
  imageContainer: {
    width: 80,
    aspectRatio: 3 / 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  recetaImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    flex: 1,
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textMuted,
  },
  viewButton: {
    marginTop: 8,
    backgroundColor: colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  viewButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "600",
  },
});