// ============================================================================
// TIPOS DE DIRECCIÓN
// ============================================================================

export interface Address {
  street: string;
  city: string;
  province: string;
  postalCode: string;
}

// ============================================================================
// TIPOS DE OBRA SOCIAL
// ============================================================================

export interface ObraSocial {
  name: string;
  number: string;
}

// ============================================================================
// TIPOS DE PEDIDO
// ============================================================================

export type EstadoPedido =
  | "pagado"
  | "entregado"
  | "pendiente_de_pago"
  | "pendiente"
  | "rechazada"
  | "abandonada"
  | "desconocido";

/**
 * Pedido completo con TODOS los datos denormalizados del backend
 * ✅ NO requiere lecturas adicionales a Firestore
 */
export interface Pedido {
  // IDs
  id: string;
  userId: string;
  recetaId: string;
  cotizacionId: string;
  farmaciaId: string;

  // Datos del Usuario (denormalizados)
  userName: string;
  userEmail?: string;
  userDNI?: string;
  userPhone?: string;
  userAddress: Address; // ✅ Dirección completa
  userObraSocial?: ObraSocial; // ✅ Obra social completa

  // Datos de la Farmacia (denormalizados)
  nombreComercial: string;
  farmEmail?: string;
  farmPhone?: string;
  farmAddress: string; // Dirección de la farmacia (string simple)
  horario?: string;

  // Datos del Pedido
  precio: number;
  descripcion?: string;
  imagenUrl?: string;
  estado: EstadoPedido;

  // Fechas
  fechaCreacion: Date;
  fechaPago: Date | null;
  fechaCierre?: Date;

  // MercadoPago
  paymentId?: string;
  paymentStatus?: string;
}

/**
 * Versión simplificada para listas de pedidos bloqueantes
 */
export interface PedidoActivoReceta {
  id: string;
  estado: EstadoPedido;
  cotizacionId: string;
  nombreComercialFarmacia: string;
  precio: number;
  fechaCreacion: Date;
  paymentId?: string;
}

// ============================================================================
// DETALLE DE PEDIDO PARA MODAL
// ============================================================================

/**
 * Estructura para mostrar en el modal de detalle
 * ✅ Se construye directamente del objeto Pedido
 */
export interface DetallePedido {
  pedido: Pedido;
  pedidoNumero: number;
  farmacia: {
    nombre: string;
    direccion: string;
    email?: string;
    telefono?: string;
    horario?: string;
  };
  usuario: {
    nombre: string;
    direccionEnvio: string;
    obraSocial: string;
  };
}


export interface PreferenciaResponse {
  paymentUrl: string; // URL a la que se debe redirigir al usuario para pagar (Checkout Pro)
  preferenceId: string;
  // Puede incluir otros campos de seguimiento si el backend los devuelve
}

// ============================================================================
// TIPOS DE COTIZACIÓN
// ============================================================================

export type EstadoCotizacion = "cotizado" | "sin_stock" | "rechazada";
export interface Cotizacion {
  id: string;
  farmaciaId: string;
  nombreComercial: string;
  direccion: string;
  email?: string;           
  telefono?: string;       
  precio: number;
  estado: EstadoCotizacion;
  fechaCreacion: Date;
  imagenUrl?: string;       // URL de la imagen de la receta
  descripcion?: string;     // Descripción de los medicamentos
}

// ============================================================================
// CONFIGURACIÓN DE ESTADOS
// ============================================================================

export interface EstadoConfig {
  icon: string;
  color: string;
  bg: string;
  label: string;
  descripcion: string;
}

export const PAYMENT_CONFIG = {
  // Estados que bloquean nueva cotización
  ESTADOS_BLOQUEANTES: ["pendiente_de_pago", "pendiente", "entregado"] as const,
  
  // Estados que permiten reintentar
  ESTADOS_FALLIDOS: ["rechazada", "abandonada"] as const,
  
  // Estados completados exitosamente
  ESTADOS_COMPLETADOS: ["pagado", "entregado"] as const,
} as const;



export interface AddressWithMetadata extends Address {
  id: string;
  alias: string;
  isDefault: boolean;
  fechaCreacion: Date; 
}


/**
 * Tipo para Receta con datos denormalizados del usuario
 */

export interface Receta {
  // IDs
  id: string;
  userId: string;

  // Datos del Usuario (denormalizados)
  userName: string;
  userEmail?: string;
  userDNI?: string;
  userPhone?: string;
  userAddress?: Address;
  userObraSocial?: ObraSocial;

  // Datos de la Imagen
  imagenUrl: string;
  imagenPath?: string;
  imagenNombre?: string;
  imagenSize?: number;

  // Estado y Metadata
  estado: "esperando_respuestas" | "farmacias_respondiendo" | "finalizada";
  cotizacionesCount: number;
  fechaCreacion: Date;
}