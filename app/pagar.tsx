import { useRouter, useLocalSearchParams } from "expo-router";
import { usePaymentLogic } from "../src/payment/hooks/usePaymentLogic";
import { PaymentView } from "../src/payment/components/PaymentView";
import { 
  navigateToSolicitudes, 
  navigateToPedidos, 
  navigateToPerfil 
} from "../src/lib/navigationHelpers";

/**
 * Pantalla Contenedora para el Flujo de Pago.
 * - Obtiene [recetaId] y [cotizacionId] de la URL.
 * - Llama al hook 'usePaymentLogic' que maneja la carga de datos y el pago.
 * - Renderiza el componente 'PaymentView' pasandole la logica y los handlers.
 */
export default function PagarScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // 1. Obtener parametros de la URL
  const recetaId = params.recetaId as string;
  const cotizacionId = params.cotizacionId as string;

  // 2. Hook de logica (maneja fetch, estado, y submit)
  const paymentLogic = usePaymentLogic(recetaId, cotizacionId, router);

  // 3. Componente de UI (solo renderiza)
  return (
    <PaymentView
      {...paymentLogic} // Pasa { isLoading, cotizacion, error, handlePayment }
      recetaId={recetaId}
      cotizacionId={cotizacionId}
      
      // Handlers de navegacion
      onGoBack={() => {
        navigateToSolicitudes(router, recetaId);
      }}
      onGoToProfile={() => {
        navigateToPerfil(router);
      }}
      onGoToPedidos={() => {
        navigateToPedidos(router);
      }}
    />
  );
}