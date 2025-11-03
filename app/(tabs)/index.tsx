import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../src/lib/firebase";
import { signOut } from "firebase/auth";
import { globalStyles, colors } from "../../assets/styles";

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
    <SafeAreaView style={globalStyles.container} edges={["top"]}>
      <ScrollView style={globalStyles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Hola, {userName}</Text>
          <Pressable 
            style={({ pressed }) => [
              styles.notificationButton,
              pressed && globalStyles.buttonPressed
            ]}
            onPress={handleNotifications}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.textSecondary} />
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
          <Ionicons name="camera-outline" size={24} color={colors.textPrimary} />
          <Text style={styles.primaryButtonText}>Cargar Nueva Receta</Text>
        </Pressable>

        {/* Sección pedidos */}
        <View style={styles.section}>
          <Text style={globalStyles.sectionTitle}>Pedidos Activos</Text>
          
          <View style={styles.emptyState}>
            <View style={globalStyles.iconContainerRound}>
              <Ionicons name="receipt-outline" size={48} color={colors.gray300} />
            </View>
            <Text style={styles.emptyTitle}>No tenés pedidos activos</Text>
            <Text style={globalStyles.emptyText}>
              Cargá una receta para comenzar a buscar las mejores opciones
            </Text>
          </View>
        </View>

        {/* Botón de logout */}
        <Pressable 
          style={({ pressed }) => [
            globalStyles.dangerButton,
            pressed && globalStyles.buttonPressed
          ]} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={globalStyles.dangerButtonText}>Cerrar Sesión</Text>
        </Pressable>

        <View style={globalStyles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    color: colors.textPrimary,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
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
  section: {
    marginTop: 32,
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.gray700,
    marginBottom: 8,
  },
});