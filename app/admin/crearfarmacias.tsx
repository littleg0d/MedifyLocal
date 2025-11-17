import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Libs
import { auth } from "../../src/lib/firebase";
import { globalStyles, colors } from "../../assets/styles";

// Config
import { API_URL } from "../../src/config/apiConfig";

export default function CrearFarmacia() {
  const router = useRouter();

  // Component State
  const [nombreComercial, setNombreComercial] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [horario, setHorario] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * Validar campos del formulario
   */
  const validar = () => {
    if (!nombreComercial.trim()) return "Ingresa el nombre comercial";
    if (!email.trim()) return "Ingresa el email";
    if (!password.trim() || password.length < 6)
      return "La contrasena debe tener al menos 6 caracteres";
    if (!direccion.trim()) return "Ingresa la direccion";
    return null;
  };

  /**
   * Handler para crear la farmacia
   */
  const handleCrear = async () => {
    // 1. Validacion
    const errorValidacion = validar();
    if (errorValidacion) {
      console.warn("[handleCrear] Error de validacion:", errorValidacion); // ✅ Validación
      if (Platform.OS === 'web') window.alert(errorValidacion);
      else Alert.alert("Error", errorValidacion);
      return;
    }

    setLoading(true);

    try {
      // 2. Obtener token de admin
      const adminUser = auth.currentUser;
      if (!adminUser) {
        throw new Error("No hay un administrador autenticado");
      }
      const token = await adminUser.getIdToken(); // ✅ Firebase Interaction
      
      // 3. Payload para el API
      const farmaciaData = {
        nombreComercial: nombreComercial.trim(),
        email: email.trim(),
        password: password,
        telefono: telefono.trim() || null,
        direccion: direccion.trim(),
        horario: horario.trim() || null,
      };

      // 4. POST al backend
      const response = await fetch(`${API_URL}/api/farmacias/crear`, { // ✅ API Request
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(farmaciaData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log(" ❌❌❌❌ [handleCrear] Error del response.ok:", errorData); // ✅ API Error
        throw new Error(errorData.error || `Error del backend: ${response.status}`);
      }

      // 5. Exito
      
      if (Platform.OS === 'web') {
        window.alert(`✅ Farmacia "${nombreComercial}" creada correctamente.`);
        router.back();
      } else {
        Alert.alert(
          "✅ Exito",
          `Farmacia "${nombreComercial}" creada correctamente.`,
          [{ text: "Volver al listado", onPress: () => router.back() }]
        );
      }

    } catch (e: any) {
      console.log(" ❌❌❌❌ [handleCrear] Error en catch:", e); // ✅ General Error
      let errorMessage = e.message || "No se pudo crear la farmacia.";

      // Manejo de errores especificos
      if (e.message.includes("EMAIL_ALREADY_EXISTS") || e.message.includes("email ya esta registrado")) {
         errorMessage = "Este email ya esta registrado.";
      }
     
      if (Platform.OS === 'web') {
        window.alert(`Error: ${errorMessage}`);
      } else {
        Alert.alert("Error", errorMessage);
      }
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

        {/* Nombre Comercial */}
        <View style={styles.section}>
          <Text style={globalStyles.label}>Nombre Comercial *</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="Ej: Farmacia Central"
            value={nombreComercial}
            onChangeText={setNombreComercial}
            placeholderTextColor={colors.textTertiary}
            editable={!loading}
          />
        </View>

        {/* Email */}
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
            editable={!loading}
          />
        </View>

        {/* Contrasena */}
        <View style={styles.section}>
          <Text style={globalStyles.label}>Contrasena *</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="Minimo 6 caracteres"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={colors.textTertiary}
            editable={!loading}
          />
        </View>

        {/* Telefono */}
        <View style={styles.section}>
          <Text style={globalStyles.label}>Telefono</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="11 1234-5678"
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
            placeholderTextColor={colors.textTertiary}
            editable={!loading}
          />
        </View>

        {/* Direccion */}
        <View style={styles.section}>
          <Text style={globalStyles.label}>Direccion *</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="Av. Siempre Viva 742"
            value={direccion}
            onChangeText={setDireccion}
            placeholderTextColor={colors.textTertiary}
            editable={!loading}
          />
        </View>

        {/* Horario */}
        <View style={styles.section}>
          <Text style={globalStyles.label}>Horario</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="8:00 a 20:00"
            value={horario}
            onChangeText={setHorario}
            placeholderTextColor={colors.textTertiary}
            editable={!loading}
          />
        </View>

        {/* Boton: Crear */}
        <Pressable
          style={({ pressed }) => [
            globalStyles.primaryButton,
            pressed && !loading && globalStyles.buttonPressed,
            loading && globalStyles.buttonDisabled,
          ]}
          onPress={handleCrear}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator size="small" color="white" />
              <Text style={[globalStyles.primaryButtonText, { marginLeft: 8 }]}>
                Creando...
              </Text>
            </View>
          ) : (
            <Text style={globalStyles.primaryButtonText}>Crear Farmacia</Text>
          )}
        </Pressable>

        {/* Boton: Cancelar */}
        <Pressable
          style={({ pressed }) => [
            styles.secondaryBtn,
            pressed && !loading && globalStyles.buttonPressed,
            loading && globalStyles.buttonDisabled,
          ]}
          onPress={() => router.back()}
          disabled={loading}
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
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E3F2FD",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#90CAF9",
    marginBottom: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  section: { gap: 6 },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
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