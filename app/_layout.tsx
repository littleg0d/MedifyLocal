import { useRouter, useSegments, Slot } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../src/lib/firebase";

function RootLayoutNav() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  // Escuchar cambios en el estado de autenticación de Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe; // Cleanup al desmontar
  }, []);

  // Redirección basada en estado de auth
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "auth";
    const inTabsGroup = segments[0] === "(tabs)";

    if (!user && inTabsGroup) {
      // Usuario no logueado intentando acceder a tabs -> redirect a login
      router.replace("/auth/login");
    } else if (user && inAuthGroup) {
      // Usuario logueado en pantalla de auth -> redirect a dashboard
      router.replace("/(tabs)");
    } else if (!user && segments.length === 0) {
      // Primera carga sin usuario -> ir a login
      router.replace("/auth/login");
    } else if (user && segments.length === 0) {
      // Primera carga con usuario -> ir a tabs
      router.replace("/(tabs)");
    }
  }, [user, segments, loading]);

  // Pantalla de carga mientras verifica auth
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return <RootLayoutNav />;
}