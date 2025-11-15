import { useRouter, useLocalSearchParams } from "expo-router";
import { usePaymentLogic } from "../src/payment/hooks/usePaymentLogic";
import { PaymentView } from "../src/payment/components/PaymentView";
import { navigateToSolicitudes, navigateToPedidos, navigateToPerfil } from "../src/lib/navigationHelpers";

export default function PagarScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const recetaId = params.recetaId as string;
  const cotizacionId = params.cotizacionId as string;

  // logica viene del hook
  const paymentLogic = usePaymentLogic(recetaId, cotizacionId, router);

  // uiviene del componente
  return (
    <PaymentView
      {...paymentLogic}
      recetaId={recetaId}
      cotizacionId={cotizacionId}
      onGoBack={() => navigateToSolicitudes(router, recetaId)}
      
      onGoToProfile={() => navigateToPerfil(router)}
      onGoToPedidos={() => navigateToPedidos(router)}
    />
  );
}