import { doc, getDoc } from "firebase/firestore";
import { db } from "../../src/lib/firebase";
import { Pedido, DetallePedido } from "../../assets/types";
import { formatAddress, formatFullName } from "../lib/formatHelpers";

/**
 * Carga los detalles completos de un pedido desde Firestore
 */
export async function loadDetallePedido(
  pedidoId: string,
  todosPedidos: Pedido[],
  index: number
): Promise<DetallePedido> {
  const pedido = todosPedidos.find((p) => p.id === pedidoId);
  if (!pedido) {
    throw new Error("Pedido no encontrado");
  }

  // Cargar datos del usuario
  const userDocRef = doc(db, "users", pedido.userId);
  const userDoc = await getDoc(userDocRef);
  const userData = userDoc.data();

  // Cargar datos de la cotización
  const cotizacionRef = doc(
    db,
    "recetas",
    pedido.recetaId,
    "cotizaciones",
    pedido.cotizacionId
  );
  const cotizacionDoc = await getDoc(cotizacionRef);
  const cotizacionData = cotizacionDoc.data();

  // Obtener dirección de envío usando helper
  const direccionEnvio = getDireccionEnvio(pedido, userData);

  return {
    pedido,
    pedidoNumero: todosPedidos.length - index,
    farmacia: {
      nombre: cotizacionData?.nombreComercial || "Farmacia no disponible",
      direccion: cotizacionData?.direccion || "Dirección no disponible",
    },
    usuario: {
      nombre: formatFullName(userData?.firstName, userData?.lastName),
      direccionEnvio,
      obraSocial: userData?.obraSocial?.name || "Sin obra social",
    },
  };
}

/**
 * Obtiene la dirección de envío prioritizando la del pedido
 */
function getDireccionEnvio(pedido: Pedido, userData: any): string {
  // Prioridad 1: Dirección guardada en el pedido
  if (pedido.addressUser) {
    return formatAddress(pedido.addressUser);
  }

  // Prioridad 2: Dirección actual del usuario
  if (userData?.address) {
    return formatAddress(userData.address);
  }

  return "Dirección no configurada";
}