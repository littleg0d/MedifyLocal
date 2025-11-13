
// Delay para mostrar alert después de abrir MercadoPago
export const ALERT_DELAY_MS = 1000;

/**
 * Confirma si un error es de pedido duplicado
 */
export function esPedidoDuplicado(errorMessage: string): boolean {
    return errorMessage.includes("Ya existe un pedido en proceso");
  }