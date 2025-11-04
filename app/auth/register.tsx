import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
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
import { Picker } from "@react-native-picker/picker";
import { auth, db } from "../../src/lib/firebase";
import { globalStyles, colors } from "../../assets/styles";
import { PROVINCIAS, OBRAS_SOCIALES } from "../../src/constants/argentina";



export default function Register() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Datos básicos
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dni, setDni] = useState("");
  const [birthDate, setBirthDate] = useState("");

  // Dirección
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("Seleccioná tu provincia");
  const [postalCode, setPostalCode] = useState("");

  // Obra social
  const [obraSocial, setObraSocial] = useState("Seleccioná tu obra social");
  const [numeroObraSocial, setNumeroObraSocial] = useState("");

  // Función para formatear fecha automáticamente
  const handleDateChange = (text: string) => {
    // Solo permitir números y /
    let cleaned = text.replace(/[^\d]/g, '');
    
    // Formatear automáticamente
    if (cleaned.length >= 2) {
      cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    if (cleaned.length >= 5) {
      cleaned = cleaned.slice(0, 5) + '/' + cleaned.slice(5);
    }
    
    // Limitar a 10 caracteres (DD/MM/YYYY)
    setBirthDate(cleaned.slice(0, 10));
  };

  // Validar fecha real
  const validateDate = (dateString: string) => {
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(dateString)) {
      return false;
    }
    
    const [day, month, year] = dateString.split('/').map(Number);
    
    // Validar rangos básicos
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > new Date().getFullYear()) return false;
    
    // Validar fecha real
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  // Calcular edad
  const calculateAge = (dateString: string) => {
    const [day, month, year] = dateString.split('/').map(Number);
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const onRegister = async () => {
    // Validaciones obligatorias
    if (!email.trim()) {
      Alert.alert("Error", "Ingresá tu email");
      return;
    }

    // Validar email con regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Error", "Email inválido");
      return;
    }

    if (!password || password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (!firstName.trim()) {
      Alert.alert("Error", "Ingresá tu nombre");
      return;
    }

    if (!lastName.trim()) {
      Alert.alert("Error", "Ingresá tu apellido");
      return;
    }

    // Validar DNI (7 u 8 dígitos)
    if (!dni.trim() || !/^\d{7,8}$/.test(dni.trim())) {
      Alert.alert("Error", "DNI inválido (debe tener 7 u 8 dígitos)");
      return;
    }

    if (!birthDate.trim()) {
      Alert.alert("Error", "Ingresá tu fecha de nacimiento");
      return;
    }

    // Validar fecha real
    if (!validateDate(birthDate)) {
      Alert.alert("Error", "Fecha de nacimiento inválida");
      return;
    }

    // Validar edad mínima (18 años)
    if (calculateAge(birthDate) < 18) {
      Alert.alert("Error", "Debés ser mayor de 18 años para registrarte");
      return;
    }

    if (!street.trim()) {
      Alert.alert("Error", "Ingresá tu dirección");
      return;
    }

    if (!city.trim()) {
      Alert.alert("Error", "Ingresá tu ciudad");
      return;
    }

    if (province === "Seleccioná tu provincia") {
      Alert.alert("Error", "Seleccioná tu provincia");
      return;
    }

    // Validar código postal (4 dígitos)
    if (!postalCode.trim() || !/^\d{4}$/.test(postalCode.trim())) {
      Alert.alert("Error", "Código postal inválido (debe tener 4 dígitos)");
      return;
    }

    if (obraSocial === "Seleccioná tu obra social") {
      Alert.alert("Error", "Seleccioná tu obra social");
      return;
    }

    if (!numeroObraSocial.trim()) {
      Alert.alert("Error", "Ingresá tu número de afiliado");
      return;
    }

    try {
      setLoading(true);

      // Crear cuenta
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      // Actualizar displayName
      await updateProfile(userCredential.user, {
        displayName: `${firstName.trim()} ${lastName.trim()}`,  // ✅ Completo
      });

      // Guardar en Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: email.trim(),
        displayName: `${firstName.trim()} ${lastName.trim()}`,
        role: "patient",
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dni: dni.trim(),
        birthDate: birthDate.trim(),
        address: {
          street: street.trim(),
          city: city.trim(),
          province: province,
          postalCode: postalCode.trim(),
        },
        obraSocial: {
          name: obraSocial,
          number: numeroObraSocial.trim(),
        },
        createdAt: serverTimestamp(),
      });

      Alert.alert("¡Listo!", "Tu cuenta fue creada", [
        { text: "Continuar", onPress: () => router.replace("/(tabs)") }
      ]);

    } catch (e: any) {
      let msg = "No pudimos crear tu cuenta";
      if (e?.code?.includes("email-already-in-use")) msg = "Este email ya está registrado";
      if (e?.code?.includes("weak-password")) msg = "Contraseña muy débil";
      Alert.alert("Error", msg);
      console.error(e);
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
          {/* Header */}
          <View style={styles.logoWrap}>
            <Ionicons name="medkit-outline" size={28} color={colors.primaryDark} />
          </View>
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={globalStyles.subtitle}>Completá tus datos para registrarte</Text>

          {/* Formulario */}
          <View style={styles.form}>
            {/* Cuenta */}
            <Text style={styles.sectionTitle}>Datos de acceso *</Text>
            
            <TextInput
              placeholder="Email *"
              value={email}
              onChangeText={setEmail}
              style={globalStyles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={colors.textTertiary}
            />

            <TextInput
              placeholder="Contraseña (mínimo 6 caracteres) *"
              value={password}
              onChangeText={setPassword}
              style={globalStyles.input}
              secureTextEntry
              placeholderTextColor={colors.textTertiary}
            />

            {/* Datos personales */}
            <Text style={styles.sectionTitle}>Datos personales *</Text>

            <View style={globalStyles.row}>
              <TextInput
                placeholder="Nombre *"
                value={firstName}
                onChangeText={setFirstName}
                style={[globalStyles.input, globalStyles.halfWidth]}
                placeholderTextColor={colors.textTertiary}
              />
              <TextInput
                placeholder="Apellido *"
                value={lastName}
                onChangeText={setLastName}
                style={[globalStyles.input, globalStyles.halfWidth]}
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={globalStyles.row}>
              <TextInput
                placeholder="DNI *"
                value={dni}
                onChangeText={setDni}
                style={[globalStyles.input, globalStyles.halfWidth]}
                keyboardType="numeric"
                maxLength={8}
                placeholderTextColor={colors.textTertiary}
              />
              <TextInput
                placeholder="Fecha nac. DD/MM/AAAA *"
                value={birthDate}
                onChangeText={handleDateChange}
                style={[globalStyles.input, globalStyles.halfWidth]}
                keyboardType="numeric"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* Dirección */}
            <Text style={styles.sectionTitle}>Dirección *</Text>

            <TextInput
              placeholder="Calle y número *"
              value={street}
              onChangeText={setStreet}
              style={globalStyles.input}
              placeholderTextColor={colors.textTertiary}
            />

            <View style={globalStyles.row}>
              <TextInput
                placeholder="Ciudad *"
                value={city}
                onChangeText={setCity}
                style={[globalStyles.input, globalStyles.halfWidth]}
                placeholderTextColor={colors.textTertiary}
              />
              <TextInput
                placeholder="Código Postal *"
                value={postalCode}
                onChangeText={setPostalCode}
                style={[globalStyles.input, globalStyles.halfWidth]}
                keyboardType="numeric"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={province}
                onValueChange={setProvince}
                style={styles.picker}
              >
                {PROVINCIAS.map((p) => (
                  <Picker.Item 
                    key={p} 
                    label={p} 
                    value={p}
                    enabled={p !== "Seleccioná tu provincia"}
                  />
                ))}
              </Picker>
            </View>

            {/* Obra social */}
            <Text style={styles.sectionTitle}>Obra Social *</Text>

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={obraSocial}
                onValueChange={setObraSocial}
                style={styles.picker}
              >
                {OBRAS_SOCIALES.map((o) => (
                  <Picker.Item 
                    key={o} 
                    label={o} 
                    value={o}
                    enabled={o !== "Seleccioná tu obra social"}
                  />
                ))}
              </Picker>
            </View>

            <TextInput
              placeholder="Número de afiliado *"
              value={numeroObraSocial}
              onChangeText={setNumeroObraSocial}
              style={globalStyles.input}
              keyboardType="numeric"
              placeholderTextColor={colors.textTertiary}
            />

            {/* Botón registrar */}
            <Pressable
              style={({ pressed }) => [
                globalStyles.primaryButton,
                pressed && globalStyles.buttonPressed,
                loading && globalStyles.buttonDisabled,
                { marginTop: 24 }
              ]}
              onPress={onRegister}
              disabled={loading}
            >
              <Text style={globalStyles.primaryButtonText}>
                {loading ? "Creando cuenta..." : "Crear cuenta"}
              </Text>
            </Pressable>

            {/* Link login */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>¿Ya tenés cuenta? </Text>
              <Link href="/auth/login" asChild>
                <Pressable>
                  <Text style={styles.link}>Iniciar sesión</Text>
                </Pressable>
              </Link>
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
    backgroundColor: colors.surface,
  },
  container: {
    padding: 20,
    alignItems: "center",
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  form: {
    width: "100%",
    gap: 12,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 4,
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  loginContainer: {
    flexDirection: "row",
    marginTop: 20,
    marginBottom: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loginText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  link: {
    color: colors.primaryDark,
    fontWeight: "600",
    fontSize: 14,
  },
});