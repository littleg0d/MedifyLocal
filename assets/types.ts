/**
 * 📋 TIPOS CENTRALIZADOS DE LA APLICACIÓN
 *
 * Este archivo contiene todas las interfaces, tipos y
 * constantes de configuración compartidas.
 */

// ==================== DIRECCIONES ====================
// Tipo base usado en Usuario y Pedido
export interface Address {
  street: string;
  city: string;
  province: string;
  postalCode: string;
}

// ==================== USUARIOS ====================

export interface Usuario {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  address?: Address;
  obraSocial?: {
    name: string;
    number: string;
  };
  birthdate?: Date | string;
  createdAt?: Date;
  displayName?: string;
  dni?: string;
  phone?: string;
}

// ==================== RECETAS ====================

export type EstadoReceta =
  | 'farmacias_respondiendo'
  | 'esperando_respuestas'
  | 'finalizada'

export interface Receta {
  id: string;
  userId: string;
  imagenUrl: string;
  fechaCreacion: Date;
  estado: EstadoReceta;
  imagenPath?: string;
  cotizacionesCount?: number;
}

// ==================== COTIZACIONES ====================

export type EstadoCotizacion =
  | 'rechazada'
  | 'sin_stock'
  | 'cotizado'

export interface Cotizacion {
  id: string;
  farmaciaId: string;
  nombreComercial: string; // Nombre de la farmacia
  direccion: string; 
  precio?: number;
  estado: EstadoCotizacion;
  fechaCreacion: Date;
  imagenUrl?: string; // Imagen del producto
}

// ==================== FARMACIAS ====================

export interface Farmacia {
  id: string;
  nombreComercial: string;
  direccion: string;
  telefono?: string;
  email?: string;
  horario?: string;
}

// ======================================================
// ---- PAGOS, PEDIDOS Y CONFIGURACIÓN ----
// ======================================================

/**
 * Tipo TypeScript para los estados de pedido
 */
export type EstadoPedido =
  | 'pendiente_de_pago'
  | 'pagado'
  | 'rechazada'
  | 'abandonada'
  | 'pendiente' 
  | 'desconocido';

/**
 * Constantes de lógica de negocio para pagos.
 * La lógica de tiempo/expiración la maneja el backend.
 */
export const PAYMENT_CONFIG = {
  /**
   * Estados que bloquean una receta.
   * Si un pedido (de OTRA farmacia) está en uno de estos estados,
   * el usuario NO puede iniciar un nuevo pago.
   */
  ESTADOS_BLOQUEANTES: ['pendiente_de_pago', 'pendiente', 'pagado'] as const,

  /**
   * Estados que permiten reintentar el pago.
   * El usuario puede volver a intentar pagar cuando el pedido
   * está en cualquiera de estos estados.
   */
  ESTADOS_FALLIDOS: ['rechazado', 'abandonada'] as const,
};

// ==================== PEDIDOS ====================

export interface Pedido {
  id: string;
  userId: string;
  recetaId: string;
  cotizacionId: string;
  farmaciaId: string;
  precio: number;
  estado: EstadoPedido; // <-- Usa el tipo de arriba
  fechaCreacion: Date;
  fechaPago?: Date | null;
  fechaCierre?: Date;
  paymentId?: string;
  paymentStatus?: string;
  nombreComercial?: string;
  addressUser?: Address;
  imagenUrl?: string;
}

// ==================== MERCADOPAGO API ====================

export interface PreferenciaRequest {
  nombreComercial: string;
  recetaId: string;
  userId: string;
  farmaciaId: string;
  direccion: Address;
  cotizacionId: string;
  imagenUrl: string;
  descripcion?: string;
}

export interface PreferenciaResponse {
  paymentUrl: string;
  preferenceId: string;
}

// ======================================================
// ---- Tipos de UI y Helpers ----
// ======================================================

export interface PedidoActivoReceta {
  id: string;
  estado: EstadoPedido;
  cotizacionId: string;
  nombreComercialFarmacia: string;
  precio: number;
  fechaCreacion: Date;
  paymentId?: string;
}

export interface DetallePedido {
  pedido: Pedido;
  pedidoNumero: number;
  farmacia: {
    nombre: string;
    direccion: string;
  };
  usuario: {
    nombre: string;
    direccionEnvio: string;
    obraSocial: string;
  };
}

export interface EstadoConfig {
  icon: string;
  color: string;
  bg: string;
  label: string;
  descripcion?: string;
}