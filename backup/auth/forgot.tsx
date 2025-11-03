import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../src/lib/firebase";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function Forgot() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onReset = async () => {
    // Validaciones
    if (!email.trim()) {
      Alert.alert("Error", "Por favor ingresá tu email");
      return;
    }

    if (!email.includes("@")) {
      Alert.alert("Error", "Por favor ingresá un email válido");
      return;
    }

    try {
      setLoading(true);
      
      // Enviar email de recuperación con Firebase
      await sendPasswordResetEmail(auth, email.trim());
      
      Alert.alert(
        "¡Listo!",
        "Te enviamos un correo para recuperar tu contraseña. Revisá tu bandeja de entrada.",
        [
          {
            text: "Entendido",
            onPress: () => router.push("/auth/login")
          }
        ]
      );
    } catch (e: any) {
      const code = String(e?.code || "");
      
      let errorMessage = "No pudimos enviar el correo. Intentá de nuevo.";
      
      if (code.includes("auth/user-not-found")) {
        errorMessage = "No existe una cuenta con ese email";
      } else if (code.includes("auth/invalid-email")) {
        errorMessage = "El formato del email es inválido";
      } else if (code.includes("auth/too-many-requests")) {
        errorMessage = "Demasiados intentos. Esperá unos minutos";
      } else if (code.includes("auth/network-request-failed")) {
        errorMessage = "Error de conexión. Verificá tu internet";
      }
      
      Alert.alert("Error", errorMessage);
      console.error("Password reset error:", code, e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: "#ffff", paddingTop: 60 }} 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Recuperar contraseña</Text>
        <Text style={styles.subtitle}>
          Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña
        </Text>

        <View style={styles.form}>
          <TextInput
            placeholder="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="done"
            onSubmitEditing={onReset}
            editable={!loading}
          />

          <Pressable 
            style={[styles.primaryBtn, loading && { opacity: 0.7 }]} 
            onPress={onReset} 
            disabled={loading}
          >
            <Text style={styles.primaryText}>
              {loading ? "Enviando..." : "Enviar enlace"}
            </Text>
          </Pressable>

          <Link 
            href="/auth/login" 
            style={[styles.link, { alignSelf: "center", marginTop: 12 }]}
            disabled={loading}
          >
            Volver al inicio de sesión
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center", 
    gap: 16,
    padding: 20 
  },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  subtitle: { 
    fontSize: 14, 
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 20
  },
  form: { width: "100%", gap: 12, marginTop: 6 },
  input: {
    height: 48, 
    borderRadius: 12, 
    paddingHorizontal: 14,
    backgroundColor: "#F3F4F6", 
    borderWidth: 1, 
    borderColor: "#E5E7EB",
    fontSize: 16,
    color: "#111827"
  },
  primaryBtn: {
    height: 48, 
    borderRadius: 12, 
    alignItems: "center", 
    justifyContent: "center",
    backgroundColor: "#22C55E",
  },
  primaryText: { color: "white", fontWeight: "700", fontSize: 16 },
  link: { color: "#16A34A", fontWeight: "600" },
});