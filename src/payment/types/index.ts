import { Address, Cotizacion, Receta, EstadoConfig, PedidoActivoReceta } from "../../../assets/types";

// Tipo para el botón de acción
export type TipoBoton = "pagar" | "reintentar" | "procesando" | "pagado" | "bloqueado";

// Props para PaymentView
export interface PaymentViewProps {
  // Estados de carga
  isLoading: boolean;
  procesandoPago: boolean;
  
  // Datos
  cotizacion: Cotizacion | null;
  receta: Receta | null;
  direccionUsuario: Address | null;
  pedidoExistente: PedidoActivoReceta | null;
  errorPedido: Error | null;
  
  // Computed values
  estadoConfig: EstadoConfig | null;
  tipoBoton: TipoBoton;
  
  // IDs para validación
  recetaId: string;
  cotizacionId: string;
  
  // Funciones (handlers)
  handlePagar: () => void;
  onGoBack: () => void;
  onGoToProfile: () => void;
  onGoToPedidos: () => void;
  
  // Props del modal
  showModal: boolean;
  modalSuccess: boolean;
  handleCloseModal: () => void;
}

// Return type del hook usePaymentLogic
export interface UsePaymentLogicReturn {
  isLoading: boolean;
  procesandoPago: boolean;
  cotizacion: Cotizacion | null;
  receta: Receta | null;
  direccionUsuario: Address | null;
  pedidoExistente: PedidoActivoReceta | null;
  errorPedido: Error | null;
  estadoConfig: EstadoConfig | null;
  tipoBoton: TipoBoton;
  handlePagar: () => Promise<void>;
  
  // Propiedades del modal
  showModal: boolean;
  modalSuccess: boolean;
  handleCloseModal: () => void;
}