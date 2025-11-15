// app/farmacia/_layout.tsx
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../src/lib/firebase";
import { colors } from "../../assets/styles";

export default function FarmaciaLayout() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // No hay usuario, redirigir a login
        router.replace("/auth/login");
        return;
      }

      try {
        // Verificar si el usuario tiene rol de farmacia
        const farmaciaRef = doc(db, "farmacias", user.uid);
        const farmaciaSnap = await getDoc(farmaciaRef);

        if (farmaciaSnap.exists()) {
          const farmaciaData = farmaciaSnap.data();
          if (farmaciaData.role === "farmacia") {
            // Usuario válido con rol de farmacia
            setIsChecking(false);
            return;
          }
        }

        // Si no es farmacia, verificar en users por si acaso
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          
          // Redirigir según el rol
          if (userData.role === "admin") {
            router.replace("/admin");
          } else {
            router.replace("/(tabs)");
          }
        } else {
          // No tiene rol de farmacia, redirigir a tabs
          router.replace("/(tabs)");
        }
      } catch (error) {
        console.error("Error verificando rol:", error);
        router.replace("/auth/login");
      }
    });

    return () => unsubscribe();
  }, []);

  if (isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}