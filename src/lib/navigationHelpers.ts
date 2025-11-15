import { Router } from "expo-router";

/**
 * Helpers de navegación para rutas comunes
 * Evita duplicar strings de rutas y parámetros
 */

// ============================================================================
// NAVEGACIÓN DE TABS
// ============================================================================

export const navigateToRecetas = (router: Router) => {
  router.push("/(tabs)/recetas");
};

export const navigateToPedidos = (router: Router) => {
  router.push("/(tabs)/pedidos");
};

export const navigateToPerfil = (router: Router) => {
  router.push("/(tabs)/perfil");
};

export const navigateToHome = (router: Router) => {
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
  router.push({
    pathname: "/pagar",
    params: { recetaId, cotizacionId },
  });
};

export const navigateToSolicitudes = (router: Router, recetaId: string) => {
  router.push({
    pathname: "/solicitudes",
    params: { recetaId },
  });
};

export const navigateToCargarReceta = (router: Router) => {
  router.push("/cargarReceta");
};

// ============================================================================
// NAVEGACIÓN CON REEMPLAZO
// ============================================================================

export const replaceWithLogin = (router: Router) => {
  router.replace("../auth/login");
};

export const replaceWithHome = (router: Router) => {
  router.replace("/(tabs)");
};