import { AntDesign, Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { 
  KeyboardAvoidingView, 
  Platform, 
  Pressable, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  View,
  Alert 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; 
import { auth } from "../../src/lib/firebase";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSignIn = async () => {
    setError("");

    // Validaciones
    if (!email.trim() || !password) {
      setError("Por favor completá todos los campos");
      return;
    }

    if (!email.includes("@")) {
      setError("Por favor ingresá un email válido");
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // El redirect lo maneja _layout.tsx automáticamente
    } catch (e: any) {
      const code = String(e?.code || "");
      
      const errorMessages: { [key: string]: string } = {
        "auth/invalid-credential": "Email o contraseña incorrectos",
        "auth/user-not-found": "Email o contraseña incorrectos",
        "auth/wrong-password": "Email o contraseña incorrectos",
        "auth/invalid-email": "El formato del email es inválido",
        "auth/user-disabled": "Esta cuenta ha sido deshabilitada",
        "auth/too-many-requests": "Demasiados intentos. Intentá nuevamente más tarde",
        "auth/network-request-failed": "Error de conexión. Verificá tu internet",
      };

      // Buscar el mensaje correspondiente
      let humanMessage = "No pudimos iniciar sesión. Intentá de nuevo";
      for (const [key, message] of Object.entries(errorMessages)) {
        if (code.includes(key)) {
          humanMessage = message;
          break;
        }
      }
      
      setError(humanMessage);
      if (__DEV__) {
        console.error("Login error:", code, e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // TODO: Implementar Google sign-in
    Alert.alert("Próximamente", "El inicio de sesión con Google estará disponible pronto");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.container} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.logoWrap}>
            <Ionicons name="medkit-outline" size={28} color="#16A34A" />
          </View>
          <Text style={styles.title}>Medify</Text>
          <Text style={styles.subtitle}>Tu medicación, sin complicaciones.</Text>

          {/* Mensaje de error */}
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Formulario */}
          <View style={styles.form}>
            <TextInput
              placeholder="Correo electrónico"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError("");
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              editable={!loading}
              style={[styles.input, error && styles.inputError]}
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              placeholder="Contraseña"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError("");
              }}
              secureTextEntry
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={onSignIn}
              editable={!loading}
              style={[styles.input, error && styles.inputError]}
              placeholderTextColor="#9CA3AF"
            />

            <Pressable 
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled
              ]} 
              onPress={onSignIn}
              disabled={loading}
            >
              <Text style={styles.primaryText}>
                {loading ? "Iniciando sesión..." : "Iniciar sesión"}
              </Text>
            </Pressable>

            {/* Forgot password */}
            <Link href="/auth/forgot" asChild disabled={loading}>
              <Pressable disabled={loading}>
                <Text style={[styles.link, loading && styles.linkDisabled]}>
                  ¿Olvidaste tu contraseña?
                </Text>
              </Pressable>
            </Link>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.divider} />
          </View>

          {/* Social buttons */}
          <View style={styles.socialContainer}>
            <Pressable 
              style={({ pressed }) => [
                styles.socialBtn,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled
              ]}
              disabled={loading}
              onPress={handleGoogleSignIn}
            >
              <AntDesign name="google" size={18} color="#111827" />
              <Text style={styles.socialText}>Continuar con Google</Text>
            </Pressable>
          </View>

          {/* Register */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>¿No tenés cuenta? </Text>
            <Link href="/auth/register" asChild disabled={loading}>
              <Pressable disabled={loading}>
                <Text style={[styles.link, styles.linkInline, loading && styles.linkDisabled]}>
                  Crear una cuenta
                </Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    padding: 20,
    alignItems: "center",
    gap: 16,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  errorContainer: {
    width: "100%",
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  form: {
    width: "100%",
    gap: 12,
    marginTop: 6,
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontSize: 16,
    color: "#111827",
  },
  inputError: {
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
  },
  primaryBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22C55E",
  },
  primaryText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  link: {
    color: "#16A34A",
    fontWeight: "600",
    paddingVertical: 8,
    textAlign: "center",
  },
  linkInline: {
    paddingVertical: 0,
  },
  linkDisabled: {
    opacity: 0.5,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
    marginTop: 8,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    color: "#9CA3AF",
  },
  socialContainer: {
    gap: 10,
    width: "100%",
  },
  socialBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  socialText: {
    color: "#111827",
    fontWeight: "600",
    fontSize: 16,
  },
  registerContainer: {
    flexDirection: "row",
    marginTop: 16,
    alignItems: "center",
  },
  registerText: {
    color: "#6B7280",
    fontSize: 14,
  },
});