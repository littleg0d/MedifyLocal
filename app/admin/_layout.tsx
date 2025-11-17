import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { View, Text, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { auth, db } from "../../src/lib/firebase"; 
import { doc, getDoc } from "firebase/firestore"; 

/**
 * Auth Guard para el /admin group.
 * 1. Verifica si hay usuario.
 * 2. Verifica si el rol del usuario es 'admin'.
 * 3. Redirige si alguna verificacion falla.
 */
export default function AdminLayout() {
  const router = useRouter();
  
  const [loadingRole, setLoadingRole] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  // 1. Logica para obtener el rol
  useEffect(() => {
    const user = auth.currentUser;
    setLoadingRole(true);

    if (!user) {
      setLoadingRole(false);
      setRole(null);
      return;
    }

    const fetchRole = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef); // ✅ Firebase Interaction

        if (userSnap.exists()) {
          const userRole = userSnap.data().role || "patient";
          setRole(userRole);
        } else {
          // Usuario existe en Auth pero no en /users (raro, pero posible)
          console.log("[AdminLayout] Usuario existe en Auth pero sin doc en 'users'. Asignando 'unknown'."); // ✅ Firebase (Validation)
          setRole("unknown"); 
        }
      } catch (e) {
        console.log(" ❌❌❌❌ [AdminLayout] Error al cargar rol:", e); // ✅ Firebase Error
        setRole("error");
      } finally {
        setLoadingRole(false);
      }
    };

    fetchRole();
  }, []);

  // 2. Logica de Redireccion
  useEffect(() => {
    if (loadingRole) {
      return; // No hacer nada mientras carga
    }
    
    if (!auth.currentUser) {
      // 1. Si no hay usuario -> a Login
      router.replace("/auth/login");
    } else if (role !== "admin") {
      // 2. Si el usuario existe pero no es admin -> a Home
      router.replace("/(tabs)");
    } 
    // Si es admin, no hacemos nada, permitiendo que renderice el stack
    
  }, [loadingRole, role]);
  
  // Pantalla de carga mientras se verifica el rol
  if (loadingRole) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 10 }}>Verificando permisos de administracion...</Text>
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
  
  return null;
}