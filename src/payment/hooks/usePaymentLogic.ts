import { useState, useEffect, useCallback } from "react";
import { Alert, Linking } from "react-native";
import { useFocusEffect } from "expo-router";
import { db, auth } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { API_URL } from "../../config/apiConfig";
import {
  PAYMENT_CONFIG,
  Address,
  Cotizacion,
  Receta,
  PreferenciaRequest,
  PreferenciaResponse,
} from "../../../assets/types";

// Hooks y helpers centralizados
import { useUltimoPedidoPorReceta } from "../../lib/firestoreHooks";
import { getEstadoPedidoConfig } from "../../lib/estadosHelpers";
import { isAddressValid } from "../../lib/formatHelpers";
import { esPedidoDuplicado } from "../utils/paymentUtil";
import { ALERT_DELAY_MS } from "../utils/paymentUtil";
import { UsePaymentLogicReturn, TipoBoton } from "../types";

export function usePaymentLogic(
  recetaId: string,
  cotizacionId: string,
  router: any
): UsePaymentLogicReturn {
  // ==================== ESTADOS ====================
  const [loadingStatic, setLoadingStatic] = useState(true);
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);
  const [receta, setReceta] = useState<Receta | null>(null);
  const [direccionUsuario, setDireccionUsuario] = useState<Address | null>(null);

  // Hook de pedido en tiempo real
  const { pedido: pedidoExistente, loading: loadingPedido, error: errorPedido } =
    useUltimoPedidoPorReceta(recetaId);

  // ==================== CARGA DE DIRECCIÓN ====================
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
            setDireccionUsuario(userData.address || null);
          }
        } catch (error) {
          console.error("Error al cargar dirección:", error);
        }
      };

      loadDireccion();
    }, [])
  );

  // ==================== CARGA DE DATOS ESTÁTICOS ====================
  useEffect(() => {
    if (!recetaId || !cotizacionId) {
      Alert.alert("Error", "Faltan parámetros necesarios");
      router.back();
      return;
    }

    const loadStaticData = async () => {
      setLoadingStatic(true);
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          Alert.alert("Error", "Usuario no autenticado");
          router.back();
          return;
        }

        // Cargar en paralelo
        const [cotizacionSnap, recetaSnap] = await Promise.all([
          getDoc(doc(db, "recetas", recetaId, "cotizaciones", cotizacionId)),
          getDoc(doc(db, "recetas", recetaId)),
        ]);

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
        router.back();
      } finally {
        setLoadingStatic(false);
      }
    };

    loadStaticData();
  }, [recetaId, cotizacionId, router]);

  // ==================== VALIDACIÓN DE COTIZACIÓN ====================
  const validarCotizacionDisponible = useCallback(async (): Promise<boolean> => {
    try {
      const cotizacionRef = doc(db, "recetas", recetaId, "cotizaciones", cotizacionId);
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
  }, [recetaId, cotizacionId, router]);

  // ==================== CREAR PREFERENCIA ====================
  const crearPreferencia = useCallback(async (): Promise<PreferenciaResponse> => {
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
      imagenUrl: receta.imagenUrl,
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
  }, [cotizacion, receta, direccionUsuario, recetaId, cotizacionId]);

  // ==================== MANEJADOR DE PAGO ====================
  const handlePagar = useCallback(async () => {
    if (procesandoPago) return;

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

    // Validar disponibilidad
    const disponible = await validarCotizacionDisponible();
    if (!disponible) return;

    setProcesandoPago(true);

    try {
      const response = await crearPreferencia();
      const supported = await Linking.canOpenURL(response.paymentUrl);

      if (!supported) {
        throw new Error("No se puede abrir el enlace de pago");
      }

      await Linking.openURL(response.paymentUrl);

      setTimeout(() => {
        Alert.alert(
          "Completa tu pago",
          "Se abrió MercadoPago.\n\nCuando termines, vuelve a la app y verifica el estado en 'Mis Pedidos'.",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Ver Pedidos", onPress: () => router.push("/(tabs)/pedidos") },
          ]
        );
      }, ALERT_DELAY_MS);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";

      if (esPedidoDuplicado(errorMessage)) {
        Alert.alert(
          "Pago en Proceso",
          "Ya tienes un pago en proceso para esta receta. Por favor, verifica el estado en 'Mis Pedidos'.",
          [
            { text: "Entendido", style: "cancel" },
            { text: "Ver Pedidos", onPress: () => router.push("/(tabs)/pedidos") },
          ]
        );
      } else {
        console.error("Error al procesar pago:", error);
        Alert.alert("Error al procesar pago", errorMessage);
      }
    } finally {
      setProcesandoPago(false);
    }
  }, [
    procesandoPago,
    direccionUsuario,
    validarCotizacionDisponible,
    crearPreferencia,
    router,
  ]);

  // ==================== LÓGICA DEL BOTÓN ====================
  const getTipoBoton = useCallback((): TipoBoton => {
    if (!pedidoExistente) return "pagar";

    const { estado, cotizacionId: pedidoCotizacionId } = pedidoExistente;
    const esMismaCotizacion = pedidoCotizacionId === cotizacionId;

    if (esMismaCotizacion) {
      if (estado === "pagado") return "pagado";
      if (estado === "pendiente_de_pago" || estado === "pendiente") return "procesando";
      if (PAYMENT_CONFIG.ESTADOS_FALLIDOS.includes(estado as any)) return "reintentar";
    }

    if (!esMismaCotizacion) {
      if (PAYMENT_CONFIG.ESTADOS_BLOQUEANTES.includes(estado as any)) {
        return "bloqueado";
      }
      return "pagar";
    }

    return "bloqueado";
  }, [pedidoExistente, cotizacionId]);

  // ==================== RETURN ====================
  return {
    isLoading: loadingStatic || loadingPedido,
    procesandoPago,
    cotizacion,
    receta,
    direccionUsuario,
    pedidoExistente,
    errorPedido,
    estadoConfig: pedidoExistente ? getEstadoPedidoConfig(pedidoExistente.estado) : null,
    tipoBoton: getTipoBoton(),
    handlePagar,
  };
}