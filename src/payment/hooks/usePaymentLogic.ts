import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Platform, Linking, Alert } from "react-native";
import { useFocusEffect } from "expo-router";
import { db, auth } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { API_URL } from "../../config/apiConfig";
import {
  PAYMENT_CONFIG,
  Address,
  Cotizacion,
  Receta,
  PreferenciaResponse,
  PedidoActivoReceta,
} from "../../../assets/types";

import { navigateToPedidos } from "../../lib/navigationHelpers";
import { useUltimoPedidoPorReceta } from "../../lib/firestoreHooks";
import { getEstadoPedidoConfig } from "../../lib/estadosHelpers";
import { isAddressValid, esPedidoDuplicado, ALERT_DELAY_MS } from "../../lib/formatHelpers";
import { mapCotizacionFromFirestore, mapRecetaFromFirestore } from "../../lib/firestoreMappers";
import { UsePaymentLogicReturn, TipoBoton } from "../types";
import { usePaymentStatusListener } from "../components/usePaymentStatusListener";

interface PreferenciaRequestSimple {
  userId: string;
  farmaciaId: string;
  recetaId: string;
  cotizacionId: string;
}

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
  
  // Estados para el modal de resultado de pago
  const [showModal, setShowModal] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);
  
  // Hook de pedido en tiempo real (Firebase Listener)
  const { pedido: pedidoExistente, loading: loadingPedido, error: errorPedido } =
    useUltimoPedidoPorReceta(recetaId);

  const alertTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
        alertTimeoutRef.current = null;
      }
    };
  }, []);

  // ==================== FUNCIONES CALLBACK PARA EL HOOK LISTENER ====================
  const handlePaymentSuccess = useCallback(() => {
    setModalSuccess(true);
    setShowModal(true);
  }, []);

  const handlePaymentFailed = useCallback(() => {
    setModalSuccess(false);
    setShowModal(true);
  }, []);
  
  // ==================== INTEGRACIÓN DEL HOOK DE ESCUCHA DE ESTADO ====================
  usePaymentStatusListener({
    pedidoExistente,
    cotizacionId,
    onPaymentSuccess: handlePaymentSuccess,
    onPaymentFailed: handlePaymentFailed,
  });

  // ==================== MANEJADOR DEL MODAL ====================
  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    // Redirigir a pedidos siempre al cerrar el modal
    navigateToPedidos(router);
  }, [router]);

  // ==================== AUTH GUARD ====================
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      // Si no hay usuario, forzar alerta y redirección
      if (Platform.OS === 'web') {
        window.alert("Sesión expirada. Por favor inicia sesión nuevamente");
      } else {
        Alert.alert("Sesión expirada", "Por favor inicia sesión nuevamente");
      }
      router.replace("/login");
      return;
    }
  }, [router]);

  // ==================== CARGA DE DIRECCIÓN DESDE LA RECETA (Firebase) ====================
  useFocusEffect(
    useCallback(() => {
      const loadDireccionDesdeReceta = async () => {
        try {
          if (!recetaId) return;

          const recetaRef = doc(db, "recetas", recetaId);
          const recetaSnap = await getDoc(recetaRef);

          if (recetaSnap.exists()) {
            const recetaData = recetaSnap.data();
            setDireccionUsuario(recetaData.userAddress || null);
          }
        } catch (error) {
          console.error("❌ Error al cargar dirección desde receta (Firebase):", error);
        }
      };

      loadDireccionDesdeReceta();
    }, [recetaId])
  );

  // ==================== CARGA DE DATOS ESTÁTICOS (Firebase) ====================
  useEffect(() => {
    if (!recetaId || !cotizacionId) {
      const mensaje = "Faltan parámetros necesarios";
      if (Platform.OS === 'web') {
        window.alert(mensaje);
      } else {
        Alert.alert("Error", mensaje);
      }
      router.back();
      return;
    }

    const loadStaticData = async () => {
      setLoadingStatic(true);
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          const mensaje = "Usuario no autenticado";
          if (Platform.OS === 'web') {
            window.alert(mensaje);
          } else {
            Alert.alert("Error", mensaje);
          }
          router.back();
          return;
        }

        // Cargar en paralelo (Firebase Interaction)
        const [cotizacionSnap, recetaSnap] = await Promise.all([
          getDoc(doc(db, "recetas", recetaId, "cotizaciones", cotizacionId)),
          getDoc(doc(db, "recetas", recetaId)),
        ]);

        if (!cotizacionSnap.exists()) {
          const mensaje = "No se encontró la cotización";
          if (Platform.OS === 'web') {
            window.alert(mensaje);
          } else {
            Alert.alert("Error", mensaje);
          }
          router.back();
          return;
        }

        const cotizacionCompleta = mapCotizacionFromFirestore(
          cotizacionSnap.id,
          cotizacionSnap.data()
        );
        setCotizacion(cotizacionCompleta);

        if (recetaSnap.exists()) {
          const recetaCompleta = mapRecetaFromFirestore(
            recetaSnap.id,
            recetaSnap.data()
          );
          setReceta(recetaCompleta);
        }
      } catch (error) {
        console.error("❌ Error al cargar datos estáticos (Firebase):", error);
        const mensaje = "No pudimos cargar los datos del pago";
        if (Platform.OS === 'web') {
          window.alert(mensaje);
        } else {
          Alert.alert("Error", mensaje);
        }
        router.back();
      } finally {
        setLoadingStatic(false);
      }
    };

    loadStaticData();
  }, [recetaId, cotizacionId, router]);

  // ==================== CREAR PREFERENCIA (API Request) ====================
  const crearPreferencia = useCallback(async (): Promise<PreferenciaResponse> => {
    if (!cotizacion) {
      throw new Error("Faltan datos de cotización");
    }

    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error("Usuario no autenticado");
    }

    const request: PreferenciaRequestSimple = {
      userId: userId,
      farmaciaId: cotizacion.farmaciaId,
      recetaId: recetaId,
      cotizacionId: cotizacionId,
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
      console.error(`❌ Error al crear preferencia (API ${response.status}):`, errorData);
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    return response.json();
  }, [cotizacion, recetaId, cotizacionId]);

  // ==================== MANEJADOR DE PAGO ====================
  const handlePagar = useCallback(async () => {
    if (procesandoPago) return;

    if (!isAddressValid(direccionUsuario)) {
      if (Platform.OS === 'web') {
        window.alert(
          "La receta no tiene dirección válida. Por favor, vuelve a cargar la receta con una dirección configurada."
        );
      } else {
        Alert.alert(
          "Dirección inválida",
          "La receta no tiene dirección válida. Por favor, vuelve a cargar la receta con una dirección configurada."
        );
      }
      return;
    }

    if (cotizacion?.estado !== "cotizado") {
      if (Platform.OS === 'web') {
        window.alert("Esta cotización ya no está disponible.");
        router.back();
      } else {
        Alert.alert(
          "No disponible",
          "Esta cotización ya no está disponible.",
          [{ text: "Entendido", onPress: () => router.back() }]
        );
      }
      return;
    }

    setProcesandoPago(true);

    try {
      const response = await crearPreferencia();
      
      let opened = false;
      
      if (Platform.OS === 'web') {
        const ventana = window.open(response.paymentUrl, '_blank');
        opened = ventana !== null;
      } else {
        const canOpen = await Linking.canOpenURL(response.paymentUrl);
        if (canOpen) {
          await Linking.openURL(response.paymentUrl);
          opened = true;
        }
      }

      if (!opened) {
        throw new Error("No se pudo abrir el enlace de pago");
      }

      // Limpiar timeout previo si existe
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }

      // Mostrar alerta después de un delay
      alertTimeoutRef.current = setTimeout(() => {
        // Verificar que el componente siga montado
        if (!procesandoPago) {
          alertTimeoutRef.current = null;
          return;
        }

        if (Platform.OS === 'web') {
          const irAPedidos = window.confirm(
            "Completa tu pago\n\nSe abrió MercadoPago.\n\nCuando termines, vuelve a la app y verifica el estado en 'Mis Pedidos'."
          );
          if (irAPedidos) {
            navigateToPedidos(router);
          }
        } else {
          Alert.alert(
            "Completa tu pago",
            "Se abrió MercadoPago.\n\nCuando termines, vuelve a la app y verifica el estado en 'Mis Pedidos'.",
            [
              { text: "Cancelar", style: "cancel" },
              { text: "Ver Pedidos", onPress: () => navigateToPedidos(router) },
            ]
          );
        }
        
        alertTimeoutRef.current = null;
      }, ALERT_DELAY_MS);
      
    } catch (error) {
      // Limpiar timeout en caso de error
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
        alertTimeoutRef.current = null;
      }

      const errorMessage = error instanceof Error ? error.message : "Error desconocido";

      if (esPedidoDuplicado(errorMessage)) {
        if (Platform.OS === 'web') {
          const irAPedidos = window.confirm(
            "Pago en Proceso\n\nYa tienes un pago en proceso para esta receta. Por favor, verifica el estado en 'Mis Pedidos'."
          );
          if (irAPedidos) {
            navigateToPedidos(router);
          }
        } else {
          Alert.alert(
            "Pago en Proceso",
            "Ya tienes un pago en proceso para esta receta. Por favor, verifica el estado en 'Mis Pedidos'.",
            [
              { text: "Entendido", style: "cancel" },
              { text: "Ver Pedidos", onPress: () => navigateToPedidos(router) },
            ]
          );
        }
      } else {
        console.error("❌ Error al procesar pago:", error);
        if (Platform.OS === 'web') {
          window.alert(`Error al procesar pago: ${errorMessage}`);
        } else {
          Alert.alert("Error al procesar pago", errorMessage);
        }
      }
    } finally {
      setProcesandoPago(false);
    }
  }, [
    procesandoPago,
    direccionUsuario,
    cotizacion,
    crearPreferencia,
    router,
  ]);

  // ==================== LÓGICA DEL BOTÓN ====================
  const tipoBoton = useMemo((): TipoBoton => {
    if (!pedidoExistente) return "pagar";

    const { estado, cotizacionId: pedidoCotizacionId } = pedidoExistente;
    const esMismaCotizacion = pedidoCotizacionId === cotizacionId;

    if (esMismaCotizacion) {
      if (estado === "pagado") return "pagado";
      if (estado === "pendiente_de_pago" || estado === "pendiente") return "procesando";
      if (PAYMENT_CONFIG.ESTADOS_FALLIDOS.includes(estado as any)) return "reintentar";
    }

    if (!esMismaCotizacion) {
      // El usuario intentó pagar otra cotización de la misma receta
      if (PAYMENT_CONFIG.ESTADOS_BLOQUEANTES.includes(estado as any)) {
        return "bloqueado"; // Bloquear si el pedido existente está pagado/entregado/pendiente
      }
      return "pagar";
    }

    return "bloqueado"; // Bloqueo por defecto si no cae en ninguna lógica específica
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
    tipoBoton,
    handlePagar,
    showModal,
    modalSuccess,
    handleCloseModal,
  };
}