// app/admin/index.tsx
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors } from "../../assets/styles";

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Panel de Administración</Text>
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

        <Pressable
          style={[styles.button, styles.logout]}
          onPress={() => router.replace("../auth/login")}
        >
          <Text style={styles.buttonText}>🚪 Cerrar Sesión</Text>
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
  subtitle: { fontSize: 16, color: colors.textSecondary },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: "80%",
    alignItems: "center",
  },
  logout: { backgroundColor: colors.error },
  buttonText: { color: "white", fontSize: 16, fontWeight: "600" },
});
