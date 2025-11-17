import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../src/lib/firebase";
import { colors } from "../../assets/styles";

/**
 * Layout de Proteccion (Auth Guard) para el grupo /farmacia
 * Verifica que el usuario este autenticado Y tenga el rol 'farmacia'
 * Si no, redirige a donde corresponda.
 */
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

      // Hay usuario, verificar su rol
      try {
        
        // 1. Verificar si es una farmacia (coleccion 'farmacias')
        const farmaciaRef = doc(db, "farmacias", user.uid);
        const farmaciaSnap = await getDoc(farmaciaRef); // ✅ Firebase Interaction

        if (farmaciaSnap.exists()) {
          const farmaciaData = farmaciaSnap.data();
          if (farmaciaData.role === "farmacia") {
            // Usuario valido con rol de farmacia
            setIsChecking(false); // <-- Permite mostrar el Stack
            return;
          }
        }

        // 2. Si no es farmacia, verificar en 'users' (paciente o admin)
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef); // ✅ Firebase Interaction

        if (userSnap.exists()) {
          const userData = userSnap.data();
          
          // Redirigir segun el rol
          if (userData.role === "admin") {
            router.replace("/admin");
          } else {
            router.replace("/(tabs)");
          }
        } else {
          // No existe en 'farmacias' ni en 'users' (raro, pero posible)
          router.replace("/(tabs)");
        }
      } catch (error) {
        console.log( " ❌❌❌ Error verificando rol:", error); // ✅ General Error
        router.replace("/auth/login");
      }
    });

    // Cleanup del listener
    return () => {
      unsubscribe();
    };
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