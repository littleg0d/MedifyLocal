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
} from "../../../assets/types";

import { navigateToPedidos, navigateToPerfil } from "../../lib/navigationHelpers";
import { useUltimoPedidoPorReceta } from "../../lib/firestoreHooks";
import { getEstadoPedidoConfig } from "../../lib/estadosHelpers";
import { isAddressValid, esPedidoDuplicado, ALERT_DELAY_MS } from "../../lib/formatHelpers";
import { UsePaymentLogicReturn, TipoBoton } from "../types";

// ✅ Nuevo tipo simplificado para el request
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

  // Hook de pedido en tiempo real
  const { pedido: pedidoExistente, loading: loadingPedido, error: errorPedido } =
    useUltimoPedidoPorReceta(recetaId);

  // ⭐ REF para controlar el timeout y evitar race conditions
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ⭐ Limpiar timeout cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
    };
  }, []);

  // ==================== AUTH GUARD ====================
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      if (Platform.OS === 'web') {
        window.alert("Sesión expirada. Por favor inicia sesión nuevamente");
      } else {
        Alert.alert("Sesión expirada", "Por favor inicia sesión nuevamente");
      }
      router.replace("/login");
      return;
    }
  }, [router]);

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
    }, [router])
  );

  // ==================== CARGA DE DATOS ESTÁTICOS ====================
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

        // Cargar en paralelo
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

  // ==================== CREAR PREFERENCIA (SIMPLIFICADO) ====================
  const crearPreferencia = useCallback(async (): Promise<PreferenciaResponse> => {
    if (!cotizacion) {
      throw new Error("Faltan datos de cotización");
    }

    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error("Usuario no autenticado");
    }

    // ✅ Solo enviar IDs - El backend obtiene todo lo demás desde Firebase
    const request: PreferenciaRequestSimple = {
      userId: userId,
      farmaciaId: cotizacion.farmaciaId,
      recetaId: recetaId,
      cotizacionId: cotizacionId,
    };

    console.log("📤 Enviando request simplificado:", request);

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
  }, [cotizacion, recetaId, cotizacionId]);

  // ==================== MANEJADOR DE PAGO ====================
  const handlePagar = useCallback(async () => {
    if (procesandoPago) return;

    // Validar dirección
    if (!isAddressValid(direccionUsuario)) {
      if (Platform.OS === 'web') {
        const confirmar = window.confirm(
          "Dirección incompleta\n\nPor favor completa tu dirección en el perfil antes de realizar el pago"
        );
        if (confirmar) {
          navigateToPerfil(router);
        }
      } else {
        Alert.alert(
          "Dirección incompleta",
          "Por favor completa tu dirección en el perfil antes de realizar el pago",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Ir al perfil", onPress: () => navigateToPerfil(router) },
          ]
        );
      }
      return;
    }

    // Validar disponibilidad usando estado actual
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
      
      // ⭐ ABRIR URL CON SOPORTE WEB Y MÓVIL
      let opened = false;
      
      if (Platform.OS === 'web') {
        // En web usar window.open
        const ventana = window.open(response.paymentUrl, '_blank');
        opened = ventana !== null;
      } else {
        // En móvil usar Linking
        const canOpen = await Linking.canOpenURL(response.paymentUrl);
        if (canOpen) {
          await Linking.openURL(response.paymentUrl);
          opened = true;
        }
      }

      if (!opened) {
        throw new Error("No se pudo abrir el enlace de pago");
      }

      // Mostrar confirmación después de abrir MercadoPago
      alertTimeoutRef.current = setTimeout(() => {
        if (procesandoPago) {
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
        }
        
        alertTimeoutRef.current = null;
      }, ALERT_DELAY_MS);
      
    } catch (error) {
      // Limpiar timeout si hay error
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
        console.error("Error al procesar pago:", error);
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

  // ==================== LÓGICA DEL BOTÓN (con useMemo) ====================
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
    tipoBoton,
    handlePagar,
  };
}