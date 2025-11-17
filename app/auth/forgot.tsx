import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../src/lib/firebase";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { globalStyles, colors } from "../../assets/styles";
import BackButton from "../../src/components/common/backbutton";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Helper simple para validar email
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
    setError("");
    setSuccess(false);
    const trimmedEmail = email.trim();

    // Validaciones
    if (!trimmedEmail) {
      console.log("[handleResetPassword] Validacion: Email vacio."); // ✅ Validación
      setError("Por favor ingresa tu email");
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      console.log("[handleResetPassword] Validacion: Email invalido."); // ✅ Validación
      setError("Por favor ingresa un email valido");
      return;
    }

    try {
      setLoading(true);
      console.log(
        `[handleResetPassword] Llamando sendPasswordResetEmail para: ${trimmedEmail}` // ✅ Firebase Interaction
      );

      await sendPasswordResetEmail(auth, trimmedEmail);

      console.log("[handleResetPassword] Email enviado OK."); // ✅ Firebase Success
      setSuccess(true);

      if (Platform.OS === "web") {
        alert(
          "¡Email enviado! Revisa tu casilla de correo para restablecer tu contraseña."
        );
      } else {
        Alert.alert(
          "¡Email enviado!",
          "Revisa tu casilla de correo para restablecer tu contraseña. Si no lo ves, revisa la carpeta de spam.",
          [
            {
              text: "Entendido",
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (e: any) {
      const code = String(e?.code || "UNKNOWN_ERROR");
      console.log(`[handleResetPassword] _ERROR_: ${code}`, e.message); // ✅ Firebase Error

      let errorMessage = "No pudimos enviar el email. Intenta de nuevo.";

      if (code.includes("auth/user-not-found")) {
        errorMessage = "No existe una cuenta con este email";
      } else if (code.includes("auth/invalid-email")) {
        errorMessage = "El email ingresado no es valido";
      } else if (code.includes("auth/too-many-requests")) {
        errorMessage = "Demasiados intentos. Espera unos minutos";
      } else if (code.includes("auth/network-request-failed")) {
        errorMessage = "Error de conexion. Verifica tu internet";
      }

      setError(errorMessage);

      if (__DEV__) {
        console.log(" ❌❌❌ Reset password error (raw):", e); // ✅ Debug/Error
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BackButton />

          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="mail-outline" size={64} color={colors.primary} />
            </View>

            <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>

            <Text style={styles.subtitle}>
              No te preocupes, te enviaremos un email con instrucciones para
              restablecer tu contraseña.
            </Text>

            {/* Mensaje de error */}
            {error ? (
              <View style={globalStyles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                <Text style={globalStyles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Mensaje de exito */}
            {success ? (
              <View style={styles.successContainer}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#059669"
                />
                <Text style={styles.successText}>
                  Email enviado correctamente. Revisa tu casilla.
                </Text>
              </View>
            ) : null}

            {/* Formulario */}
            <View style={styles.form}>
              <View style={globalStyles.section}>
                <Text style={globalStyles.label}>Email</Text>
                <TextInput
                  placeholder="tu@email.com"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    // Limpiar estados al tipear
                    setError("");
                    setSuccess(false);
                  }}
                  style={[globalStyles.input, error && globalStyles.inputError]}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  returnKeyType="done"
                  onSubmitEditing={handleResetPassword}
                  editable={!loading}
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              <Pressable
                style={({ pressed }) => [
                  globalStyles.primaryButton,
                  pressed && !loading && globalStyles.buttonPressed,
                  loading && globalStyles.buttonDisabled,
                  { marginTop: 8 },
                ]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                <Text style={globalStyles.primaryButtonText}>
                  {loading ? "Enviando..." : "Enviar email de recuperacion"}
                </Text>
              </Pressable>
            </View>

            {/* Info adicional */}
            <View style={styles.infoBox}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={colors.info}
              />
              <Text style={styles.infoText}>
                El email puede tardar unos minutos en llegar. Si no lo ves,
                revisá la carpeta de spam o correo no deseado.
              </Text>
            </View>

            {/* Link para volver */}
            <Pressable
              style={styles.backToLogin}
              onPress={() => router.back()}
            >
              <Text style={styles.backToLoginText}>
                Volver al inicio de sesión
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    padding: 20,
  },
  content: {
    flex: 1,
    gap: 20,
    paddingTop: 20,
  },
  iconContainer: {
    alignSelf: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  form: {
    width: "100%",
    marginTop: 8,
  },
  successContainer: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    backgroundColor: "#D1FAE5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#6EE7B7",
  },
  successText: {
    flex: 1,
    fontSize: 14,
    color: "#065F46",
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#1E40AF",
    lineHeight: 18,
  },
  backToLogin: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backToLoginText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: "600",
  },
});