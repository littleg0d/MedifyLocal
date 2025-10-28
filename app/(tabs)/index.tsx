import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../src/lib/firebase";
import { signOut } from "firebase/auth";

export default function DashboardHome() {
  const router = useRouter();
  const [userName, setUserName] = useState("Usuario");

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const name = user.displayName || user.email?.split("@")[0] || "Usuario";
      setUserName(name.charAt(0).toUpperCase() + name.slice(1));
    }
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro que querés salir?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salir",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (error) {
              console.error("Error al cerrar sesión:", error);
              Alert.alert("Error", "No pudimos cerrar sesión.");
            }
          },
        },
      ]
    );
  };

  const handleUploadRecipe = () => {
    Alert.alert(
      "Cargar Receta",
      "Esta función estará disponible pronto.",
      [{ text: "Entendido" }]
    );
  };

  const handleNotifications = () => {
    Alert.alert("Notificaciones", "No tenés notificaciones nuevas");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Hola, {userName}</Text>
          <Pressable 
            style={({ pressed }) => [
              styles.notificationButton,
              pressed && styles.buttonPressed
            ]}
            onPress={handleNotifications}
          >
            <Ionicons name="notifications-outline" size={24} color="#6B7280" />
          </Pressable>
        </View>

        {/* Botón principal */}
        <Pressable 
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed
          ]} 
          onPress={handleUploadRecipe}
        >
          <Ionicons name="camera-outline" size={24} color="#111827" />
          <Text style={styles.primaryButtonText}>Cargar Nueva Receta</Text>
        </Pressable>

        {/* Sección pedidos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pedidos Activos</Text>
          
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>No tenés pedidos activos</Text>
            <Text style={styles.emptySubtitle}>
              Cargá una receta para comenzar a buscar las mejores opciones
            </Text>
          </View>
        </View>

        {/* Botón de logout */}
        <Pressable 
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.buttonPressed
          ]} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </Pressable>

        {/* Espaciado para el tab bar */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* YA NO NECESITAS ESTO - EXPO ROUTER LO CREA AUTOMÁTICAMENTE */}
      {/* <View style={styles.bottomNav}>...</View> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F8F7",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  primaryButton: {
    backgroundColor: "#22C55E",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: "#22C55E",
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
    color: "#111827",
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 32,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    backgroundColor: "#FEF2F2",
  },
  logoutText: {
    color: "#EF4444",
    fontWeight: "600",
  },
  buttonPressed: {
    opacity: 0.7,
  },
});