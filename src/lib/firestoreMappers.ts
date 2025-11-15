// src/lib/firestoreMappers.ts
import { Timestamp } from "firebase/firestore";
import { Pedido, Cotizacion, EstadoPedido } from "../../assets/types";

/**
 * Mapea los datos de Firestore al tipo Pedido
 */
export function mapPedidoFromFirestore(id: string, data: any): Pedido {
  return {
    id,
    userId: data.userId,
    recetaId: data.recetaId,
    cotizacionId: data.cotizacionId,
    farmaciaId: data.farmaciaId,
    precio: data.precio,
    estado: data.estado as EstadoPedido,
    fechaCreacion: (data.fechaCreacion as Timestamp).toDate(),
    fechaPago: data.fechaPago ? (data.fechaPago as Timestamp).toDate() : null,
    fechaCierre: data.fechaCierre ? (data.fechaCierre as Timestamp).toDate() : undefined,
    paymentId: data.paymentId,
    paymentStatus: data.paymentStatus,
    nombreComercial: data.nombreComercial,
    addressUser: data.addressUser,
    imagenUrl: data.imagenUrl,
  };
}

/**
 * Mapea los datos de Firestore al tipo Cotizacion
 */
export function mapCotizacionFromFirestore(id: string, data: any): Cotizacion {
  return {
    id,
    farmaciaId: data.farmaciaId,
    nombreComercial: data.nombreComercial,
    direccion: data.direccion,
    precio: data.precio,
    estado: data.estado,
    fechaCreacion: (data.fechaCreacion as Timestamp).toDate(),
    imagenUrl: data.imagenUrl,
  };
}

/**
 * Mapea los datos de Firestore al tipo Receta
 */
export function mapRecetaFromFirestore(id: string, data: any) {
  return {
    id,
    userId: data.userId,
    imagenUrl: data.imagenUrl,
    fechaCreacion: (data.fechaCreacion as Timestamp).toDate(),
    estado: data.estado,
    cotizacionesCount: data.cotizacionesCount || 0,
  };
}