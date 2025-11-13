import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db, auth } from "../src/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { globalStyles, colors } from "../assets/styles";
import { API_URL } from "../src/config/apiConfig";

// Tipos e imports
import {
  PAYMENT_CONFIG,
  Address,
  Cotizacion,
  Receta,
  PreferenciaRequest,
  PreferenciaResponse,
} from "../assets/types";

// Hooks centralizados
import { useUltimoPedidoPorReceta } from "../src/lib/firestoreHooks";

// Helpers centralizados
import { getEstadoPedidoConfig } from "../src/lib/estadosHelpers";
import { isAddressValid, formatCurrency } from "../src/lib/formatHelpers";

export default function Pagar() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const recetaId = params.recetaId as string;
  const cotizacionId = params.cotizacionId as string;

  const [loadingStatic, setLoadingStatic] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [creandoPago, setCreandoPago] = useState(false);
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);
  const [receta, setReceta] = useState<Receta | null>(null);
  const [direccionUsuario, setDireccionUsuario] = useState<Address | null>(null);

  // Hook para obtener pedido en tiempo real
  const { pedido: pedidoExistente, loading: loadingPedido, error: errorPedido } =
    useUltimoPedidoPorReceta(recetaId);

  // Cargar dirección del usuario
  useFocusEffect(
    useCallback(() => {
      const loadDireccion = async () => {
        try {
          const userId = auth.currentUser?.uid;
          if (!userId) return;

          const userRef = doc(db, "users", userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.address) {
              setDireccionUsuario(userData.address);
            }
          }
        } catch (error) {
          console.error("Error al cargar dirección:", error);
          Alert.alert("Error", "No pudimos cargar tu dirección");
        }
      };

      loadDireccion();

      return () => {
        // Limpieza si es necesario
      };
    }, [])
  );

  // Cargar datos estáticos (cotización, receta)
  useEffect(() => {
    if (!recetaId || !cotizacionId) return;

    const loadStaticData = async () => {
      setLoadingStatic(true);
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          Alert.alert("Error", "Usuario no autenticado");
          router.back();
          return;
        }

        // Cargar Cotización
        const cotizacionRef = doc(
          db,
          "recetas",
          recetaId,
          "cotizaciones",
          cotizacionId
        );
        const cotizacionSnap = await getDoc(cotizacionRef);

        if (!cotizacionSnap.exists()) {
          Alert.alert("Error", "No se encontró la cotización");
          router.back();
          return;
        }
        const cotizacionData = cotizacionSnap.data();
        setCotizacion({
          id: cotizacionSnap.id,
          farmaciaId: cotizacionData.farmaciaId,
          nombreComercial: cotizacionData.nombreComercial,
          direccion: cotizacionData.direccion,
          precio: cotizacionData.precio,
          estado: cotizacionData.estado,
          fechaCreacion: cotizacionData.fechaCreacion.toDate(),
          imagenUrl: cotizacionData.imagenUrl,
        });

        // Cargar Receta
        const recetaRef = doc(db, "recetas", recetaId);
        const recetaSnap = await getDoc(recetaRef);
        if (recetaSnap.exists()) {
          const recetaData = recetaSnap.data();
          setReceta({
            id: recetaSnap.id,
            imagenUrl: recetaData.imagenUrl,
            userId: recetaData.userId,
            estado: recetaData.estado,
            fechaCreacion: recetaData.fechaCreacion.toDate(),
          });
        }
      } catch (error) {
        console.error("Error al cargar datos estáticos:", error);
        Alert.alert("Error", "No pudimos cargar los datos del pago");
      } finally {
        setLoadingStatic(false);
      }
    };

    loadStaticData();
  }, [recetaId, cotizacionId]);

  const validarCotizacionDisponible = async (): Promise<boolean> => {
    try {
      const cotizacionRef = doc(
        db,
        "recetas",
        recetaId,
        "cotizaciones",
        cotizacionId
      );
      const cotizacionSnap = await getDoc(cotizacionRef);

      if (!cotizacionSnap.exists()) {
        Alert.alert("Error", "Esta cotización ya no existe");
        return false;
      }
      const cotizacionData = cotizacionSnap.data();
      if (cotizacionData.estado !== "cotizado") {
        Alert.alert(
          "No disponible",
          "Esta cotización ya no está disponible.",
          [{ text: "Entendido", onPress: () => router.back() }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error validando cotización:", error);
      Alert.alert("Error", "No pudimos verificar la disponibilidad");
      return false;
    }
  };

  const crearPreferencia = async (): Promise<PreferenciaResponse> => {
    if (!cotizacion || !receta || !direccionUsuario) {
      throw new Error("Faltan datos necesarios");
    }
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error("Usuario no autenticado");
    }

    const request: PreferenciaRequest = {
      nombreComercial: cotizacion.nombreComercial,
      recetaId: recetaId,
      userId: userId,
      farmaciaId: cotizacion.farmaciaId,
      direccion: direccionUsuario,
      cotizacionId: cotizacionId,
      imagenUrl: cotizacion.imagenUrl || receta.imagenUrl,
      descripcion: `Pedido de medicamento`,
    };

    const response = await fetch(`${API_URL}/api/pagos/crear-preferencia`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Error desconocido" }));
      throw new Error(errorData.error || `Error ${response.status}`);
    }
    return response.json();
  };

  const handlePagar = async () => {
    // Validar dirección usando helper centralizado
    if (!isAddressValid(direccionUsuario)) {
      Alert.alert(
        "Dirección incompleta",
        "Por favor completa tu dirección en el perfil antes de realizar el pago",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Ir al perfil", onPress: () => router.push("/(tabs)/perfil") },
        ]
      );
      return;
    }

    if (creandoPago) return;

    const disponible = await validarCotizacionDisponible();
    if (!disponible) return;

    setCreandoPago(true);
    setProcesando(true);

    try {
      // Intento de crear la preferencia
      const response = await crearPreferencia();
      // Lógica de éxito
      const supported = await Linking.canOpenURL(response.paymentUrl);

      if (supported) {
        await Linking.openURL(response.paymentUrl);
        setTimeout(() => {
          Alert.alert(
            "Completa tu pago",
            "Se abrió MercadoPago.\n\nCuando termines, vuelve a la app y verifica el estado en 'Mis Pedidos'.",
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Ver Pedidos",
                onPress: () => router.push("/(tabs)/pedidos"),
              },
            ]
          );
        }, 1000);
      } else {
        throw new Error("No se puede abrir el enlace de pago");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "";

      if (errorMessage.includes("Ya existe un pedido en proceso")) {
        Alert.alert(
          "Pago en Proceso",
          "Ya tienes un pago en proceso para esta receta. Por favor, verifica el estado en 'Mis Pedidos'.",
          [
            { text: "Entendido", style: "cancel" },
            {
              text: "Ver Pedidos",
              onPress: () => router.push("/(tabs)/pedidos"),
            },
          ]
        );
      } else {
        console.error("Error al procesar pago:", error);
        Alert.alert(
          "Error al procesar pago",
          errorMessage || "Ocurrió un error inesperado"
        );
      }
    } finally {
      setProcesando(false);
      setCreandoPago(false);
    }
  };

  // Lógica de botones según el estado del pedido
  const getTipoBoton = ():
    | "pagar"
    | "reintentar"
    | "procesando"
    | "pagado"
    | "bloqueado" => {
    // No hay ningún pedido para esta receta
    if (!pedidoExistente) {
      return "pagar";
    }

    // Hay un pedido de ESTA MISMA cotización
    if (pedidoExistente.cotizacionId === cotizacionId) {
      const { estado } = pedidoExistente;

      if (estado === "pendiente_de_pago" || estado === "pendiente") {
        return "procesando";
      }
      if (estado === "pagado") {
        return "pagado";
      }
      if (PAYMENT_CONFIG.ESTADOS_FALLIDOS.includes(estado as any)) {
        return "reintentar";
      }
    }

    // Hay un pedido de OTRA cotización (otra farmacia)
    if (pedidoExistente.cotizacionId !== cotizacionId) {
      const { estado } = pedidoExistente;

      // Si el pedido de la OTRA farmacia está activo, bloquear
      if (PAYMENT_CONFIG.ESTADOS_BLOQUEANTES.includes(estado as any)) {
        return "bloqueado";
      }

      // Si el pedido de la OTRA farmacia falló, permitir pagar aquí
      return "pagar";
    }

    return "bloqueado";
  };

  const loading = loadingStatic || loadingPedido;

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={globalStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={globalStyles.loadingText}>Cargando información...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorPedido) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={globalStyles.headerWithBorder}>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/(tabs)/solicitudes",
                params: { recetaId },
              })
            }
            style={styles.iconButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={globalStyles.titleSmall}>Confirmar Pago</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={globalStyles.emptyContainer}>
          <Ionicons
            name="cloud-offline-outline"
            size={64}
            color={colors.errorDark}
          />
          <Text style={globalStyles.emptyTitle}>Error de Conexión</Text>
          <Text style={globalStyles.emptyText}>
            No pudimos verificar el estado del pedido. Por favor, revisa tu
            conexión e inténtalo de nuevo.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!cotizacion || !receta) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={globalStyles.emptyContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.textTertiary} />
          <Text style={globalStyles.emptyTitle}>Error</Text>
          <Text style={globalStyles.emptyText}>
            No se pudieron cargar los datos del pago
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Usar helper centralizado para obtener configuración de estado
  const estadoConfig = pedidoExistente
    ? getEstadoPedidoConfig(pedidoExistente.estado)
    : null;
  const tipoBoton = getTipoBoton();

  return (
    <SafeAreaView style={globalStyles.container} edges={["top"]}>
      <View style={globalStyles.headerWithBorder}>
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/(tabs)/solicitudes",
              params: { recetaId },
            })
          }
          style={styles.iconButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={globalStyles.titleSmall}>Confirmar Pago</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {pedidoExistente && estadoConfig && (
          <View
            style={[styles.estadoCard, { backgroundColor: estadoConfig.bg }]}
          >
            <View style={styles.estadoHeader}>
              <Ionicons
                name={estadoConfig.icon as any}
                size={32}
                color={estadoConfig.color}
              />
              <View style={styles.estadoInfo}>
                <Text
                  style={[styles.estadoLabel, { color: estadoConfig.color }]}
                >
                  {estadoConfig.label}
                </Text>
                <Text
                  style={[
                    styles.estadoDescripcion,
                    { color: estadoConfig.color },
                  ]}
                >
                  {estadoConfig.descripcion}
                </Text>
                {pedidoExistente.cotizacionId !== cotizacionId && (
                  <Text
                    style={[
                      styles.estadoDescripcion,
                      {
                        color: estadoConfig.color,
                        marginTop: 4,
                        fontWeight: "700",
                      },
                    ]}
                  >
                    ⚠️ Este estado es en {pedidoExistente.nombreComercialFarmacia}
                  </Text>
                )}
              </View>
            </View>

            {pedidoExistente.paymentId && (
              <Text style={styles.paymentId}>
                ID de pago: {pedidoExistente.paymentId}
              </Text>
            )}
          </View>
        )}

        <View style={globalStyles.card}>
          <Text style={globalStyles.sectionTitle}>Detalle del Medicamento</Text>
          <View style={styles.medicamentoInfo}>
            {cotizacion.imagenUrl && (
              <Image
                source={{ uri: cotizacion.imagenUrl }}
                style={styles.medicamentoImagen}
              />
            )}
            <View style={styles.medicamentoTexto}>
              <Text style={styles.medicamentoNombre}>
                {cotizacion.nombreComercial}
              </Text>
              <Text style={styles.infoSecundaria}>
                <Ionicons
                  name="storefront"
                  size={16}
                  color={colors.textSecondary}
                />{" "}
                {cotizacion.direccion}
              </Text>
            </View>
          </View>
          <View style={styles.precioContainer}>
            <Text style={styles.precioLabel}>Total a pagar:</Text>
            <Text style={styles.precioValor}>
              {formatCurrency(cotizacion.precio)}
            </Text>
          </View>
        </View>

        <View style={globalStyles.card}>
          <Text style={globalStyles.sectionTitle}>Dirección de Entrega</Text>
          {direccionUsuario ? (
            <View style={styles.direccionInfo}>
              <Ionicons name="location" size={24} color={colors.primary} />
              <View style={styles.direccionTexto}>
                <Text style={styles.direccionCalle}>
                  {direccionUsuario.street}
                </Text>
                <Text style={styles.infoSecundaria}>
                  {direccionUsuario.city}, {direccionUsuario.province}
                </Text>
                <Text style={styles.infoSecundaria}>
                  CP: {direccionUsuario.postalCode}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.sinDireccion}>
              <Ionicons
                name="alert-circle"
                size={24}
                color={colors.warningDark}
              />
              <Text style={styles.sinDireccionTexto}>
                No tienes una dirección configurada
              </Text>
              <Pressable
                style={styles.configurarButton}
                onPress={() => router.push("/(tabs)/perfil")}
              >
                <Text style={styles.configurarButtonText}>
                  Configurar ahora
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.seguridadCard}>
          <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
          <View style={styles.seguridadTexto}>
            <Text style={styles.seguridadTitulo}>Pago seguro</Text>
            <Text style={styles.infoSecundaria}>
              Tu pago es procesado de forma segura por MercadoPago
            </Text>
          </View>
        </View>

        <View style={globalStyles.spacer} />
      </ScrollView>

      {/* Botón de Acción */}
      <View style={styles.buttonContainer}>
        {tipoBoton === "pagado" ? (
          <Pressable
            style={[styles.actionButton, styles.successButton]}
            onPress={() => router.push("/(tabs)/pedidos")}
          >
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={colors.surface}
            />
            <Text style={styles.actionButtonText}>Ver mis pedidos</Text>
          </Pressable>
        ) : tipoBoton === "procesando" ? (
          <View style={[styles.actionButton, globalStyles.buttonDisabled]}>
            <ActivityIndicator size="small" color={colors.surface} />
            <Text style={styles.actionButtonText}>Procesando pago...</Text>
          </View>
        ) : tipoBoton === "reintentar" ? (
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              procesando && globalStyles.buttonDisabled,
              pressed && globalStyles.buttonPressed,
            ]}
            onPress={handlePagar}
            disabled={procesando}
          >
            {procesando ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <Ionicons name="refresh" size={24} color={colors.surface} />
            )}
            <Text style={styles.actionButtonText}>
              {procesando ? "Procesando..." : "Reintentar pago"}
            </Text>
          </Pressable>
        ) : tipoBoton === "pagar" ? (
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              procesando && globalStyles.buttonDisabled,
              pressed && globalStyles.buttonPressed,
            ]}
            onPress={handlePagar}
            disabled={procesando}
          >
            {procesando ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <Ionicons name="card" size={24} color={colors.surface} />
            )}
            <Text style={styles.actionButtonText}>
              {procesando ? "Procesando..." : "Pagar con MercadoPago"}
            </Text>
          </Pressable>
        ) : tipoBoton === "bloqueado" ? (
          <View style={[styles.actionButton, globalStyles.buttonDisabled]}>
            <Ionicons name="lock-closed" size={24} color={colors.surface} />
            <Text style={styles.actionButtonText}>Pago no disponible</Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  estadoCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  estadoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  estadoInfo: {
    flex: 1,
    gap: 4,
  },
  estadoLabel: {
    fontSize: 18,
    fontWeight: "700",
  },
  estadoDescripcion: {
    fontSize: 14,
    fontWeight: "500",
  },
  paymentId: {
    marginTop: 12,
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: "monospace",
  },
  medicamentoInfo: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  medicamentoImagen: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.gray100,
  },
  medicamentoTexto: {
    flex: 1,
    gap: 8,
  },
  medicamentoNombre: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  infoSecundaria: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  precioContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  precioLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  precioValor: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.primary,
  },
  direccionInfo: {
    flexDirection: "row",
    gap: 12,
  },
  direccionTexto: {
    flex: 1,
    gap: 4,
  },
  direccionCalle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  sinDireccion: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  sinDireccionTexto: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  configurarButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  configurarButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "600",
  },
  seguridadCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    marginTop: 8,
  },
  seguridadTexto: {
    flex: 1,
    gap: 4,
  },
  seguridadTitulo: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "700",
  },
  successButton: {
    backgroundColor: colors.successDark,
  },
});