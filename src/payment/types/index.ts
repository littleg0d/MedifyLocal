import { Address, Cotizacion, Receta, EstadoConfig } from "../../../assets/types";

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
  pedidoExistente: any;
  errorPedido: any;
  
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
}

// Return type del hook usePaymentLogic
export interface UsePaymentLogicReturn {
  isLoading: boolean;
  procesandoPago: boolean;
  cotizacion: Cotizacion | null;
  receta: Receta | null;
  direccionUsuario: Address | null;
  pedidoExistente: any;
  errorPedido: any;
  estadoConfig: EstadoConfig | null;
  tipoBoton: TipoBoton;
  handlePagar: () => Promise<void>;
}