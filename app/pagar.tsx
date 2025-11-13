import { useRouter, useLocalSearchParams } from "expo-router";
import { usePaymentLogic } from "../src/payment/hooks/usePaymentLogic";
import { PaymentView } from "../src/payment/components/PaymentView";

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
      onGoBack={() =>
        router.push({
          pathname: "/(tabs)/solicitudes",
          params: { recetaId },
        })
      }
      onGoToProfile={() => router.push("/(tabs)/perfil")}
      onGoToPedidos={() => router.push("/(tabs)/pedidos")}
    />
  );
}