// src/solicitudes/components.tsx
import { View, Text, Pressable, Modal, ScrollView, Linking, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { globalStyles, colors } from "../../assets/styles";
import { Cotizacion, Farmacia } from "../../assets/types";

// Helpers centralizados
import { 
  getEstadoCotizacionConfig, 
  getEstadoPedidoConfig,
  esPedidoCompletado 
} from "../lib/estadosHelpers";
import { formatCurrency, formatDate } from "../lib/formatHelpers";

// ============================================================================
// BANNER BLOQUEO
// ============================================================================

interface BannerBloqueoProps {
  pedido: any;
  onVerEstado: () => void;
}

export function BannerBloqueo({ pedido, onVerEstado }: BannerBloqueoProps) {
  const config = getEstadoPedidoConfig(pedido.estado);
  const esPagado = esPedidoCompletado(pedido.estado);

  return (
    <View style={[styles.banner, { backgroundColor: config.bg }]}>
      <View style={styles.bannerHeader}>
        <Ionicons name={config.icon as any} size={28} color={config.color} />
        <View style={styles.bannerInfo}>
          <Text style={[styles.bannerTitulo, { color: config.color }]}>
            {config.label}
          </Text>
          <Text style={[styles.bannerSubtitulo, { color: config.color }]}>
            {esPagado
              ? `Ya compraste en ${pedido.nombreComercialFarmacia}`
              : `Farmacia: ${pedido.nombreComercialFarmacia}`}
          </Text>
        </View>
      </View>

      <Pressable style={styles.bannerBoton} onPress={onVerEstado}>
        <Text style={[styles.bannerBotonTexto, { color: config.color }]}>
          {esPagado ? "Ver en Mis Pedidos" : "Ver Estado del Pago"}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={config.color} />
      </Pressable>
    </View>
  );
}

// ============================================================================
// TARJETA COTIZACIÓN
// ============================================================================

interface TarjetaCotizacionProps {
  cotizacion: Cotizacion;
  bloqueada: boolean;
  esActiva: boolean;
  onPagar: () => void;
  onVerDetalles: () => void;
}

export function TarjetaCotizacion({
  cotizacion,
  bloqueada,
  esActiva,
  onPagar,
  onVerDetalles,
}: TarjetaCotizacionProps) {
  const badge = getEstadoCotizacionConfig(cotizacion.estado);
  const tienePrecio = cotizacion.estado === "cotizado";

  return (
    <View style={globalStyles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardNombre}>{cotizacion.nombreComercial}</Text>
          <Text style={styles.cardDireccion}>{cotizacion.direccion}</Text>
        </View>
        <Pressable onPress={onVerDetalles} style={styles.detallesButton}>
          <Ionicons name="information-circle-outline" size={28} color={colors.primary} />
        </Pressable>
      </View>

      {esActiva && bloqueada && (
        <View style={styles.badgeActiva}>
          <Ionicons name="radio-button-on" size={16} color={colors.primary} />
          <Text style={styles.badgeActivaTexto}>Pedido en curso</Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        {tienePrecio ? (
          <>
            <View style={[globalStyles.badgePill, { backgroundColor: badge.bg, flex: 1 }]}>
              <Text style={[globalStyles.badgeTextMedium, { color: badge.text }]}>
                Disponible: {formatCurrency(cotizacion.precio || 0)}
              </Text>
            </View>

            {bloqueada ? (
              <View style={[styles.botonPagar, styles.botonBloqueado]}>
                <Ionicons name="lock-closed" size={16} color={colors.surface} />
                <Text style={styles.botonPagarTexto}>Bloqueado</Text>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  styles.botonPagar,
                  pressed && globalStyles.buttonPressed,
                ]}
                onPress={onPagar}
              >
                <Text style={styles.botonPagarTexto}>Pagar</Text>
              </Pressable>
            )}
          </>
        ) : (
          <View
            style={[
              globalStyles.badgePill,
              styles.badgeCompleto,
              { backgroundColor: badge.bg },
            ]}
          >
            <Text style={[globalStyles.badgeTextMedium, { color: badge.text }]}>
              {badge.label}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ============================================================================
// DETALLE COTIZACIÓN (NUEVO) ✅
// ============================================================================

interface DetalleCotizacionProps {
  visible: boolean;
  cotizacion: Cotizacion | null;
  onClose: () => void;
  onPagar?: () => void;
  bloqueada?: boolean;
}

export function DetalleCotizacion({ 
  visible, 
  cotizacion, 
  onClose,
  onPagar,
  bloqueada = false
}: DetalleCotizacionProps) {
  if (!cotizacion) return null;

  const badge = getEstadoCotizacionConfig(cotizacion.estado);
  const tienePrecio = cotizacion.estado === "cotizado";

  const handleLlamar = () => {
    if (cotizacion.telefono) {
      Linking.openURL(`tel:${cotizacion.telefono}`);
    }
  };

  const handleEmail = () => {
    if (cotizacion.email) {
      Linking.openURL(`mailto:${cotizacion.email}`);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={globalStyles.modalOverlay}>
        <View style={styles.modalContentLarge}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={globalStyles.modalTitle}>Detalle de Cotización</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Imagen de la receta (si existe) */}
            {cotizacion.imagenUrl && (
              <View style={styles.imagenRecetaContainer}>
                <Text style={styles.seccionTitulo}>Receta</Text>
                <Image
                  source={{ uri: cotizacion.imagenUrl }}
                  style={styles.imagenReceta}
                  resizeMode="contain"
                />
              </View>
            )}

            {/* Estado y Precio */}
            <View style={styles.precioSection}>
              <View style={[
                globalStyles.badge,
                { backgroundColor: badge.bg, alignSelf: 'flex-start' }
              ]}>
                <Text style={[globalStyles.badgeText, { color: badge.text }]}>
                  {badge.label}
                </Text>
              </View>

              {tienePrecio && (
                <View style={styles.precioContainer}>
                  <Text style={styles.precioLabel}>Precio Total</Text>
                  <Text style={styles.precioValor}>
                    {formatCurrency(cotizacion.precio)}
                  </Text>
                </View>
              )}
            </View>

            {/* Descripción de Medicamentos */}
            {cotizacion.descripcion && (
              <View style={styles.descripcionSection}>
                <SeccionDetalle icon="medical" label="Descripción">
                  <Text style={styles.valorDetalle}>{cotizacion.descripcion}</Text>
                </SeccionDetalle>
              </View>
            )}

            {/* Datos de la Farmacia */}
            <View style={styles.farmaciaSection}>
              <Text style={styles.seccionTitulo}>Información de la Farmacia</Text>

              <SeccionDetalle icon="storefront" label="Nombre">
                <Text style={styles.valorDetalle}>{cotizacion.nombreComercial}</Text>
              </SeccionDetalle>

              <SeccionDetalle icon="location" label="Dirección">
                <Text style={styles.valorDetalle}>{cotizacion.direccion}</Text>
              </SeccionDetalle>

              {cotizacion.telefono && (
                <Pressable onPress={handleLlamar}>
                  <SeccionDetalle icon="call" label="Teléfono">
                    <Text style={[styles.valorDetalle, styles.link]}>
                      {cotizacion.telefono}
                    </Text>
                  </SeccionDetalle>
                </Pressable>
              )}

              {cotizacion.email && (
                <Pressable onPress={handleEmail}>
                  <SeccionDetalle icon="mail" label="Email">
                    <Text style={[styles.valorDetalle, styles.link]}>
                      {cotizacion.email}
                    </Text>
                  </SeccionDetalle>
                </Pressable>
              )}

              <SeccionDetalle icon="calendar" label="Fecha de cotización">
                <Text style={styles.valorDetalle}>
                  {formatDate(cotizacion.fechaCreacion)}
                </Text>
              </SeccionDetalle>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer con botones */}
          <View style={styles.modalFooterButtons}>
            {tienePrecio && onPagar && !bloqueada && (
              <Pressable
                style={({ pressed }) => [
                  styles.botonPagarModal,
                  pressed && globalStyles.buttonPressed,
                ]}
                onPress={() => {
                  onClose();
                  onPagar();
                }}
              >
                <Text style={styles.botonPagarTexto}>Pagar ahora</Text>
              </Pressable>
            )}

            {bloqueada && (
              <View style={[styles.botonPagarModal, styles.botonBloqueado]}>
                <Ionicons name="lock-closed" size={16} color={colors.surface} />
                <Text style={styles.botonPagarTexto}>Bloqueado</Text>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.botonCerrar,
                pressed && { opacity: 0.7 },
              ]}
              onPress={onClose}
            >
              <Text style={styles.botonCerrarTexto}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================================
// DETALLE FARMACIA (Mantener para compatibilidad)
// ============================================================================

interface DetalleFarmaciaProps {
  visible: boolean;
  farmacia: Farmacia | null;
  onClose: () => void;
}

export function DetalleFarmacia({ visible, farmacia, onClose }: DetalleFarmaciaProps) {
  if (!farmacia) return null;

  const handleLlamar = () => {
    if (farmacia.telefono) {
      Linking.openURL(`tel:${farmacia.telefono}`);
    }
  };

  const handleEmail = () => {
    if (farmacia.email) {
      Linking.openURL(`mailto:${farmacia.email}`);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={globalStyles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={globalStyles.modalTitle}>Detalles de Farmacia</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody}>
            <SeccionDetalle icon="storefront" label="Nombre">
              <Text style={styles.valorDetalle}>{farmacia.nombreComercial}</Text>
            </SeccionDetalle>

            <SeccionDetalle icon="location" label="Dirección">
              <Text style={styles.valorDetalle}>{farmacia.direccion}</Text>
            </SeccionDetalle>

            {farmacia.telefono && (
              <Pressable onPress={handleLlamar}>
                <SeccionDetalle icon="call" label="Teléfono">
                  <Text style={[styles.valorDetalle, styles.link]}>
                    {farmacia.telefono}
                  </Text>
                </SeccionDetalle>
              </Pressable>
            )}

            {farmacia.email && (
              <Pressable onPress={handleEmail}>
                <SeccionDetalle icon="mail" label="Email">
                  <Text style={[styles.valorDetalle, styles.link]}>
                    {farmacia.email}
                  </Text>
                </SeccionDetalle>
              </Pressable>
            )}

            {farmacia.horario && (
              <SeccionDetalle icon="time" label="Horario">
                <Text style={styles.valorDetalle}>{farmacia.horario}</Text>
              </SeccionDetalle>
            )}
          </ScrollView>

          <Pressable
            style={({ pressed }) => [
              globalStyles.primaryButton,
              styles.modalFooter,
              pressed && globalStyles.buttonPressed,
            ]}
            onPress={onClose}
          >
            <Text style={globalStyles.primaryButtonText}>Cerrar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================================
// SECCIÓN DETALLE (Componente reutilizable)
// ============================================================================

interface SeccionDetalleProps {
  icon: string;
  label: string;
  children: React.ReactNode;
}

function SeccionDetalle({ icon, label, children }: SeccionDetalleProps) {
  return (
    <View style={styles.seccionDetalle}>
      <Ionicons name={icon as any} size={24} color={colors.primary} />
      <View style={styles.textoSeccion}>
        <Text style={styles.etiquetaDetalle}>{label}</Text>
        {children}
      </View>
    </View>
  );
}

// ============================================================================
// ESTILOS 
// ============================================================================

const styles = StyleSheet.create({
  // BannerBloqueo
  banner: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    gap: 12,
  },
  bannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bannerInfo: {
    flex: 1,
    gap: 4,
  },
  bannerTitulo: {
    fontSize: 18,
    fontWeight: "700",
  },
  bannerSubtitulo: {
    fontSize: 14,
    fontWeight: "500",
  },
  bannerBoton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 8,
  },
  bannerBotonTexto: {
    fontSize: 15,
    fontWeight: "600",
  },

  // TarjetaCotizacion
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardNombre: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  cardDireccion: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  detallesButton: {
    padding: 4,
  },
  badgeActiva: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primaryLight,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  badgeActivaTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  badgeCompleto: {
    alignItems: "center",
    flex: 1,
  },
  botonPagar: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  botonPagarTexto: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "700",
  },
  botonBloqueado: {
    backgroundColor: colors.textSecondary,
    opacity: 0.7,
  },

  // DetalleCotizacion (NUEVO)
  modalContentLarge: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: "90%",
  },
  imagenRecetaContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  imagenReceta: {
    width: "100%",
    height: 250,
    backgroundColor: colors.gray100,
    borderRadius: 12,
    marginTop: 12,
  },
  precioSection: {
    padding: 20,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  precioContainer: {
    backgroundColor: colors.primaryLight,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  precioLabel: {
    fontSize: 14,
    color: colors.surface,
    fontWeight: "600",
    marginBottom: 4,
  },
  precioValor: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.surface,
  },
  descripcionSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  farmaciaSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  seccionTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 16,
  },
  modalFooterButtons: {
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  botonPagarModal: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  botonCerrar: {
    paddingVertical: 12,
    alignItems: "center",
  },
  botonCerrarTexto: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
  },

  // DetalleFarmacia (mantener)
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  seccionDetalle: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  textoSeccion: {
    flex: 1,
    gap: 4,
  },
  etiquetaDetalle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  valorDetalle: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  link: {
    color: colors.primary,
    textDecorationLine: "underline",
  },
  modalFooter: {
    marginHorizontal: 20,
    marginVertical: 20,
  },
});