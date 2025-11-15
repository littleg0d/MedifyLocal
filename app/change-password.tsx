import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { 
  EmailAuthProvider, 
  reauthenticateWithCredential, 
  updatePassword 
} from "firebase/auth";
import { auth } from "../src/lib/firebase";
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
  View 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { globalStyles, colors } from "../assets/styles";
import BackButton from "../src/components/common/backbutton";

export default function ChangePassword() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onChangePassword = async () => {
    setError("");

    // Validaciones
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Por favor completá todos los campos");
      return;
    }

    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden");
      return;
    }

    if (currentPassword === newPassword) {
      setError("La nueva contraseña debe ser diferente a la actual");
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      
      if (!user || !user.email) {
        Alert.alert("Error", "No hay usuario autenticado");
        return;
      }

      // 1. Re-autenticar al usuario con su contraseña actual
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      
      await reauthenticateWithCredential(user, credential);

      // 2. Actualizar la contraseña
      await updatePassword(user, newPassword);

      // 3. Éxito
      if (Platform.OS === "web") {
        alert("¡Tu contraseña fue actualizada correctamente!");
        router.back();
      } else {
        Alert.alert(
          "¡Listo!",
          "Tu contraseña fue actualizada correctamente",
          [
            {
              text: "Entendido",
              onPress: () => router.back()
            }
          ]
        );
      }
    } catch (e: any) {
      const code = String(e?.code || "");
      
      let errorMessage = "No pudimos cambiar tu contraseña. Intentá de nuevo.";
      
      if (code.includes("auth/wrong-password") || code.includes("auth/invalid-credential")) {
        errorMessage = "La contraseña actual es incorrecta";
      } else if (code.includes("auth/too-many-requests")) {
        errorMessage = "Demasiados intentos. Esperá unos minutos";
      } else if (code.includes("auth/network-request-failed")) {
        errorMessage = "Error de conexión. Verificá tu internet";
      } else if (code.includes("auth/requires-recent-login")) {
        errorMessage = "Por seguridad, volvé a iniciar sesión antes de cambiar tu contraseña";
      }
      
      setError(errorMessage);
      
      if (__DEV__) {
        console.error("Change password error:", code, e.message);
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
            <Text style={styles.title}>Cambiar Contraseña</Text>
            
            <Text style={styles.subtitle}>
              Para cambiar tu contraseña, primero ingresá tu contraseña actual
            </Text>

            {/* Mensaje de error */}
            {error ? (
              <View style={globalStyles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                <Text style={globalStyles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Formulario */}
            <View style={styles.form}>
              <View style={globalStyles.section}>
                <Text style={globalStyles.label}>Contraseña actual</Text>
                <TextInput
                  placeholder="Tu contraseña actual"
                  value={currentPassword}
                  onChangeText={(text) => {
                    setCurrentPassword(text);
                    setError("");
                  }}
                  style={[globalStyles.input, error && globalStyles.inputError]}
                  secureTextEntry
                  textContentType="password"
                  returnKeyType="next"
                  editable={!loading}
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              <View style={globalStyles.section}>
                <Text style={globalStyles.label}>Nueva contraseña</Text>
                <TextInput
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    setError("");
                  }}
                  style={[globalStyles.input, error && globalStyles.inputError]}
                  secureTextEntry
                  textContentType="newPassword"
                  returnKeyType="next"
                  editable={!loading}
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              <View style={globalStyles.section}>
                <Text style={globalStyles.label}>Confirmar nueva contraseña</Text>
                <TextInput
                  placeholder="Repetí la nueva contraseña"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setError("");
                  }}
                  style={[globalStyles.input, error && globalStyles.inputError]}
                  secureTextEntry
                  textContentType="newPassword"
                  returnKeyType="done"
                  onSubmitEditing={onChangePassword}
                  editable={!loading}
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              <Pressable 
                style={({ pressed }) => [
                  globalStyles.primaryButton,
                  pressed && !loading && globalStyles.buttonPressed,
                  loading && globalStyles.buttonDisabled,
                  { marginTop: 24 }
                ]} 
                onPress={onChangePassword} 
                disabled={loading}
              >
                <Text style={globalStyles.primaryButtonText}>
                  {loading ? "Cambiando contraseña..." : "Cambiar Contraseña"}
                </Text>
              </Pressable>
            </View>

            {/* Info adicional */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color={colors.info} />
              <Text style={styles.infoText}>
                Asegurate de recordar tu nueva contraseña. La usarás para iniciar sesión en el futuro.
              </Text>
            </View>
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
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: { 
    fontSize: 14, 
    color: colors.textSecondary,
    lineHeight: 20,
  },
  form: { 
    width: "100%",
    marginTop: 8,
  },
  infoBox: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    marginTop: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#1E40AF",
    lineHeight: 20,
  },
});