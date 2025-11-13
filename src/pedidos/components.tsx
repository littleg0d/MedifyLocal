import { View, Text, Modal, Pressable, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { globalStyles, colors } from "../../assets/styles";
import { Pedido, DetallePedido } from "../../assets/types";

// Helpers centralizados
import { getEstadoPedidoBadge, puedeReintentarPago } from "../lib/estadosHelpers";
import { formatDate, formatCurrency } from "../lib/formatHelpers";

// ============================================================================
// EMPTY STATE
// ============================================================================

export function EmptyState() {
  return (
    <View style={globalStyles.emptyContainer}>
      <Ionicons name="cube-outline" size={64} color={colors.textMutedDark} />
      <Text style={globalStyles.emptyTitle}>Sin pedidos aún</Text>
      <Text style={globalStyles.emptyText}>
        Cuando realices tu primer pedido, aparecerá aquí
      </Text>
    </View>
  );
}

// ============================================================================
// PEDIDO CARD
// ============================================================================

interface PedidoCardProps {
  pedido: Pedido;
  pedidoNumero: number;
  onPress: () => void;
  onReintentarPago: (recetaId: string, cotizacionId: string) => void;
}

export function PedidoCard({ 
  pedido, 
  pedidoNumero, 
  onPress, 
  onReintentarPago 
}: PedidoCardProps) {
  const badge = getEstadoPedidoBadge(pedido.estado);
  const puedeReintentar = puedeReintentarPago(pedido.estado);

  return (
    <View style={globalStyles.cardSimple}>
      <Pressable
        style={({ pressed }) => [
          styles.cardContent,
          pressed && globalStyles.cardPressed,
        ]}
        onPress={onPress}
      >
        <View style={styles.cardInfo}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderInfo}>
              <Text style={styles.pedidoTitle}>Pedido #{pedidoNumero}</Text>
              <Text style={styles.pedidoDate}>
                {formatDate(pedido.fechaCreacion)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textTertiary} />
          </View>

          <View style={styles.cardBody}>
            <View style={[globalStyles.badge, { backgroundColor: badge.bg }]}>
              <Ionicons
                name={badge.icon as any}
                size={14}
                color={badge.color}
                style={styles.badgeIcon}
              />
              <Text style={[globalStyles.badgeText, { color: badge.color }]}>
                {badge.label}
              </Text>
            </View>
            <Text style={styles.precio}>{formatCurrency(pedido.precio)}</Text>
          </View>
        </View>
      </Pressable>

      {puedeReintentar && (
        <Pressable
          style={({ pressed }) => [
            styles.retryButton,
            pressed && globalStyles.buttonPressed,
          ]}
          onPress={() => onReintentarPago(pedido.recetaId, pedido.cotizacionId)}
        >
          <Ionicons name="refresh" size={16} color={colors.primary} />
          <Text style={styles.retryButtonText}>Reintentar pago</Text>
        </Pressable>
      )}
    </View>
  );
}

// ============================================================================
// DETALLE MODAL
// ============================================================================

interface DetalleModalProps {
  visible: boolean;
  detalle: DetallePedido | null;
  onClose: () => void;
  onReintentarPago: (recetaId: string, cotizacionId: string) => void;
}

export function DetalleModal({ 
  visible, 
  detalle, 
  onClose, 
  onReintentarPago 
}: DetalleModalProps) {
  if (!detalle) return null;

  const badge = getEstadoPedidoBadge(detalle.pedido.estado);
  const puedeReintentar = puedeReintentarPago(detalle.pedido.estado);

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
            <Text style={globalStyles.modalTitle}>Pedido #{detalle.pedidoNumero}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody}>
            <InfoSection icon={badge.icon as any} iconColor={badge.color} title="Estado">
              <Text style={styles.infoText}>{badge.label}</Text>
            </InfoSection>

            <InfoSection icon="medical-outline" title="Medicamento">
              <Text style={[styles.infoText, styles.infoTextFlex]}>
                {detalle.farmacia.nombre}
              </Text>
            </InfoSection>

            <InfoSection icon="person-outline" title="Datos del cliente">
              <Text style={styles.infoText}>{detalle.usuario.nombre}</Text>
            </InfoSection>

            <InfoSection icon="location-outline" title="Dirección de envío">
              <Text style={styles.infoText}>{detalle.usuario.direccionEnvio}</Text>
            </InfoSection>

            <InfoSection icon="medkit-outline" title="Obra Social">
              <Text style={styles.infoText}>{detalle.usuario.obraSocial}</Text>
            </InfoSection>

            <InfoSection icon="calendar-outline" title="Fecha de creación">
              <Text style={styles.infoText}>
                {formatDate(detalle.pedido.fechaCreacion)}
              </Text>
            </InfoSection>

            {detalle.pedido.fechaPago && (
              <InfoSection icon="card-outline" title="Fecha de pago">
                <Text style={styles.infoText}>
                  {formatDate(detalle.pedido.fechaPago)}
                </Text>
              </InfoSection>
            )}

            {detalle.pedido.paymentId && (
              <InfoSection icon="receipt-outline" title="ID de pago">
                <Text style={styles.infoText}>{detalle.pedido.paymentId}</Text>
              </InfoSection>
            )}

            <View style={styles.priceSection}>
              <Text style={styles.priceSectionTitle}>Total</Text>
              <Text style={styles.price}>{formatCurrency(detalle.pedido.precio)}</Text>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            {puedeReintentar && (
              <Pressable
                style={({ pressed }) => [
                  globalStyles.primaryButton,
                  pressed && globalStyles.buttonPressed,
                ]}
                onPress={() => {
                  onClose();
                  onReintentarPago(detalle.pedido.recetaId, detalle.pedido.cotizacionId);
                }}
              >
                <Ionicons name="refresh" size={20} color={colors.surface} />
                <Text style={globalStyles.primaryButtonText}>Reintentar pago</Text>
              </Pressable>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.closeButtonFooter,
                pressed && globalStyles.buttonPressed,
              ]}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================================
// INFO SECTION (Componente reutilizable)
// ============================================================================

interface InfoSectionProps {
  icon: string;
  iconColor?: string;
  title: string;
  children: React.ReactNode;
}

function InfoSection({ 
  icon, 
  iconColor = colors.primary, 
  title, 
  children 
}: InfoSectionProps) {
  return (
    <View style={globalStyles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.infoContainer}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
        {children}
      </View>
    </View>
  );
}

// ============================================================================
// ESTILOS 
// ============================================================================

const styles = StyleSheet.create({
  // PedidoCard
  cardContent: {
    padding: 16,
  },
  cardInfo: {
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardHeaderInfo: {
    flex: 1,
  },
  pedidoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  pedidoDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  cardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgeIcon: {
    marginRight: 4,
  },
  precio: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },

  // DetalleModal
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
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textTertiary,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  infoTextFlex: {
    flex: 1,
  },
  priceSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    padding: 16,
    borderRadius: 12,
  },
  priceSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textTertiary,
    textTransform: "uppercase",
  },
  price: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.primary,
  },
  modalFooter: {
    padding: 20,
    gap: 12,
  },
  closeButtonFooter: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
});