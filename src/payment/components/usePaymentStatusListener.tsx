// src/payment/hooks/usePaymentStatusListener.ts
import { useEffect, useRef } from "react";
import { EstadoPedido, PAYMENT_CONFIG, PedidoActivoReceta } from "../../../assets/types";

interface PaymentStatusListenerProps {
  pedidoExistente: PedidoActivoReceta | null;
  cotizacionId: string;
  onPaymentSuccess: () => void;
  onPaymentFailed: () => void;
}

/**
 * 💡 SOLUCIÓN:
 * Usamos un 'Set' de JavaScript en lugar de 'sessionStorage'.
 * Esto funciona en todas las plataformas (Web, iOS, Android)
 * y mantiene la lógica de "sesión" (se borra si la app se reinicia).
 */
const shownModalPedidos = new Set<string>();

/**
 * Hook para detectar cambios de estado del pedido en tiempo real
 * * - Detecta transiciones de estado (pendiente -> pagado/rechazado)
 * - Muestra el modal SOLO UNA VEZ por pedido
 * - Persiste el estado entre recargas usando un Set en memoria
 */
export function usePaymentStatusListener({
  pedidoExistente,
  cotizacionId,
  onPaymentSuccess,
  onPaymentFailed,
}: PaymentStatusListenerProps) {
  const previousEstadoRef = useRef<EstadoPedido | null>(null);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    console.log("🔍 [usePaymentStatusListener] Verificando estado del pedido...");
    
    // Si no hay pedido, resetear todo
    if (!pedidoExistente) {
      console.log("⚪ No hay pedido existente");
      previousEstadoRef.current = null;
      isFirstRenderRef.current = true;
      return;
    }

    const estadoActual = pedidoExistente.estado as EstadoPedido;
    const estadoPrevio = previousEstadoRef.current;
    const esMismaCotizacion = pedidoExistente.cotizacionId === cotizacionId;
    const pedidoId = pedidoExistente.id;

    console.log("📊 Estado del pedido:", {
      pedidoId,
      estadoActual,
      estadoPrevio,
      cotizacionPedido: pedidoExistente.cotizacionId,
      cotizacionActual: cotizacionId,
      esMismaCotizacion,
      isFirstRender: isFirstRenderRef.current,
    });

    // Solo procesar si es la misma cotización
    if (!esMismaCotizacion) {
      console.log("⚠️ Pedido de otra cotización, ignorando");
      previousEstadoRef.current = estadoActual;
      return;
    }

    // 💡 CAMBIO: Usar el 'Set' en lugar de sessionStorage
    const yaSeVioModal = shownModalPedidos.has(pedidoId);

    // CASO 1: Primera renderización en esta sesión
    if (isFirstRenderRef.current) {
      console.log("ℹ️ Primera renderización, guardando estado inicial:", estadoActual);
      previousEstadoRef.current = estadoActual;
      isFirstRenderRef.current = false;
      
      // Si el pedido ya está en un estado final Y el usuario NO ha visto el modal
      // (por ejemplo, volvió después de completar el pago en otra pestaña)
      if (!yaSeVioModal) {
        if (estadoActual === "pagado") {
          console.log("✅ Pedido ya pagado al cargar - Mostrando modal de éxito");
          shownModalPedidos.add(pedidoId); // 💡 CAMBIO
          onPaymentSuccess();
        } else if (PAYMENT_CONFIG.ESTADOS_FALLIDOS.includes(estadoActual as any)) {
          console.log("❌ Pedido rechazado al cargar - Mostrando modal de error");
          shownModalPedidos.add(pedidoId); // 💡 CAMBIO
          onPaymentFailed();
        }
      } else {
        console.log("✓ Modal ya fue mostrado anteriormente para este pedido");
      }
      
      return;
    }

    // CASO 2: Detectar cambio de estado en tiempo real
    if (estadoPrevio !== estadoActual) {
      console.log(`🔔 ¡Cambio de estado detectado! ${estadoPrevio} -> ${estadoActual}`);

      if (!yaSeVioModal) {
        if (estadoActual === "pagado") {
          console.log("✅ Pago exitoso - Mostrando modal");
          shownModalPedidos.add(pedidoId); // 💡 CAMBIO
          onPaymentSuccess();
        } else if (PAYMENT_CONFIG.ESTADOS_FALLIDOS.includes(estadoActual as any)) {
          console.log("❌ Pago rechazado - Mostrando modal");
          shownModalPedidos.add(pedidoId); // 💡 CAMBIO
          onPaymentFailed();
        } else {
          console.log(`ℹ️ Cambio a estado intermedio: ${estadoActual}`);
        }
      } else {
        console.log("✓ Cambio detectado pero modal ya fue mostrado");
      }

      // Actualizar referencia
      previousEstadoRef.current = estadoActual;
    } else {
      console.log("➡️ Estado sin cambios");
    }
  }, [pedidoExistente, cotizacionId, onPaymentSuccess, onPaymentFailed]);

  // Resetear refs cuando cambia la cotización (nuevo intento de pago)
  useEffect(() => {
    console.log("🔄 Cotización cambió, reseteando detector");
    previousEstadoRef.current = null;
    isFirstRenderRef.current = true;
  }, [cotizacionId]);
}