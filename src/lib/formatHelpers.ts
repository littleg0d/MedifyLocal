import { Address } from "../../assets/types";

// ============================================================================
// FORMATO DE FECHAS
// ============================================================================

/**
 * Formatea una fecha en formato legible en español
 * Ejemplo: "13 de Noviembre, 2025"
 */

export function formatDate(date: Date): string {
  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  return `${date.getDate()} de ${meses[date.getMonth()]}, ${date.getFullYear()}`;
}

/**
 * Formatea una fecha con hora
 * Ejemplo: "13 de Noviembre, 2025 - 14:30"
 */
export function formatDateWithTime(date: Date): string {
  const dateStr = formatDate(date);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${dateStr} - ${hours}:${minutes}`;
}

/**
 * Formatea una fecha de forma relativa
 * Ejemplo: "Hace 2 días", "Hace 3 horas"
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Hace un momento";
  if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? "s" : ""}`;
  if (diffHours < 24)
    return `Hace ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? "s" : ""}`;

  return formatDate(date);
}

/**
 * Formatea una fecha de forma corta
 * Ejemplo: "13/11/2025"
 */
export function formatDateShort(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// ============================================================================
// FORMATO DE MONEDA
// ============================================================================

/**
 * Formatea un número como moneda argentina
 * Ejemplo: "$1.234,56"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formatea un número como moneda sin símbolo
 * Ejemplo: "1.234,56"
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ============================================================================
// FORMATO DE DIRECCIONES
// ============================================================================

/**
 * Formatea una dirección completa en una línea
 * Ejemplo: "Av. Corrientes 1234, Buenos Aires, CABA, CP: 1043"
 */
export function formatAddress(address: Address | null | undefined): string {
  if (!address) return "Dirección no configurada";

  const parts: string[] = [];

  if (address.street?.trim()) parts.push(address.street.trim());
  if (address.city?.trim()) parts.push(address.city.trim());
  if (address.province?.trim()) parts.push(address.province.trim());

  let result = parts.join(", ");

  if (address.postalCode?.trim()) {
    result += `, CP: ${address.postalCode.trim()}`;
  }

  return result || "Dirección incompleta";
}

/**
 * Formatea una dirección en formato corto (sin CP)
 * Ejemplo: "Av. Corrientes 1234, Buenos Aires, CABA"
 */
export function formatAddressShort(
  address: Address | null | undefined
): string {
  if (!address) return "Dirección no configurada";

  const parts: string[] = [];

  if (address.street?.trim()) parts.push(address.street.trim());
  if (address.city?.trim()) parts.push(address.city.trim());
  if (address.province?.trim()) parts.push(address.province.trim());

  return parts.join(", ") || "Dirección incompleta";
}

/**
 * Valida si una dirección está completa
 */
export function isAddressValid(address: Address | null | undefined): boolean {
  if (!address) return false;
  return !!(
    address.street?.trim() &&
    address.city?.trim() &&
    address.province?.trim() &&
    address.postalCode?.trim()
  );
}

// ============================================================================
// FORMATO DE NOMBRES
// ============================================================================

/**
 * Formatea el nombre completo de una persona
 * Ejemplo: "Juan Pérez"
 */
export function formatFullName(
  firstName: string | undefined,
  lastName: string | undefined
): string {
  const name = `${firstName || ""} ${lastName || ""}`.trim();
  return name || "Usuario";
}

/**
 * Obtiene las iniciales de un nombre
 * Ejemplo: "Juan Pérez" -> "JP"
 */
export function getInitials(
  firstName: string | undefined,
  lastName: string | undefined
): string {
  const f = firstName?.trim()?.[0]?.toUpperCase() || "";
  const l = lastName?.trim()?.[0]?.toUpperCase() || "";
  return (f + l) || "U";
}

// ============================================================================
// FORMATO DE TEXTO
// ============================================================================

/**
 * Trunca un texto a una longitud máxima
 * Ejemplo: "Texto muy largo..." (max 15)
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Capitaliza la primera letra de un texto
 * Ejemplo: "hola mundo" -> "Hola mundo"
 */
export function capitalize(text: string): string {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Capitaliza cada palabra de un texto
 * Ejemplo: "hola mundo" -> "Hola Mundo"
 */
export function capitalizeWords(text: string): string {
  if (!text) return "";
  return text
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
}



// Delay para mostrar alert después de abrir MercadoPago
export const ALERT_DELAY_MS = 1000;

/**
 * Confirma si un error es de pedido duplicado
 */
export function esPedidoDuplicado(errorMessage: string): boolean {
    return errorMessage.includes("Ya existe un pedido en proceso");
  }