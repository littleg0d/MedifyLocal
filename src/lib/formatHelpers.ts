import { Address, ObraSocial } from "../../assets/types";

// ============================================================================
// FORMATO DE FECHAS
// ============================================================================

/**
 * Formatea una fecha en formato legible en español
 * Ejemplo: "13 de Noviembre, 2025"
 * Soporta Date de JavaScript y Timestamps de Firestore
 */
export function formatDate(date: any): string {
  if (!date) return "Fecha no disponible";
  
  // Si es un Timestamp de Firestore, convertir a Date
  let jsDate: Date;
  if (date && typeof date.toDate === 'function') {
    jsDate = date.toDate();
  } else if (date instanceof Date) {
    jsDate = date;
  } else {
    return "Fecha no disponible";
  }
  
  // Validar que sea una fecha válida
  if (isNaN(jsDate.getTime())) {
    return "Fecha no disponible";
  }

  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  return `${jsDate.getDate()} de ${meses[jsDate.getMonth()]}, ${jsDate.getFullYear()}`;
}

/**
 * Formatea una fecha con hora
 * Ejemplo: "13 de Noviembre, 2025 - 14:30"
 * Soporta Date de JavaScript y Timestamps de Firestore
 */
export function formatDateWithTime(date: any): string {
  if (!date) return "Fecha no disponible";
  
  // Si es un Timestamp de Firestore, convertir a Date
  let jsDate: Date;
  if (date && typeof date.toDate === 'function') {
    jsDate = date.toDate();
  } else if (date instanceof Date) {
    jsDate = date;
  } else {
    return "Fecha no disponible";
  }
  
  // Validar que sea una fecha válida
  if (isNaN(jsDate.getTime())) {
    return "Fecha no disponible";
  }

  const dateStr = formatDate(jsDate);
  const hours = jsDate.getHours().toString().padStart(2, "0");
  const minutes = jsDate.getMinutes().toString().padStart(2, "0");
  return `${dateStr} - ${hours}:${minutes}`;
}

/**
 * Formatea una fecha de forma relativa
 * Ejemplo: "Hace 2 días", "Hace 3 horas"
 * Soporta Date de JavaScript y Timestamps de Firestore
 */
export function formatRelativeDate(date: any): string {
  if (!date) return "Fecha no disponible";
  
  // Si es un Timestamp de Firestore, convertir a Date
  let jsDate: Date;
  if (date && typeof date.toDate === 'function') {
    jsDate = date.toDate();
  } else if (date instanceof Date) {
    jsDate = date;
  } else {
    return "Fecha no disponible";
  }
  
  // Validar que sea una fecha válida
  if (isNaN(jsDate.getTime())) {
    return "Fecha no disponible";
  }

  const now = new Date();
  const diffMs = now.getTime() - jsDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Hace un momento";
  if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? "s" : ""}`;
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? "s" : ""}`;

  return formatDate(jsDate);
}

/**
 * Formatea una fecha de forma corta
 * Ejemplo: "13/11/2025"
 * Soporta Date de JavaScript y Timestamps de Firestore
 */
export function formatDateShort(date: any): string {
  if (!date) return "Fecha no disponible";
  
  // Si es un Timestamp de Firestore, convertir a Date
  let jsDate: Date;
  if (date && typeof date.toDate === 'function') {
    jsDate = date.toDate();
  } else if (date instanceof Date) {
    jsDate = date;
  } else {
    return "Fecha no disponible";
  }
  
  // Validar que sea una fecha válida
  if (isNaN(jsDate.getTime())) {
    return "Fecha no disponible";
  }

  const day = jsDate.getDate().toString().padStart(2, "0");
  const month = (jsDate.getMonth() + 1).toString().padStart(2, "0");
  const year = jsDate.getFullYear();
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
 * ✅ Formatea una dirección completa en una línea
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
export function formatAddressShort(address: Address | null | undefined): string {
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
// FORMATO DE OBRA SOCIAL
// ============================================================================

/**
 * ✅ Formatea una obra social
 * Ejemplo: "OSDE - Nº 123456"
 */
export function formatObraSocial(obraSocial: ObraSocial | null | undefined): string {
  if (!obraSocial) return "Sin obra social";

  const nombre = obraSocial.name?.trim();
  const numero = obraSocial.number?.trim();

  if (!nombre) return "Sin obra social";
  if (!numero) return nombre;

  return `${nombre} - Nº ${numero}`;
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

// ============================================================================
// UTILIDADES
// ============================================================================

// Delay para mostrar alert después de abrir MercadoPago
export const ALERT_DELAY_MS = 1000;

/**
 * Confirma si un error es de pedido duplicado
 */
export function esPedidoDuplicado(errorMessage: string): boolean {
  return errorMessage.includes("Ya existe un pedido en proceso");
}