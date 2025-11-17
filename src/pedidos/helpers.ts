import { Pedido, DetallePedido } from "../../assets/types";
import { formatAddress, formatObraSocial } from "../lib/formatHelpers";

/**
 * Transforma un objeto Pedido al formato DetallePedido.
 * Es síncrona y no realiza lecturas a la DB.
 */
export function loadDetallePedido(
  pedidoId: string,
  todosPedidos: Pedido[],
  index: number
): DetallePedido {
  const pedido = todosPedidos.find((p) => p.id === pedidoId);
  if (!pedido) {
    throw new Error("Pedido no encontrado");
  }

  // Los datos ya están denormalizados en el objeto Pedido

  // Dirección de envío
  const direccionEnvio = pedido.userAddress
    ? formatAddress(pedido.userAddress)
    : "Dirección no disponible";

  // Obra social
  const obraSocial = pedido.userObraSocial
    ? formatObraSocial(pedido.userObraSocial)
    : "Sin obra social";

  // Nombre del usuario
  const nombreUsuario = pedido.userName || "Usuario no disponible";

  // Retornar el detalle completo
  return {
    pedido,
    pedidoNumero: todosPedidos.length - index,
    farmacia: {
      nombre: pedido.nombreComercial || "Farmacia no disponible",
      direccion: pedido.farmAddress || "Dirección no disponible",
      email: pedido.farmEmail,
      telefono: pedido.farmPhone,
      horario: pedido.horario,
    },
    usuario: {
      nombre: nombreUsuario,
      direccionEnvio,
      obraSocial,
    },
  };
}