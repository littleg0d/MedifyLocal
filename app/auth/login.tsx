import { AntDesign, Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../src/lib/firebase";
import { globalStyles, colors } from "../../assets/styles";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSignIn = async () => {
    setError("");

    // Validar campos vacíos
    if (!email.trim() || !password) {
      setError("Por favor completá todos los campos");
      return;
    }

    // Modo admin directo
    if (email.trim().toLowerCase() === "admin" && password === "admin") {
      router.replace("/admin");
      return;
    }

    // Validar email con regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Email inválido");
      return;
    }

    // Validar longitud mínima de contraseña
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      setLoading(true);
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const uid = userCred.user.uid;

      // 🔍 Verificar si está en farmacias
      const farmaciaRef = doc(db, "farmacias", uid);
      const farmaciaSnap = await getDoc(farmaciaRef);

      if (farmaciaSnap.exists()) {
        const data = farmaciaSnap.data();
        if (data.role === "farmacia") {
          router.replace("../farmacia");
          return;
        }
      }
      const adminRef = doc(db, "users", uid);
      const adminSnap = await getDoc(adminRef);

    if (adminSnap.exists()) {
    const data = adminSnap.data();
    if (data.role === "admin") {
      router.replace("../admin");
      return;
     }
    }
      // 🔍 Si no está en farmacias, buscar en users
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.role === "patient") {
          router.replace("/(tabs)");
          return;
        }
      }

      // 🔁 Si no tiene rol o no lo encontramos, ir al home de usuarios por defecto
      router.replace("/(tabs)");
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

  // ⚙️ Función para Google (placeholder)
  const handleGoogleSignIn = () => {
    Alert.alert("Próximamente", "El inicio de sesión con Google estará disponible pronto");
  };

  // ---------- RENDER ----------
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
            <Ionicons name="medkit-outline" size={28} color={colors.primaryDark} />
          </View>
          <Text style={styles.title}>Medify</Text>
          <Text style={globalStyles.subtitle}>Tu medicación, sin complicaciones.</Text>

          {/* Mensaje de error */}
          {error ? (
            <View style={globalStyles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#DC2626" />
              <Text style={globalStyles.errorText}>{error}</Text>
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
              style={[globalStyles.input, error && globalStyles.inputError]}
              placeholderTextColor={colors.textTertiary}
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
              style={[globalStyles.input, error && globalStyles.inputError]}
              placeholderTextColor={colors.textTertiary}
            />

            <Pressable
              style={({ pressed }) => [
                globalStyles.primaryButton,
                pressed && globalStyles.buttonPressed,
                loading && globalStyles.buttonDisabled,
              ]}
              onPress={onSignIn}
              disabled={loading}
            >
              <Text style={globalStyles.primaryButtonText}>
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
          <View style={globalStyles.dividerRow}>
            <View style={globalStyles.divider} />
            <Text style={globalStyles.dividerText}>o</Text>
            <View style={globalStyles.divider} />
          </View>

          {/* Social buttons */}
          <View style={styles.socialContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.socialBtn,
                pressed && globalStyles.buttonPressed,
                loading && globalStyles.buttonDisabled,
              ]}
              disabled={loading}
              onPress={handleGoogleSignIn}
            >
              <AntDesign name="google" size={18} color={colors.textPrimary} />
              <Text style={styles.socialText}>Continuar con Google</Text>
            </Pressable>
          </View>

          {/* Register */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>¿No tenés cuenta? </Text>
            <Link href="/auth/register" asChild disabled={loading}>
              <Pressable disabled={loading}>
                <Text
                  style={[
                    styles.link,
                    styles.linkInline,
                    loading && styles.linkDisabled,
                  ]}
                >
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
    backgroundColor: colors.surface,
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
    color: colors.textPrimary,
  },
  form: {
    width: "100%",
    gap: 12,
    marginTop: 6,
  },
  link: {
    color: colors.primaryDark,
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
  socialContainer: {
    gap: 10,
    width: "100%",
  },
  socialBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceHover,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  socialText: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 16,
  },
  registerContainer: {
    flexDirection: "row",
    marginTop: 16,
    alignItems: "center",
  },
  registerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
