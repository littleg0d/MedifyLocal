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
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { globalStyles, colors } from "../../assets/styles";

interface Receta {
  id: string;
  userId: string;
  imagenUrl: string;
  fechaCreacion: Date;
  estado: "esperando_respuestas" | "farmacias_respondiendo" | "finalizada";
  cotizacionesCount: number;
}

export default function Recetas() {
  const router = useRouter();
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    
    if (!user) {
      Alert.alert("Error", "Debes iniciar sesión para ver tus recetas.");
      setLoading(false);
      return;
    }

    // Consulta a Firebase con onSnapshot para escuchar cambios en tiempo real
    const recetasRef = collection(db, "recetas");
    const q = query(
      recetasRef,
      where("userId", "==", user.uid),
      orderBy("fechaCreacion", "desc")
    );
    
    // Suscripción en tiempo real
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const recetasData: Receta[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          recetasData.push({
            id: doc.id,
            userId: data.userId,
            imagenUrl: data.imagenUrl,
            fechaCreacion: data.fechaCreacion.toDate(),
            estado: data.estado,
            cotizacionesCount: data.cotizacionesCount || 0,
          });
        });

        setRecetas(recetasData);
        setLoading(false);
      },
      (error) => {
        console.error("Error al escuchar recetas:", error);
        Alert.alert("Error", "No pudimos cargar las recetas.");
        setLoading(false);
      }
    );

    // Cleanup: desuscribirse cuando el componente se desmonte
    return () => unsubscribe();
  }, []);

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
      pathname: "/solicitudes",
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