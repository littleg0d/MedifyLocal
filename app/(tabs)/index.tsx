import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  ScrollView, 
  Alert,
  ActivityIndicator 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../src/lib/firebase"; 
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { globalStyles, colors } from "../../assets/styles";

export default function DashboardHome() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("../auth/login");
        return;
      }
  
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        const name = userDoc.exists() 
          ? userDoc.data().firstName || "Usuario"
          : user.email?.split("@")[0] || "Usuario";
        
        setUserName(name.charAt(0).toUpperCase() + name.slice(1));
      } catch (error) {
        console.error("Error al obtener datos:", error);
        setUserName("Usuario");
      } finally {
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  const handleUploadRecipe = () => {
    router.push("/cargarReceta");
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
    <SafeAreaView style={globalStyles.container} edges={["top"]}>
      <ScrollView style={globalStyles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Hola, {userName}</Text>
        </View>

        {/* Botón principal */}
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