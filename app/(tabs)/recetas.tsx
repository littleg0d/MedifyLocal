import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../src/lib/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function Perfil() {
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          phone: data.phone || "",
          address: data.address || "",
        });
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, "users", user.uid);
      
      await setDoc(docRef, {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        address: userData.address,
        displayName: `${userData.firstName} ${userData.lastName}`.trim(),
        email: user.email,
      }, { merge: true });

      Alert.alert("¡Listo!", "Tus datos se guardaron correctamente");
    } catch (error) {
      console.error("Error al guardar:", error);
      Alert.alert("Error", "No pudimos guardar los cambios. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  };

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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Mi Perfil</Text>
        </View>

        {/* Email (solo lectura) */}
        <View style={styles.section}>
          <Text style={styles.label}>Correo electrónico</Text>
          <View style={styles.inputDisabled}>
            <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
            <Text style={styles.emailText}>{auth.currentUser?.email}</Text>
          </View>
        </View>

        {/* Nombre */}
        <View style={styles.section}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingresá tu nombre"
            value={userData.firstName}
            onChangeText={(text) => setUserData({ ...userData, firstName: text })}
          />
        </View>

        {/* Apellido */}
        <View style={styles.section}>
          <Text style={styles.label}>Apellido</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingresá tu apellido"
            value={userData.lastName}
            onChangeText={(text) => setUserData({ ...userData, lastName: text })}
          />
        </View>

        {/* Teléfono */}
        <View style={styles.section}>
          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingresá tu teléfono"
            value={userData.phone}
            onChangeText={(text) => setUserData({ ...userData, phone: text })}
            keyboardType="phone-pad"
          />
        </View>

        {/* Dirección */}
        <View style={styles.section}>
          <Text style={styles.label}>Dirección</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingresá tu dirección"
            value={userData.address}
            onChangeText={(text) => setUserData({ ...userData, address: text })}
            multiline
          />
        </View>

        {/* Botón Guardar */}
        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.buttonPressed,
            saving && styles.buttonDisabled,
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Text>
        </Pressable>

        {/* Botón Cerrar Sesión */}
        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </Pressable>

        {/* Espaciado para el tab bar */}
        <View style={{ height: 80 }} />
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#6B7280",
    fontSize: 16,
  },
  header: {
    marginBottom: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    color: "#111827",
  },
  inputDisabled: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emailText: {
    fontSize: 16,
    color: "#6B7280",
  },
  saveButton: {
    backgroundColor: "#22C55E",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    backgroundColor: "#FEF2F2",
  },
  logoutText: {
    color: "#EF4444",
    fontWeight: "600",
    fontSize: 16,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});