// src/lib/firestoreMappers.ts
import { Timestamp } from "firebase/firestore";
import { Pedido, Cotizacion, EstadoPedido, Address, ObraSocial, EstadoCotizacion } from "../../assets/types";

/**
 * Mapea un estado de Firestore al tipo EstadoPedido
 * Maneja estados válidos y devuelve "desconocido" para estados no reconocidos
 */
function mapEstadoPedido(estado: string | undefined): EstadoPedido {
  const estadosValidos: EstadoPedido[] = [
    "pagado",
    "entregado",
    "pendiente_de_pago",
    "pendiente",
    "rechazada",
    "abandonada",
  ];

  if (!estado) {
    return "desconocido";
  }

  const estadoLower = estado.toLowerCase().trim();
  const estadoEncontrado = estadosValidos.find(
    (e) => e.toLowerCase() === estadoLower
  );

  return estadoEncontrado || "desconocido";
}

/**
 * ✅ Mapea los datos de Firestore al tipo Pedido
 * INCLUYE TODOS los datos denormalizados del backend
 */
export function mapPedidoFromFirestore(id: string, data: any): Pedido {
  const estadoMapeado = mapEstadoPedido(data.estado);

  return {
    // IDs
    id,
    userId: data.userId,
    recetaId: data.recetaId,
    cotizacionId: data.cotizacionId,
    farmaciaId: data.farmaciaId,

    // Datos del Usuario (denormalizados) ✅
    userName: data.userName || "Usuario",
    userEmail: data.userEmail,
    userDNI: data.userDNI,
    userPhone: data.userPhone,
    userAddress: data.userAddress as Address, // ✅ Objeto completo
    userObraSocial: data.userObraSocial as ObraSocial | undefined, // ✅ Objeto completo

    // Datos de la Farmacia (denormalizados) ✅
    nombreComercial: data.nombreComercial || "Farmacia",
    farmEmail: data.farmEmail,
    farmPhone: data.farmPhone,
    farmAddress: data.farmAddress || "Dirección no disponible",
    horario: data.horario,

    // Datos del Pedido
    precio: data.precio || 0,
    descripcion: data.descripcion,
    imagenUrl: data.imagenUrl,
    estado: estadoMapeado,

    // Fechas
    fechaCreacion: (data.fechaCreacion as Timestamp).toDate(),
    fechaPago: data.fechaPago ? (data.fechaPago as Timestamp).toDate() : null,
    fechaCierre: data.fechaCierre ? (data.fechaCierre as Timestamp).toDate() : undefined,

    // MercadoPago
    paymentId: data.paymentId,
    paymentStatus: data.paymentStatus,
  };
}

/**
 * Mapea los datos de Firestore al tipo Cotizacion
 */
export function mapCotizacionFromFirestore(id: string, data: any): Cotizacion {
  return {
    id,
    farmaciaId: data.farmaciaId,
    nombreComercial: data.nombreComercial || "Farmacia",
    direccion: data.direccion || "Dirección no disponible",
    email: data.email,           
    telefono: data.telefono,  
    precio: data.precio || 0,
    estado: data.estado as EstadoCotizacion,
    fechaCreacion: (data.fechaCreacion as Timestamp).toDate(),
    imagenUrl: data.imagenUrl,
    descripcion: data.descripcion,
  };
}


/**
 * ✅ Mapea los datos de Firestore al tipo Receta
 * INCLUYE TODOS los datos denormalizados del usuario
 */
export function mapRecetaFromFirestore(id: string, data: any): Receta {
  return {
    // IDs
    id,
    userId: data.userId,

    // Datos del Usuario (denormalizados) ✅
    userName: data.userName || "Usuario",
    userEmail: data.userEmail,
    userDNI: data.userDNI,
    userPhone: data.userPhone,
    userAddress: data.userAddress as Address | undefined,
    userObraSocial: data.userObraSocial as ObraSocial | undefined,

    // Datos de la Imagen
    imagenUrl: data.imagenUrl,
    imagenPath: data.imagenPath,
    imagenNombre: data.imagenNombre,
    imagenSize: data.imagenSize,

    // Estado y Metadata
    estado: data.estado as "esperando_respuestas" | "farmacias_respondiendo" | "finalizada",
    cotizacionesCount: data.cotizacionesCount || 0,
    fechaCreacion: (data.fechaCreacion as Timestamp).toDate(),
  };
}