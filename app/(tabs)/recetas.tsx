import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  Image,
  Modal,
  ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { globalStyles, colors } from "../../assets/styles";
import { 
  LoadingScreen, 
  SimpleHeader, 
  EmptyState, 
  ContentScrollView, 
  ListContainer 
} from "../../src/components/common";
import { formatDate, formatAddress, formatObraSocial } from "../../src/lib/formatHelpers";
import { useRecetasDelUsuario } from "../../src/lib/firestoreHooks";
import { getEstadoRecetaConfig } from "../../src/lib/estadosHelpers";
import { navigateToSolicitudes } from "../../src/lib/navigationHelpers";
import { Receta } from "../../assets/types";

// Pantalla "Mis Recetas" (para el paciente)
export default function Recetas() {
  const router = useRouter();
  const [selectedReceta, setSelectedReceta] = useState<Receta | null>(null);
  
  // Hook que maneja toda la logica de subscripcion a Firestore
  const { recetas, loading, error } = useRecetasDelUsuario();

  // Handler para navegar a solicitudes
  const handleVerSolicitudes = (recetaId: string) => {
    setSelectedReceta(null); // Cerrar modal si está abierto
    navigateToSolicitudes(router, recetaId);
  };

  // Handler para abrir el modal
  const handleVerDetalles = (receta: Receta) => {
    setSelectedReceta(receta);
  };

  // Pantalla de carga
  if (loading) {
    return <LoadingScreen message="Cargando recetas..." />;
  }

  // Render principal
  return (
    <SafeAreaView style={globalStyles.container} edges={["top"]}>
      <SimpleHeader title="Mis Recetas" />

      <ContentScrollView>
        {recetas.length === 0 ? (
          // Estado vacio
          <>
            {console.log("[Render] Mostrando estado vacio (empty).")}
            <EmptyState
              icon="receipt-outline"
              title="Sin recetas aún"
              message="Subí tu primera receta para que las farmacias te coticen"
            />
          </>
        ) : (
          // Lista de recetas
          <ListContainer>
            {recetas.map((receta) => {
              // Obtener configuracion del badge segun el estado
              const badge = getEstadoRecetaConfig(receta.estado);
              // Solo se puede clickear si hay respuestas
              const puedeVerRespuestas = receta.estado === "farmacias_respondiendo";

              return (
                <View key={receta.id} style={globalStyles.cardSimple}>
                  <View style={styles.cardContent}>
                    {/* Imagen de la receta */}
                    <Pressable 
                      style={styles.imageContainer}
                      onPress={() => handleVerDetalles(receta)}
                    >
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
                    </Pressable>

                    {/* Info de la receta */}
                    <View style={styles.cardInfo}>
                      <Text style={styles.dateText}>
                        Enviada el {formatDate(receta.fechaCreacion)}
                      </Text>
                      
                      {/* Badge de estado */}
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

                      {/* Botones */}
                      <View style={styles.buttonsContainer}>
                        <Pressable
                          style={styles.detailsButton}
                          onPress={() => handleVerDetalles(receta)}
                        >
                          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
                        </Pressable>

                        {puedeVerRespuestas && (
                          <Pressable
                            style={styles.viewButton}
                            onPress={() => handleVerSolicitudes(receta.id)}
                          >
                            <Text style={styles.viewButtonText}>
                              Ver respuestas
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </ListContainer>
        )}

        <View style={globalStyles.spacer} />
      </ContentScrollView>

      {/* Modal de Detalles */}
      <Modal
        visible={selectedReceta !== null}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSelectedReceta(null)}
      >
        <SafeAreaView style={styles.modalContainer} edges={["top"]}>
          <View style={styles.modalContent}>
            {/* Header del Modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles de la Receta</Text>
              <Pressable
                onPress={() => setSelectedReceta(null)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={28} color={colors.textPrimary} />
              </Pressable>
            </View>

            {selectedReceta && (
              <ScrollView style={styles.modalScroll}>
                {/* Imagen Grande */}
                <View style={styles.modalImageContainer}>
                  {selectedReceta.imagenUrl ? (
                    <Image
                      source={{ uri: selectedReceta.imagenUrl }}
                      style={styles.modalImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.modalImagePlaceholder}>
                      <Ionicons name="document-outline" size={64} color={colors.textMutedDark} />
                      <Text style={styles.noImageText}>Sin imagen</Text>
                    </View>
                  )}
                </View>

                {/* Información de la Receta */}
                <View style={styles.infoSection}>
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Fecha de envío</Text>
                      <Text style={styles.infoValue}>{formatDate(selectedReceta.fechaCreacion)}</Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Estado</Text>
                      <View style={[
                        globalStyles.badge,
                        { backgroundColor: getEstadoRecetaConfig(selectedReceta.estado).bg }
                      ]}>
                        <Text style={[
                          globalStyles.badgeText,
                          { color: getEstadoRecetaConfig(selectedReceta.estado).text }
                        ]}>
                          {getEstadoRecetaConfig(selectedReceta.estado).label}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons name="chatbubbles-outline" size={20} color={colors.primary} />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Cotizaciones recibidas</Text>
                      <Text style={styles.infoValue}>{selectedReceta.cotizacionesCount}</Text>
                    </View>
                  </View>
                </View>

                {/* Datos del Usuario */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Datos del Paciente</Text>
                  
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Nombre:</Text>
                    <Text style={styles.dataValue}>{selectedReceta.userName}</Text>
                  </View>

                  {selectedReceta.userDNI && (
                    <View style={styles.dataRow}>
                      <Text style={styles.dataLabel}>DNI:</Text>
                      <Text style={styles.dataValue}>{selectedReceta.userDNI}</Text>
                    </View>
                  )}

                  {selectedReceta.userPhone && (
                    <View style={styles.dataRow}>
                      <Text style={styles.dataLabel}>Teléfono:</Text>
                      <Text style={styles.dataValue}>{selectedReceta.userPhone}</Text>
                    </View>
                  )}

                  {selectedReceta.userEmail && (
                    <View style={styles.dataRow}>
                      <Text style={styles.dataLabel}>Email:</Text>
                      <Text style={styles.dataValue}>{selectedReceta.userEmail}</Text>
                    </View>
                  )}

                  {selectedReceta.userAddress && (
                    <View style={styles.dataRow}>
                      <Text style={styles.dataLabel}>Dirección:</Text>
                      <Text style={styles.dataValue}>
                        {formatAddress(selectedReceta.userAddress)}
                      </Text>
                    </View>
                  )}

                  {/* ✅ OBRA SOCIAL - SIEMPRE SE MUESTRA */}
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Obra Social:</Text>
                    <Text 
                      style={[
                        styles.dataValue,
                        !selectedReceta.userObraSocial && styles.sinDato
                      ]}
                    >
                      {formatObraSocial(selectedReceta.userObraSocial)}
                    </Text>
                  </View>
                </View>

                {/* Botón para ver respuestas */}
                {selectedReceta.estado === "farmacias_respondiendo" && (
                  <Pressable
                    style={styles.modalActionButton}
                    onPress={() => handleVerSolicitudes(selectedReceta.id)}
                  >
                    <Text style={styles.modalActionButtonText}>
                      Ver respuestas de farmacias
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color={colors.surface} />
                  </Pressable>
                )}

                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </Modal>
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
  buttonsContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    minHeight: 36,
    minWidth: 44,
  },
  detailsButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  viewButton: {
    flex: 1,
    backgroundColor: colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
  },
  viewButtonText: {
    color: colors.surface, 
    fontSize: 14,
    fontWeight: "600",
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    flex: 1,
  },
  modalImageContainer: {
    width: "100%",
    height: 300,
    backgroundColor: colors.gray100,
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  modalImagePlaceholder: {
    alignItems: "center",
    gap: 12,
  },
  noImageText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  infoSection: {
    padding: 20,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  section: {
    padding: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  dataRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  dataLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
    width: 120,
  },
  dataValue: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  sinDato: {
    fontStyle: "italic",
    color: colors.textMuted,
  },
  modalActionButton: {
    margin: 20,
    backgroundColor: colors.primaryLight,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  modalActionButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "700",
  },
});