import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  ScrollView,
  ActivityIndicator 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../src/lib/firebase"; 
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { globalStyles, colors } from "../../assets/styles";
import { navigateToCargarReceta, replaceWithLogin } from "../../src/lib/navigationHelpers";

// Pantalla de inicio para el paciente
export default function DashboardHome() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  console.log("[DashboardHome] Renderizando...");

  // Cargar nombre de usuario
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log(`[onAuthStateChanged] user? ${!!user}`);
      if (!user) {
        // Fallback por si el AuthGuard global falla
        replaceWithLogin(router);
        return;
      }
  
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        let name = "Usuario"; // Default
        if (userDoc.exists()) {
          name = userDoc.data().firstName || "Usuario";
        } else {
          name = user.email?.split("@")[0] || "Usuario";
        }
        
        // Capitalizar primera letra
        setUserName(name.charAt(0).toUpperCase() + name.slice(1));
      } catch (error) {
        // Mantenemos el console.error como pediste
        console.log("❌❌❌❌ Error al obtener datos:", error);
        setUserName("Usuario"); // Fallback en caso de error
      } finally {
        setLoading(false);
      }
    });
    
    // Cleanup
    return () => {
      unsubscribe();
    };
  }, []);

  // Handler para navegar a Cargar Receta
  const handleUploadRecipe = () => {
    console.log("[handleUploadRecipe] Navegando a Cargar Receta...");
    navigateToCargarReceta(router);
  };

  // Render de carga
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

  // Render principal
  console.log(`[Render] Estado: OK. Saludando a ${userName}`);
  return (
    <SafeAreaView style={globalStyles.container} edges={["top"]}>
      <ScrollView style={globalStyles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Hola, {userName}</Text>
        </View>

        {/* Boton principal */}
        <Pressable 
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed
          ]} 
          onPress={handleUploadRecipe}
        >
          <Ionicons name="camera-outline" size={24} color={colors.textPrimary} />
          <Text style={styles.primaryButtonText}>Cargar Nueva Receta</Text>
        </Pressable>

        <View style={globalStyles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
});