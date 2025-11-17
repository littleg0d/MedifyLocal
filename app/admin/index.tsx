import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors } from "../../assets/styles";
import { signOut } from "firebase/auth"; 
import { auth } from "../../src/lib/firebase"; 

export default function AdminDashboard() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth); // ✅ Firebase Interaction
      router.replace("/auth/login");
    } catch (error) {
      console.log(" ❌❌❌❌ [AdminDashboard] Error al cerrar sesion:", error); // ✅ Error
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Panel de Administracion</Text>
        <Text style={styles.subtitle}>Bienvenido, Admin 👑</Text>

        <Pressable
          style={styles.button}
          onPress={() => router.push("/admin/usuarios")}
        >
          <Text style={styles.buttonText}>👥 Ver Usuarios</Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={() => router.push("/admin/farmacias")}
        >
          <Text style={styles.buttonText}>🏥 Ver Farmacias</Text>
        </Pressable>

        {/* Separador visual  */}
        <View style={styles.separator} />

        <Pressable
          style={[styles.button, styles.logout]}
          onPress={handleLogout} 
        >
          <Text style={styles.buttonText}>🚪 Cerrar Sesion</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "white" },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    padding: 16,
  },
  title: { fontSize: 26, fontWeight: "700", color: colors.textPrimary },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 20 },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: "80%",
    alignItems: "center",
  },
  logout: { 
    backgroundColor: colors.error,
    marginTop: 20, // Espacio extra para el logout
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "600" },
  separator: {
    height: 1,
    width: '80%',
    backgroundColor: '#E5E7EB', 
    marginTop: 20,
  }
});