import { auth, db } from "@/src/lib/firebase";
import { Link, useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const onRegister = async () => {
  // Validaciones mínimas
  if (!name.trim()) return Alert.alert("Falta tu nombre");
  if (!email.includes("@")) return Alert.alert("Email inválido");
  if (password.length < 6) return Alert.alert("La contraseña debe tener al menos 6 caracteres");
  if (password !== confirm) return Alert.alert("Las contraseñas no coinciden");

  try {
    setLoading(true);

    // 1) Crear la cuenta en Firebase Auth
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);

    // 2) Poner el displayName en el perfil de Auth (útil para mostrar en la app)
    await updateProfile(cred.user, { displayName: name.trim() });

    // 3) Guardar el usuario en Firestore (colección users/{uid})
    await setDoc(doc(db, "users", cred.user.uid), {
      displayName: name.trim(),
      email: cred.user.email,
      role: "patient",               // por ahora todos pacientes
      createdAt: serverTimestamp(),  // timestamp del servidor
    });

    // 4) (Opcional) Enviar verificación de email
    // await sendEmailVerification(cred.user);

    // 5) Ir a la app logueada
    router.replace("/(tabs)");
  } catch (e: any) {
    // Mapeo amigable de errores comunes de Firebase
    const msg = String(e?.code || e?.message || "");
    let human =
      msg.includes("auth/email-already-in-use") ? "Ese email ya está registrado" :
      msg.includes("auth/invalid-email")        ? "El email no es válido" :
      msg.includes("auth/weak-password")        ? "La contraseña es demasiado débil" :
      "No pudimos registrarte. Intenta de nuevo.";
    Alert.alert("Error", human);
    console.log("Register error:", e);
  } finally {
    setLoading(false);
  }
};


  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#ffff",paddingTop: 60}} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>Registrate para continuar</Text>

        <View style={styles.form}>
          <TextInput
            placeholder="Nombre y apellido"
            value={name}
            onChangeText={setName}
            style={styles.input}
            returnKeyType="next"
          />
          <TextInput
            placeholder="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="next"
          />
          <TextInput
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
            textContentType="password"
            returnKeyType="next"
          />
          <TextInput
            placeholder="Repetir contraseña"
            value={confirm}
            onChangeText={setConfirm}
            style={styles.input}
            secureTextEntry
            textContentType="password"
            returnKeyType="done"
          />

          <Pressable style={[styles.primaryBtn, loading && { opacity: 0.7 },{marginTop:40}]} onPress={onRegister} disabled={loading}>
            <Text style={styles.primaryText}>{loading ? "Creando..." : "Crear cuenta"}</Text>
          </Pressable>

          <View style={styles.inline}>
            <Text style={{ color: "#6B7280" }}>¿Ya tenés cuenta? </Text>
            <Link href="/auth/login" style={styles.link}>Iniciar sesión</Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding:20, alignItems: "center", gap: 16 },
  title: { fontSize: 24, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6B7280" },
  form: { width: "100%", gap: 12, marginTop: 6 },
  input: {
    height: 48, borderRadius: 12, paddingHorizontal: 14,
    backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#E5E7EB",
  },
  primaryBtn: {
    height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#22C55E",
  },
  primaryText: { color: "white", fontWeight: "700" },
  link: { color: "#16A34A", fontWeight: "600" },
  inline: { flexDirection: "row", marginTop: 10 }
});
