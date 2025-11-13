import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../../src/lib/firebase";
import { globalStyles, colors } from "../../assets/styles";

export default function CrearFarmacia() {
  const router = useRouter();

  const [nombreComercial, setNombreComercial] = useState("");
  const [usuario, setUsuario] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [horario, setHorario] = useState("");
  const [loading, setLoading] = useState(false);

  const validar = () => {
    if (!nombreComercial.trim()) return "Ingresá el nombre comercial";
    if (!usuario.trim()) return "Ingresá un nombre de usuario";
    if (!email.trim()) return "Ingresá el email";
    if (!password.trim() || password.length < 6)
      return "La contraseña debe tener al menos 6 caracteres";
    if (!direccion.trim()) return "Ingresá la dirección";
    return null;
  };

  const handleCrear = async () => {
    const error = validar();
    if (error) {
      Alert.alert("Error", error);
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ Crear usuario en Firebase Auth
      const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(userCred.user, { displayName: nombreComercial.trim() });

      // 2️⃣ Guardar datos en Firestore (colección farmacias)
      await setDoc(doc(db, "farmacias", userCred.user.uid), {
        nombreComercial: nombreComercial.trim(),
        usuario: usuario.trim(),
        email: email.trim(),
        telefono: telefono.trim() || null,
        direccion: direccion.trim(),
        horario: horario.trim() || null,
        role: "farmacia",
        createdAt: serverTimestamp(),
      });

      Alert.alert(
        "✅ Éxito",
        "Farmacia creada correctamente.",
        [
          { text: "Ver listado", onPress: () => router.replace("/admin/farmacias") },
          { text: "Crear otra", style: "cancel" },
        ]
      );

      // Limpiar campos
      setNombreComercial("");
      setUsuario("");
      setEmail("");
      setPassword("");
      setTelefono("");
      setDireccion("");
      setHorario("");

    } catch (e: any) {
      console.error("Error creando farmacia:", e);
      Alert.alert("Error", e.message || "No se pudo crear la farmacia.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={globalStyles.container} edges={["top", "bottom"]}>
      <ScrollView
        style={globalStyles.scrollView}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Ionicons name="business-outline" size={26} color={colors.primaryDark} />
          <Text style={styles.title}>Registrar Farmacia</Text>
        </View>

        <Text style={styles.subtitle}>
          Crea una cuenta para una farmacia. Podrá iniciar sesión con su email y contraseña.
        </Text>

        <View style={styles.section}>
          <Text style={globalStyles.label}>Nombre Comercial *</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="Ej: Farmacia Central"
            value={nombreComercial}
            onChangeText={setNombreComercial}
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        <View style={styles.section}>
          <Text style={globalStyles.label}>Usuario *</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="Ej: farmacia_central"
            value={usuario}
            onChangeText={setUsuario}
            autoCapitalize="none"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        <View style={styles.section}>
          <Text style={globalStyles.label}>Email *</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="contacto@farmacia.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        <View style={styles.section}>
          <Text style={globalStyles.label}>Contraseña *</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        <View style={styles.section}>
          <Text style={globalStyles.label}>Teléfono</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="11 1234-5678"
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        <View style={styles.section}>
          <Text style={globalStyles.label}>Dirección *</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="Av. Siempre Viva 742"
            value={direccion}
            onChangeText={setDireccion}
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        <View style={styles.section}>
          <Text style={globalStyles.label}>Horario</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="8:00 a 20:00"
            value={horario}
            onChangeText={setHorario}
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            globalStyles.primaryButton,
            pressed && globalStyles.buttonPressed,
            loading && globalStyles.buttonDisabled,
          ]}
          onPress={handleCrear}
          disabled={loading}
        >
          <Text style={globalStyles.primaryButtonText}>
            {loading ? "Creando..." : "Crear Farmacia"}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.secondaryBtn,
            pressed && globalStyles.buttonPressed,
          ]}
          onPress={() => router.back()}
        >
          <Text style={styles.secondaryText}>Cancelar</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: "700", color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 8 },
  section: { gap: 6 },
  secondaryBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { color: colors.textSecondary, fontWeight: "500" },
});
