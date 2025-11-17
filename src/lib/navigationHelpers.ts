import { Router } from "expo-router";

/**
 * Helpers de navegación para rutas comunes
 * Evita duplicar strings de rutas y parámetros
 */

// ============================================================================
// NAVEGACIÓN DE TABS
// ============================================================================

export const navigateToRecetas = (router: Router) => {
  console.log("📍 Navegando a: /(tabs)/recetas");
  router.push("/(tabs)/recetas");
};

export const navigateToPedidos = (router: Router) => {
  console.log("📍 Navegando a: /(tabs)/pedidos");
  router.push("/(tabs)/pedidos");
};

export const navigateToPerfil = (router: Router) => {
  console.log("📍 Navegando a: /(tabs)/perfil");
  router.push("/(tabs)/perfil");
};

export const navigateToHome = (router: Router) => {
  console.log("📍 Navegando a: /(tabs)");
  router.push("/(tabs)");
};

// ============================================================================
// NAVEGACIÓN CON PARÁMETROS
// ============================================================================

export const navigateToPagar = (
  router: Router,
  recetaId: string,
  cotizacionId: string
) => {
  console.log("📍 Navegando a: /pagar", { recetaId, cotizacionId });
  router.push({
    pathname: "/pagar",
    params: { recetaId, cotizacionId },
  });
};

export const navigateToSolicitudes = (router: Router, recetaId: string) => {
  console.log("📍 Navegando a: /solicitudes", { recetaId });
  router.push({
    pathname: "/solicitudes",
    params: { recetaId },
  });
};

export const navigateToCargarReceta = (router: Router) => {
  console.log("📍 Navegando a: /(tabs)/cargarReceta");
  try {
    router.push("/cargarReceta");
    console.log("✅ Navegación iniciada correctamente");
  } catch (error) {
    console.error("❌ Error en navegación:", error);
  }
};

// ============================================================================
// NAVEGACIÓN CON REEMPLAZO
// ============================================================================

export const replaceWithLogin = (router: Router) => {
  console.log("📍 Reemplazando con: /(auth)/login");
  router.replace("/auth/login");
};

export const replaceWithHome = (router: Router) => {
  console.log("📍 Reemplazando con: /(tabs)");
  router.replace("/(tabs)");
};