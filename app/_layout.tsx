import { useRouter, useSegments, Slot } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../src/lib/firebase";

function RootLayoutNav() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  // Escuchar cambios en el estado de autenticación de Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        try {
          // Verificar en farmacias
          const farmaciaDocRef = doc(db, "farmacias", currentUser.uid);
          const farmaciaDocSnap = await getDoc(farmaciaDocRef);

          if (farmaciaDocSnap.exists()) {
            const farmaciaData = farmaciaDocSnap.data();
            setRole(farmaciaData.role || 'farmacia');
          } else {
            // Buscar en users
            const userDocRef = doc(db, "users", currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              setRole(userData.role || 'user');
            } else {
              console.warn("No se encontró el documento del usuario en Firestore.");
              setRole('user');
            }
          }
        } catch (error) {
          console.error("Error al obtener el rol del usuario:", error);
          setRole('user');
        } finally {
          setIsLoading(false);
        }
      } else {
        setUser(null);
        setRole(null);
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Redirección basada en estado de auth y rol
  useEffect(() => {
    if (isLoading) return; // Esperar a que la auth y el rol se carguen

    const inAuthGroup = segments[0] === "auth";
    const inTabsGroup = segments[0] === "(tabs)";
    const inAdminGroup = segments[0] === "admin";
    const inFarmaciaGroup = segments[0] === "farmacia";

    if (!user) {
      // Usuario NO logueado
      if (inTabsGroup || inAdminGroup || inFarmaciaGroup) {
        router.replace("/auth/login");
      } else if (segments.length === 0) {
        router.replace("/auth/login");
      }
    } else {
      // Usuario SÍ logueado
      if (role === 'admin') {
        // Rol de ADMIN
        if (inAuthGroup || inTabsGroup || inFarmaciaGroup || segments.length === 0) {
          router.replace("/admin/");
        }
      } else if (role === 'farmacia') {
        // Rol de FARMACIA
        if (inAuthGroup || inTabsGroup || inAdminGroup || segments.length === 0) {
          router.replace("/farmacia/");
        }
      } else {
        // Rol de USER
        if (inAuthGroup || inAdminGroup || inFarmaciaGroup || segments.length === 0) {
          router.replace("/(tabs)");
        }
      }
    }
  }, [user, role, segments, isLoading]);

  // 🔥 CLAVE: No renderizar Slot si necesita redireccionar
  const shouldRender = () => {
    if (isLoading) return false;

    const inAuthGroup = segments[0] === "auth";
    const inTabsGroup = segments[0] === "(tabs)";
    const inAdminGroup = segments[0] === "admin";
    const inFarmaciaGroup = segments[0] === "farmacia";

    if (!user) {
      // Solo renderizar si está en auth
      return inAuthGroup;
    } else {
      // Usuario logueado
      if (role === 'admin') {
        // Solo renderizar si está en admin
        return inAdminGroup;
      } else if (role === 'farmacia') {
        // Solo renderizar si está en farmacia
        return inFarmaciaGroup;
      } else {
        // Solo renderizar si está en tabs
        return inTabsGroup;
      }
    }
  };

  // Pantalla de carga mientras verifica auth, rol o mientras no esté en la ruta correcta
  if (!shouldRender()) {
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