import { useRouter, useSegments, Slot } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../src/lib/firebase";
import { colors } from "../assets/styles";

function RootLayoutNav() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const farmaciaDocRef = doc(db, "farmacias", currentUser.uid);
          const farmaciaDocSnap = await getDoc(farmaciaDocRef);

          if (farmaciaDocSnap.exists()) {
            const farmaciaData = farmaciaDocSnap.data();
            const userRole = farmaciaData.role || 'farmacia';
            setRole(userRole);
          } else {
            const userDocRef = doc(db, "users", currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              const userRole = userData.role || 'user';
              setRole(userRole);
            } else {
              console.log("❌❌❌❌ [RootLayout] User doc no existe en 'farmacias' ni 'users'. Defaulting a 'user'."); // ✅ Firebase (Validation)
              setRole('user');
            }
          }
        } catch (error) {
          console.error("❌❌❌❌ Error al obtener el rol del usuario (Firebase):", error); // ✅ Firebase Error
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

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === "auth";
    const inTabsGroup = segments[0] === "(tabs)";
    const inAdminGroup = segments[0] === "admin";
    const inFarmaciaGroup = segments[0] === "farmacia";
    
    const publicRoutes = ["cargarReceta", "pagar", "solicitudes", "editar-perfil", "change-password"];
    const isPublicRoute = publicRoutes.includes(segments[0]);
    

    if (!user) {
      // --- Usuario NO logueado ---
      if (inTabsGroup || inAdminGroup || inFarmaciaGroup || isPublicRoute) {
        router.replace("/auth/login");
      } else if (segments.length === 0 && !inAuthGroup) {
        router.replace("/auth/login");
      }
    } else {
      // --- Usuario SI logueado ---
      if (role === 'admin') {
        if (inAuthGroup || inTabsGroup || inFarmaciaGroup || segments.length === 0) {
          router.replace("/admin/");
        }
      } else if (role === 'farmacia') {
        if (inAuthGroup || inTabsGroup || inAdminGroup || segments.length === 0) {
          router.replace("/farmacia/");
        }
      } else {
        // Rol de USER (patient)
        if (inAuthGroup || inAdminGroup || inFarmaciaGroup || segments.length === 0) {
          router.replace("/(tabs)");
        }
      }
    }
  }, [user, role, segments, isLoading, router]);

  const shouldRender = () => {
    if (isLoading) {
      return false;
    }

    const inAuthGroup = segments[0] === "auth";
    const inTabsGroup = segments[0] === "(tabs)";
    const inAdminGroup = segments[0] === "admin";
    const inFarmaciaGroup = segments[0] === "farmacia";
    
    const publicRoutes = ["cargarReceta", "pagar", "solicitudes", "editar-perfil", "change-password"];
    const isPublicRoute = publicRoutes.includes(segments[0]);

    if (!user) {
      const render = inAuthGroup;
      return render;
    } else {
      if (role === 'admin') {
        const render = inAdminGroup || isPublicRoute;
        return render;
      } else if (role === 'farmacia') {
        const render = inFarmaciaGroup || isPublicRoute;
        return render;
      } else {
        const render = inTabsGroup || isPublicRoute;
        return render;
      }
    }
  };

  if (!shouldRender()) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return <RootLayoutNav />;
}