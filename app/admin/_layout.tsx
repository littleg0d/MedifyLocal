import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { View, Text, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { auth, db } from "../../src/lib/firebase"; 
import { doc, getDoc } from "firebase/firestore"; 
export default function AdminLayout() {
  const router = useRouter();
  
  const [loadingRole, setLoadingRole] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  // Lógica para obtener el rol del usuario actual
  useEffect(() => {
    const user = auth.currentUser;
    setLoadingRole(true);

    if (!user) {
      setLoadingRole(false);
      setRole(null); // No hay usuario
      return;
    }

    const fetchRole = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setRole(userSnap.data().role || "patient");
        } else {
          // Si no está en users, asumir un rol por defecto o no permitido
          setRole("unknown"); 
        }
      } catch (e) {
        console.error("Error al cargar rol:", e);
        setRole("error");
      } finally {
        setLoadingRole(false);
      }
    };

    fetchRole();
  }, []);

  // Lógica de Redirección
  useEffect(() => {
    if (loadingRole) return;

    if (!auth.currentUser) {
      // 1. Si no hay usuario -> a Login
      router.replace("/auth/login");
    } else if (role !== "admin") {
      // 2. Si el usuario existe pero no es admin -> a Home de usuarios
      router.replace("/(tabs)");
    }
    // Si role === 'admin', no hacemos nada y permitimos que se cargue el Stack
  }, [loadingRole, role]);
  
  // Pantalla de carga mientras se verifica el rol
  if (loadingRole) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
          <Text>Verificando permisos de administración...</Text>
        </View>
      );
  }

  // Renderiza el stack solo si el rol es 'admin'
  if (role === 'admin') {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
          <StatusBar style="dark" />
          <View style={{ flex: 1, padding: 16 }}>
            <Stack screenOptions={{ headerShown: false }} />
          </View>
        </SafeAreaView>
      );
  }
  
  // No renderiza nada si la validación falla antes de la redirección
  return null;
}