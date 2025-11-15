import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { globalStyles, colors } from "../../assets/styles";
import { LoadingScreen, SimpleHeader, EmptyState, ContentScrollView, ListContainer } from "../../src/components/common";
import { formatDate } from "../../src/lib/formatHelpers";
import { useRecetasDelUsuario } from "../../src/lib/firestoreHooks";
import { getEstadoRecetaConfig } from "../../src/lib/estadosHelpers";
import { navigateToSolicitudes } from "../../src/lib/navigationHelpers";

export default function Recetas() {
  const router = useRouter();
  
  // ✅ Hook que maneja toda la lógica de Firebase
  const { recetas, loading, error } = useRecetasDelUsuario();

  // ✅ Handler para navegar a solicitudes
  const handleVerSolicitudes = (recetaId: string) => {
    navigateToSolicitudes(router, recetaId);
  };

  // ✅ Pantalla de carga
  if (loading) return <LoadingScreen message="Cargando recetas..." />;

  return (
    <SafeAreaView style={globalStyles.container} edges={["top"]}>
      <SimpleHeader title="Mis Recetas" />

      <ContentScrollView>
        {recetas.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="Sin recetas aún"
            message="Subí tu primera receta para que las farmacias te coticen"
          />
        ) : (
          <ListContainer>
            {recetas.map((receta) => {
              // ✅ Obtener configuración del badge según el estado
              const badge = getEstadoRecetaConfig(receta.estado);
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
                        Enviada el {formatDate(receta.fechaCreacion)}
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
          </ListContainer>
        )}

        <View style={globalStyles.spacer} />
      </ContentScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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