import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { globalStyles, colors } from "../../assets/styles";
import { auth, db } from "../../src/lib/firebase";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";

interface CotizacionDetalle {
  nombreComercial: string;
  precio: number;
  farmaciaId: string;
}

export default function Pagar() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const recetaId = params.recetaId as string;
  const cotizacionId = params.cotizacionId as string;

  const [cotizacion, setCotizacion] = useState<CotizacionDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    if (recetaId && cotizacionId) {
      loadCotizacion();
    }
  }, [recetaId, cotizacionId]);

  const loadCotizacion = async () => {
    try {
      setLoading(true);

      const cotizacionRef = doc(db, "recetas", recetaId, "cotizaciones", cotizacionId);
      const cotizacionDoc = await getDoc(cotizacionRef);

      if (cotizacionDoc.exists()) {
        const data = cotizacionDoc.data();
        setCotizacion({
          nombreComercial: data.nombreComercial,
          precio: data.precio,
          farmaciaId: data.farmaciaId,
        });
      } else {
        Alert.alert("Error", "No se encontró la cotización.");
        router.back();
      }
    } catch (error) {
      console.error("Error al cargar cotización:", error);
      Alert.alert("Error", "No pudimos cargar los datos.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handlePagar = async () => {
    try {
      setProcesando(true);
      const user = auth.currentUser;

      if (!user) {
        Alert.alert("Error", "Debes iniciar sesión para continuar.");
        return;
      }

      // TODO: Aquí integras con Mercado Pago SDK
      // Por ahora, creamos el pedido directamente
      
      // Crear el pedido en Firestore
      const pedidoData = {
        userId: user.uid,
        recetaId: recetaId,
        cotizacionId: cotizacionId,
        farmaciaId: cotizacion?.farmaciaId,
        precio: cotizacion?.precio,
        estado: "pagado",
        fechaCreacion: new Date(),
        fechaPago: new Date(),
      };

      await addDoc(collection(db, "pedidos"), pedidoData);

      // Mostrar éxito
      Alert.alert(
        "¡Pago exitoso!",
        "Tu pedido ha sido confirmado. Pronto recibirás novedades.",
        [
          {
            text: "Ver mis pedidos",
            onPress: () => router.push("/(tabs)/pedidos"),
          },
        ]
      );

      // TODO: Aquí abrirías Mercado Pago
      // const mercadoPagoUrl = "https://www.mercadopago.com/checkout/...";
      // await Linking.openURL(mercadoPagoUrl);

    } catch (error) {
      console.error("Error al procesar pago:", error);
      Alert.alert("Error", "No pudimos procesar el pago. Intenta nuevamente.");
    } finally {
      setProcesando(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={globalStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={globalStyles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[globalStyles.container, styles.container]}>
      {/* Header */}
      <View style={globalStyles.headerWithBorder}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={globalStyles.titleSmall}>{cotizacion?.nombreComercial}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Contenido centrado */}
      <View style={styles.content}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Total a pagar</Text>
          <Text style={styles.priceAmount}>${cotizacion?.precio.toFixed(2)}</Text>
        </View>
      </View>

      {/* Footer con botones */}
      <View style={styles.footer}>
        <View style={styles.securityNote}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} />
          <Text style={styles.securityText}>
            Serás redirigido a Mercado Pago para completar tu compra de forma segura.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && globalStyles.buttonPressed,
              procesando && globalStyles.buttonDisabled,
            ]}
            onPress={handlePagar}
            disabled={procesando}
          >
            <Text style={styles.primaryButtonText}>
              {procesando ? "Procesando..." : "Continuar a Mercado Pago"}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => router.back()}
            disabled={procesando}
          >
            <Text style={styles.secondaryButtonText}>Volver</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  priceContainer: {
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  priceAmount: {
    fontSize: 72,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -2,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 16,
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
  },
  securityText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    flex: 1,
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#007AFF", // Azul de Mercado Pago
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.surface,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
});