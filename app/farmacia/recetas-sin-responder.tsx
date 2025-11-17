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
  TextInput,
  Alert,
  Modal,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../src/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { globalStyles, colors } from "../../assets/styles";
import { API_URL } from "../../src/config/apiConfig";
import { Receta, Address, ObraSocial } from "../../assets/types"; // ✅ Importar tipos de objetos
import { formatObraSocial, formatDate, formatAddress } from "../../src/lib/formatHelpers";

// Pantalla para ver y responder recetas pendientes
export default function RecetasSinResponder() {
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/farmacia");
    }
  };

  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [farmaciaId, setFarmaciaId] = useState<string | null>(null);

  // Modal de respuesta
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReceta, setSelectedReceta] = useState<Receta | null>(null);
  const [respuestaEstado, setRespuestaEstado] = useState<string>("cotizado");
  const [respuestaDescripcion, setRespuestaDescripcion] = useState("");
  const [respuestaPrecio, setRespuestaPrecio] = useState("");
  const [submitting, setSubmitting] = useState(false); 

  // Zoom de imagen
  const [imageZoomVisible, setImageZoomVisible] = useState(false);
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  // Carga inicial
  useEffect(() => {
    loadFarmaciaAndRecetas();
  }, []);

  const loadFarmaciaAndRecetas = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const fId = user.uid;
      setFarmaciaId(fId);
      await loadRecetas(fId);
    } catch (error) {
      console.log("❌❌❌❌ Error cargando farmacia:", error); 
      Alert.alert("Error", "No se pudo cargar la información de la farmacia");
    }
  };

  const loadRecetas = async (fId: string) => {
    try {
      if (!refreshing) {
        setLoading(true);
      }

      const recetasRef = collection(db, "recetas");

      const q = query(
        recetasRef,
        where("estado", "in", ["esperando_respuestas", "farmacias_respondiendo"])
      );
      
      const snapshot = await getDocs(q); 

      if (snapshot.size === 0) {
        setRecetas([]);
        return;
      }

      const recetasPromises = snapshot.docs.map(async (recetaDoc) => {
        const recetaData = recetaDoc.data();
        
        try {
          const respuestaRef = doc(db, "recetas", recetaDoc.id, "farmaciasRespondieron", fId);
          const respuestaSnap = await getDoc(respuestaRef); 
          
          const yaRespondio = respuestaSnap.exists();
          
          if (yaRespondio) {
            return null; 
          }
          
          // Mapear la receta
          return {
            id: recetaDoc.id,
            userId: recetaData.userId || "",
            userName: recetaData.userName || "Usuario",
            userEmail: recetaData.userEmail || "",
            userDNI: recetaData.userDNI,
            userPhone: recetaData.userPhone,
            userAddress: (recetaData.userAddress || undefined) as Address | undefined, 
            userObraSocial: (recetaData.userObraSocial || undefined) as ObraSocial | undefined,
            imagenUrl: recetaData.imagenUrl || "",
            imagenPath: recetaData.imagenPath,
            imagenNombre: recetaData.imagenNombre,
            imagenSize: recetaData.imagenSize,
            estado: recetaData.estado || "esperando_respuestas",
            cotizacionesCount: recetaData.cotizacionesCount || 0,
            fechaCreacion: recetaData.fechaCreacion,
            // ❌ REMOVIDA: descripcion: recetaData.descripcion, 
          } as Receta;
        } catch (error) {
          console.log(`❌ Error verificando respuesta para receta ${recetaDoc.id}:`, error); 
          // Si hay error, incluir la receta por defecto
          return {
            id: recetaDoc.id,
            userId: recetaData.userId || "",
            userName: recetaData.userName || "Usuario",
            userEmail: recetaData.userEmail || "",
            userDNI: recetaData.userDNI,
            userPhone: recetaData.userPhone,
            userAddress: (recetaData.userAddress || undefined) as Address | undefined, 
            userObraSocial: (recetaData.userObraSocial || undefined) as ObraSocial | undefined, 
            imagenUrl: recetaData.imagenUrl || "",
            imagenPath: recetaData.imagenPath,
            imagenNombre: recetaData.imagenNombre,
            imagenSize: recetaData.imagenSize,
            estado: recetaData.estado || "esperando_respuestas",
            cotizacionesCount: recetaData.cotizacionesCount || 0,
            fechaCreacion: recetaData.fechaCreacion,
            // ❌ REMOVIDA: descripcion: recetaData.descripcion, 
          } as Receta;
        }
      });

      const recetasResults = await Promise.all(recetasPromises);
      
      const recetasSinResponder = recetasResults.filter(
        (receta): receta is Receta => receta !== null
      );
      
      recetasSinResponder.sort((a, b) => {
        if (!a.fechaCreacion || !b.fechaCreacion) return 0;
        const aTime = a.fechaCreacion.seconds || 0;
        const bTime = b.fechaCreacion.seconds || 0;
        return bTime - aTime;
      });

      setRecetas(recetasSinResponder);
    } catch (error) {
      console.log("❌❌❌❌ Error cargando recetas:", error); 
      Alert.alert(
        "Error de consulta",
        "No se pudieron cargar las recetas. Por favor intenta de nuevo."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    if (farmaciaId) {
      setRefreshing(true);
      await loadRecetas(farmaciaId);
    }
  };

  const handleResponder = (receta: Receta) => {
    setSelectedReceta(receta);
    setRespuestaEstado("cotizado"); 
    setRespuestaDescripcion("");
    setRespuestaPrecio("");
    setModalVisible(true);
  };

  const handleImageZoom = (imageUrl: string) => {
    setZoomImageUrl(imageUrl);
    setImageZoomVisible(true);
  };

  const getRecetaTitle = (receta: Receta) => {
    const userName = (receta.userName || "Usuario").toLowerCase();
    const recetaId = receta.id.slice(0, 8);
    return `${userName} - ${recetaId}`;
  };

  const handleEnviarRespuesta = async () => {
    if (!selectedReceta || !farmaciaId) {
      return;
    }
    
    // Validaciones
    if (respuestaEstado === "cotizado") {
      if (!respuestaDescripcion.trim()) {
        Alert.alert("Error", "Por favor ingresá una descripción"); 
        return;
      }
      if (!respuestaPrecio.trim()) {
        Alert.alert("Error", "Por favor ingresá un precio"); 
        return;
      }

      const precioNum = parseFloat(respuestaPrecio);
      if (isNaN(precioNum) || precioNum <= 0) {
        Alert.alert("Error", "Por favor ingresá un precio válido mayor a 0"); 
        return;
      }
    }
    
    try {
      setSubmitting(true);

      let estadoBackend = respuestaEstado;
      if (respuestaEstado === "ilegible") {
        estadoBackend = "rechazada";
      }

      const body: any = {
        recetaId: selectedReceta.id,
        farmaciaId: farmaciaId,
        estado: estadoBackend,
      };

      if (respuestaEstado === "cotizado") {
        body.descripcion = respuestaDescripcion.trim();
        body.precio = parseFloat(respuestaPrecio);
      }

      const response = await fetch(`${API_URL}/api/responder-receta`, { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: "Error desconocido",
        }));
        console.log(`❌ [handleEnviarRespuesta] Respuesta API NO OK: ${response.status}`, errorData); 
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const result = await response.json();

      Alert.alert("Éxito", "Respuesta enviada correctamente");
      setModalVisible(false);

      await loadRecetas(farmaciaId);

    } catch (error) {
      console.log("❌❌❌❌ Error enviando respuesta (API):", error); 

      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo enviar la respuesta";

      Alert.alert("Error", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={styles.header}>
          <Pressable onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Recetas sin responder</Text>
        </View>
        <View style={styles.centerRow}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando recetas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Recetas sin responder</Text>
      </View>

      <ScrollView
        style={globalStyles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {recetas.length === 0 ? (
          <>
            <View style={styles.emptyContainer}>
              <Ionicons
                name="document-text-outline"
                size={64}
                color={colors.textTertiary}
              />
              <Text style={styles.emptyText}>No hay recetas sin responder</Text>
              <Text style={styles.emptySubtext}>
                Las nuevas recetas aparecerán aquí
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.recetasList}>
            {recetas.map((receta) => (
              <View key={receta.id} style={styles.recetaCard}>
                {/* Imagen miniatura */}
                {receta.imagenUrl && (
                  <Pressable
                    onPress={() => handleImageZoom(receta.imagenUrl!)}
                    style={styles.imageContainer}
                  >
                    <Image
                      source={{ uri: receta.imagenUrl }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                    <View style={styles.zoomIconOverlay}>
                      <Ionicons name="expand-outline" size={20} color="white" />
                    </View>
                  </Pressable>
                )}

                <Text style={styles.recetaId}>{getRecetaTitle(receta)}</Text>

                {/* Descripcion (opcional) de la receta */}
                {/* ❌ REMOVIDO: {receta.descripcion && ( */}

                {/* Direccion de entrega del paciente */}
                {receta.userAddress && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={colors.textTertiary}
                    />
                    <Text style={styles.infoText}>
                      {formatAddress(receta.userAddress)}
                    </Text>
                  </View>
                )}

                {/* Boton para abrir modal */}
                <Pressable
                  style={({ pressed }) => [
                    styles.responderButton,
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => handleResponder(receta)}
                >
                  <Ionicons name="chatbox-outline" size={18} color="white" />
                  <Text style={styles.responderButtonText}>Responder</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ==================== MODAL DE RESPUESTA ==================== */}
      <Modal
        visible={modalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => !submitting && setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={["top"]}>
          <View style={styles.modalContent}>
            {/* Header del Modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Responder Receta</Text>
              <Pressable
                onPress={() => !submitting && setModalVisible(false)}
                disabled={submitting}
              >
                <Ionicons name="close" size={28} color={colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Imagen en el modal */}
              {selectedReceta?.imagenUrl && (
                <Pressable
                  onPress={() => handleImageZoom(selectedReceta.imagenUrl!)}
                  style={styles.modalImageContainer}
                >
                  <Image
                    source={{ uri: selectedReceta.imagenUrl }}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                  <View style={styles.modalZoomHint}>
                    <Ionicons name="expand-outline" size={16} color="white" />
                    <Text style={styles.modalZoomText}>Toca para ampliar</Text>
                  </View>
                </Pressable>
              )}

              {/* Datos del Paciente en el Modal */}
              <View style={styles.infoCardModal}>
                <Text style={styles.infoCardTitle}>Datos del Paciente</Text>

                {selectedReceta?.userName && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={colors.textTertiary}
                    />
                    <Text style={styles.infoText}>
                      {selectedReceta.userName}
                    </Text>
                  </View>
                )}

                {selectedReceta?.userEmail && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color={colors.textTertiary}
                    />
                    <Text style={styles.infoText}>
                      {selectedReceta.userEmail}
                    </Text>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <Ionicons
                    name="medical-outline"
                    size={18}
                    color={colors.textTertiary}
                  />
                  <Text style={styles.infoText}>
                    {formatObraSocial(selectedReceta?.userObraSocial)}
                  </Text>
                </View>

                {selectedReceta?.userDNI && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="card-outline"
                      size={18}
                      color={colors.textTertiary}
                    />
                    <Text style={styles.infoText}>
                      DNI: {selectedReceta.userDNI}
                    </Text>
                  </View>
                )}

                {selectedReceta?.userPhone && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="call-outline"
                      size={18}
                      color={colors.textTertiary}
                    />
                    <Text style={styles.infoText}>
                      Tel: {selectedReceta.userPhone}
                    </Text>
                  </View>
                )}

                {/* Direccion de entrega del paciente */}
                {selectedReceta?.userAddress && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={colors.textTertiary}
                    />
                    <Text style={styles.infoText}>
                      {formatAddress(selectedReceta.userAddress)}
                    </Text>
                  </View>
                )}

                {/* Fecha de creacion de la receta */}
                {selectedReceta?.fechaCreacion && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color={colors.textTertiary}
                    />
                    <Text style={styles.infoText}>
                      Receta: {formatDate(selectedReceta.fechaCreacion)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Estado de la respuesta */}
              <Text style={styles.label}>Estado *</Text>
              <View style={styles.estadoButtons}>
                {[
                  { value: "sin_stock", label: "Sin Stock" },
                  { value: "cotizado", label: "Cotizar" },
                  { value: "ilegible", label: "Ilegible" },
                ].map((estado) => (
                  <Pressable
                    key={estado.value}
                    style={[
                      styles.estadoButton,
                      respuestaEstado === estado.value &&
                        styles.estadoButtonActive,
                    ]}
                    onPress={() => setRespuestaEstado(estado.value)}
                    disabled={submitting}
                  >
                    <Text
                      style={[
                        styles.estadoButtonText,
                        respuestaEstado === estado.value &&
                          styles.estadoButtonTextActive,
                      ]}
                    >
                      {estado.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Descripcion (solo si cotizado) */}
              {respuestaEstado === "cotizado" && (
                <>
                  <Text style={styles.label}>Descripción *</Text>
                  <TextInput
                    style={[globalStyles.input, styles.textArea]}
                    placeholder="Ingresá una descripción del medicamento"
                    value={respuestaDescripcion}
                    onChangeText={setRespuestaDescripcion}
                    multiline
                    numberOfLines={4}
                    editable={!submitting}
                    placeholderTextColor={colors.textTertiary}
                  />
                </>
              )}

              {/* Precio (solo si cotizado) */}
              {respuestaEstado === "cotizado" && (
                <>
                  <Text style={styles.label}>Precio *</Text>
                  <TextInput
                    style={[globalStyles.input, styles.precioInput]}
                    placeholder="Ingresá el precio"
                    value={respuestaPrecio}
                    onChangeText={setRespuestaPrecio}
                    keyboardType="numeric"
                    editable={!submitting}
                    placeholderTextColor={colors.textTertiary}
                  />
                  {/* Preview del precio formateado */}
                  {respuestaPrecio.trim() && (
                    <View style={styles.precioPreview}>
                      <Text style={styles.precioPreviewLabel}>Precio Final:</Text>
                      <Text style={styles.precioPreviewValue}>
                        $
                        {parseFloat(respuestaPrecio || "0").toLocaleString(
                          "es-AR",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </Text>
                    </View>
                  )}
                </>
              )}

              {/* Boton de envio */}
              <Pressable
                style={({ pressed }) => [
                  globalStyles.primaryButton,
                  {marginTop:24},
                  pressed && !submitting && globalStyles.buttonPressed,
                  submitting && globalStyles.buttonDisabled,
                ]}
                onPress={handleEnviarRespuesta}
                disabled={submitting}
              >
                {submitting ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={[globalStyles.primaryButtonText, { marginLeft: 8 }]}>
                      Enviando...
                    </Text>
                  </View>
                ) : (
                  <Text style={globalStyles.primaryButtonText}>
                    Enviar Respuesta
                  </Text>
                )}
              </Pressable>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ==================== MODAL DE ZOOM ==================== */}
      <Modal
        visible={imageZoomVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageZoomVisible(false)}
      >
        <View style={styles.zoomModalOverlay}>
          <Pressable
            style={styles.zoomModalClose}
            onPress={() => setImageZoomVisible(false)}
          >
            <Ionicons name="close-circle" size={40} color="white" />
          </Pressable>

          <ScrollView
            contentContainerStyle={styles.zoomScrollContent}
            maximumZoomScale={3}
            minimumZoomScale={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            {zoomImageUrl && (
              <Image
                source={{ uri: zoomImageUrl }}
                style={styles.zoomImage}
                resizeMode="contain"
              />
            )}
          </ScrollView>
        </View>
      </Modal>
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
  recetasList: {
    gap: 12,
    padding: 16,
  },
  recetaCard: {
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
  recetaId: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
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
  responderButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
  },
  responderButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  imageContainer: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 12,
    position: "relative",
    backgroundColor: colors.surface,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  zoomIconOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 20,
    padding: 6,
  },
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
    backgroundColor: "white",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  modalImageContainer: {
    width: "100%",
    height: 250,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
    position: "relative",
    backgroundColor: colors.surface,
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  modalZoomHint: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  modalZoomText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  infoCardModal: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    marginBottom: 16,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
    marginTop: 12,
  },
  estadoButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  estadoButton: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    
    alignItems: "center",
  },
  estadoButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  estadoButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  estadoButtonTextActive: {
    color: "white",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  precioInput: {
    fontSize: 20,
    fontWeight: "600",
  },
  precioPreview: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  precioPreviewLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  precioPreviewValue: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.primary,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  zoomModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  zoomModalClose: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
  },
  zoomScrollContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  zoomImage: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
});