import { colors } from "../../assets/styles";
import {
  EstadoPedido,
  EstadoCotizacion,
  EstadoConfig,
  PAYMENT_CONFIG,
} from "../../assets/types";

// ============================================================================
// CONFIGURACIÓN DE ESTADOS DE PEDIDO
// ============================================================================

/**
 * Obtiene la configuración visual unificada para cada estado de pedido
 * Esta es la ÚNICA fuente de verdad para los estados de pedido
 */
export function getEstadoPedidoConfig(estado: EstadoPedido): EstadoConfig {
  const configs: Record<EstadoPedido, EstadoConfig> = {
    entregado: {
      icon: "checkmark-done-circle",
      color: colors.successDark,
      bg: colors.successLight,
      label: "Entregado",
      descripcion: "Tu pedido ha sido entregado exitosamente",
    },
    pagado: {
      icon: "checkmark-circle",
      color: colors.successDark,
      bg: colors.successLight,
      label: "Pagado",
      descripcion: "Tu pago fue procesado exitosamente",
    },
    pendiente_de_pago: {
      icon: "time",
      color: colors.warningDark,
      bg: colors.warning,
      label: "Pago en Proceso",
      descripcion: "Esperando confirmación del pago",
    },
    pendiente: {
      icon: "sync",
      color: colors.primary,
      bg: colors.primaryLight,
      label: "En Revisión",
      descripcion: "Tu pago está siendo procesado",
    },
    rechazada: {
      icon: "close-circle",
      color: colors.errorDark,
      bg: colors.errorLight,
      label: "Rechazado",
      descripcion: "El pago fue rechazado. Puedes intentar nuevamente",
    },
    abandonada: {
      icon: "alert-circle",
      color: colors.warningDark,
      bg: colors.warning,
      label: "Abandonado",
      descripcion: "El pago fue abandonado. Puedes intentar nuevamente",
    },
    desconocido: {
      icon: "help-circle",
      color: colors.textSecondary,
      bg: colors.gray200,
      label: "Desconocido",
      descripcion: "Estado del pago desconocido",
    },
  };

  return configs[estado] || configs.desconocido;
}

/**
 * Obtiene una versión simplificada del badge para listas
 * Mantiene compatibilidad con código legacy
 */
export function getEstadoPedidoBadge(estado: EstadoPedido) {
  const config = getEstadoPedidoConfig(estado);
  return {
    bg: config.bg,
    color: config.color,
    label: config.label,
    icon: config.icon,
  };
}

// ALIAS PARA COMPATIBILIDAD (se puede eliminar después de migrar todo)
export const getEstadoBadge = getEstadoPedidoBadge;
export const obtenerConfigEstadoPedido = getEstadoPedidoConfig;

// ============================================================================
// CONFIGURACIÓN DE ESTADOS DE COTIZACIÓN
// ============================================================================

/**
 * Obtiene la configuración visual para cada estado de cotización
 */
export function getEstadoCotizacionConfig(estado: EstadoCotizacion) {
  const configs = {
    cotizado: {
      bg: colors.successLight,
      text: colors.successDark,
      label: "Disponible",
      icon: "checkmark-circle-outline",
    },
    sin_stock: {
      bg: colors.gray200,
      text: colors.gray700,
      label: "Sin stock",
      icon: "close-circle-outline",
    },
    rechazada: {
      bg: colors.errorLight,
      text: colors.errorDark,
      label: "Rechazada",
      icon: "close-circle-outline",
    },
  };

  return (
    configs[estado] || {
      bg: colors.warning,
      text: colors.warningDark,
      label: "Esperando",
      icon: "time-outline",
    }
  );
}

// ALIAS PARA COMPATIBILIDAD
export const obtenerBadgeCotizacion = getEstadoCotizacionConfig;

// ============================================================================
// CONFIGURACIÓN DE ESTADOS DE RECETA
// ============================================================================

export type EstadoReceta = 
  | "esperando_respuestas" 
  | "farmacias_respondiendo" 
  | "finalizada";

/**
 * Obtiene la configuración visual para cada estado de receta
 */
export function getEstadoRecetaConfig(estado: EstadoReceta) {
  const configs = {
    esperando_respuestas: {
      bg: colors.warning,
      text: colors.warningDark,
      label: "Esperando respuestas",
    },
    farmacias_respondiendo: {
      bg: colors.successLight,
      text: colors.successDark,
      label: "Farmacias respondiendo",
    },
    finalizada: {
      bg: colors.gray200,
      text: colors.gray700,
      label: "Finalizada",
    },
  };

  return configs[estado] || {
    bg: colors.gray100,
    text: colors.textSecondary,
    label: "Desconocido",
  };
}

// ============================================================================
// VALIDACIONES DE ESTADO
// ============================================================================

/**
 * Verifica si una receta está bloqueada por tener un pedido activo
 */
export function recetaEstaBloqueada(pedido: any): boolean {
  if (!pedido) return false;
  return PAYMENT_CONFIG.ESTADOS_BLOQUEANTES.includes(pedido.estado as any);
}

/**
 * Verifica si un pedido está en un estado que permite reintentar el pago
 */
export function puedeReintentarPago(estado: EstadoPedido): boolean {
  return PAYMENT_CONFIG.ESTADOS_FALLIDOS.includes(estado as any);
}

/**
 * Verifica si un pedido está en un estado bloqueante
 */
export function esPedidoBloqueante(estado: EstadoPedido): boolean {
  return PAYMENT_CONFIG.ESTADOS_BLOQUEANTES.includes(estado as any);
}

/**
 * Verifica si un pedido está completado exitosamente
 */
export function esPedidoCompletado(estado: EstadoPedido): boolean {
  return estado === "pagado" || estado === "entregado";
}

/**
 * Verifica si un pedido está en proceso
 */
export function esPedidoEnProceso(estado: EstadoPedido): boolean {
  return estado === "pendiente_de_pago" || estado === "pendiente";
}