import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc, collection, addDoc } from "firebase/firestore";
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

  // Datos basicos
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dni, setDni] = useState("");
  const [birthDate, setBirthDate] = useState("");

  // Direccion
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("Seleccioná tu provincia");
  const [postalCode, setPostalCode] = useState("");
  const [addressAlias, setAddressAlias] = useState("Casa");

  // Obra social
  const [obraSocial, setObraSocial] = useState("Seleccioná tu obra social");
  const [numeroObraSocial, setNumeroObraSocial] = useState("");

  const debeIngresarNumero = obraSocial !== "Seleccioná tu obra social" && obraSocial !== "Sin obra social";

  // Helper: Formateo automatico de fecha
  const handleDateChange = (text: string) => {
    let cleaned = text.replace(/[^\d]/g, '');
    
    if (cleaned.length >= 2) {
      cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    if (cleaned.length >= 5) {
      cleaned = cleaned.slice(0, 5) + '/' + cleaned.slice(5);
    }
    
    setBirthDate(cleaned.slice(0, 10));
  };

  // Helper: Validacion de fecha real
  const validateDate = (dateString: string) => {
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(dateString)) {
      return false;
    }
    
    const [day, month, year] = dateString.split('/').map(Number);
    
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > new Date().getFullYear()) return false;
    
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  // Helper: Calcular edad
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

  // Handler para obra social
  const handleObraSocialChange = (value: string) => {
    setObraSocial(value);
    if (value === "Sin obra social") {
      setNumeroObraSocial("");
    }
  };

  // Logica de registro
  const onRegister = async () => {
    
    // --- VALIDACIONES ---
    if (!email.trim()) {
      Alert.alert("Error", "Ingresá tu email");
      return;
    }

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

    if (!dni.trim() || !/^\d{7,8}$/.test(dni.trim())) {
      Alert.alert("Error", "DNI inválido (debe tener 7 u 8 dígitos)");
      return;
    }

    if (!birthDate.trim()) {
      Alert.alert("Error", "Ingresá tu fecha de nacimiento");
      return;
    }

    if (!validateDate(birthDate)) {
      Alert.alert("Error", "Fecha de nacimiento inválida");
      return;
    }

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

    if (!postalCode.trim() || !/^\d{4}$/.test(postalCode.trim())) {
      Alert.alert("Error", "Código postal inválido (debe tener 4 dígitos)");
      return;
    }

    if (obraSocial === "Seleccioná tu obra social") {
      Alert.alert("Error", "Seleccioná tu obra social o 'Sin obra social'");
      return;
    }

    if (debeIngresarNumero && !numeroObraSocial.trim()) {
      Alert.alert("Error", "Ingresá tu número de afiliado");
      return;
    }

    // --- PROCESO DE CREACION ---
    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      await updateProfile(userCredential.user, {
        displayName: `${firstName.trim()} ${lastName.trim()}`,
      });

      const userData: any = {
        email: email.trim(),
        displayName: `${firstName.trim()} ${lastName.trim()}`,
        role: "patient",
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dni: dni.trim(),
        birthDate: birthDate.trim(),
        createdAt: serverTimestamp(),
      };

      if (obraSocial !== "Sin obra social") {
        userData.obraSocial = {
          name: obraSocial,
          number: numeroObraSocial.trim(),
        };
      }

      await setDoc(doc(db, "users", userCredential.user.uid), userData);

      const addressesRef = collection(db, "users", userCredential.user.uid, "addresses");
      await addDoc(addressesRef, {
        street: street.trim(),
        city: city.trim(),
        province: province,
        postalCode: postalCode.trim(),
        alias: addressAlias.trim() || "Casa",
        isDefault: true,
        fechaCreacion: serverTimestamp(),
      });

      Alert.alert("¡Listo!", "Tu cuenta fue creada", [
        { text: "Continuar", onPress: () => router.replace("/(tabs)") }
      ]);

    } catch (e: any) {
      let msg = "No pudimos crear tu cuenta";
      
      if (e?.code === "auth/email-already-in-use") {
        msg = "Este email ya está registrado";
      }
      if (e?.code === "auth/weak-password") {
        msg = "Contraseña muy débil";
      }
      
      Alert.alert("Error", msg);
      
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
              editable={!loading}
            />

            <TextInput
              placeholder="Contraseña (mínimo 6 caracteres) *"
              value={password}
              onChangeText={setPassword}
              style={globalStyles.input}
              secureTextEntry
              placeholderTextColor={colors.textTertiary}
              editable={!loading}
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
                editable={!loading}
              />
              <TextInput
                placeholder="Apellido *"
                value={lastName}
                onChangeText={setLastName}
                style={[globalStyles.input, globalStyles.halfWidth]}
                placeholderTextColor={colors.textTertiary}
                editable={!loading}
              />
            </View>

            {/* DNI en una línea completa */}
            <TextInput
              placeholder="DNI *"
              value={dni}
              onChangeText={setDni}
              style={globalStyles.input}
              keyboardType="numeric"
              maxLength={8}
              placeholderTextColor={colors.textTertiary}
              editable={!loading}
            />

            {/* Fecha de nacimiento en línea separada */}
            <TextInput
              placeholder="Fecha de nacimiento (DD/MM/AAAA) *"
              value={birthDate}
              onChangeText={handleDateChange}
              style={globalStyles.input}
              keyboardType="numeric"
              placeholderTextColor={colors.textTertiary}
              editable={!loading}
            />

            {/* Direccion */}
            <Text style={styles.sectionTitle}>Dirección *</Text>

            <TextInput
              placeholder="Alias (ej: Casa, Trabajo) *"
              value={addressAlias}
              onChangeText={setAddressAlias}
              style={globalStyles.input}
              placeholderTextColor={colors.textTertiary}
              editable={!loading}
            />

            <TextInput
              placeholder="Calle y número *"
              value={street}
              onChangeText={setStreet}
              style={globalStyles.input}
              placeholderTextColor={colors.textTertiary}
              editable={!loading}
            />

            <View style={globalStyles.row}>
              <TextInput
                placeholder="Ciudad *"
                value={city}
                onChangeText={setCity}
                style={[globalStyles.input, globalStyles.halfWidth]}
                placeholderTextColor={colors.textTertiary}
                editable={!loading}
              />
              <TextInput
                placeholder="Código Postal *"
                value={postalCode}
                onChangeText={setPostalCode}
                style={[globalStyles.input, globalStyles.halfWidth]}
                keyboardType="numeric"
                placeholderTextColor={colors.textTertiary}
                editable={!loading}
              />
            </View>

            <View style={[styles.pickerContainer, loading && styles.pickerDisabled]}>
              <Picker
                selectedValue={province}
                onValueChange={setProvince}
                style={styles.picker}
                enabled={!loading}
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

            <View style={[styles.pickerContainerTall, loading && styles.pickerDisabled]}>
              <Picker
                selectedValue={obraSocial}
                onValueChange={handleObraSocialChange}
                style={styles.pickerTall}
                enabled={!loading}
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
              placeholder={debeIngresarNumero ? "Número de afiliado *" : "No requerido"}
              value={numeroObraSocial}
              onChangeText={setNumeroObraSocial}
              style={[
                globalStyles.input,
                (!debeIngresarNumero || loading) && styles.inputDisabledStyle
              ]}
              keyboardType="numeric"
              placeholderTextColor={colors.textTertiary}
              editable={debeIngresarNumero && !loading}
            />

            {/* Boton registrar */}
            <Pressable
              style={({ pressed }) => [
                globalStyles.primaryButton,
                pressed && !loading && globalStyles.buttonPressed,
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
                <Pressable disabled={loading}>
                  <Text style={[styles.link, loading && { opacity: 0.5 }]}>
                    Iniciar sesión
                  </Text>
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
  // Picker normal (provincia)
  pickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
    height: 56,
    justifyContent: 'center',
  },
  picker: {
    height: 56,
  },
  // Picker más alto (obra social)
  pickerContainerTall: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
    height: 56,
    justifyContent: 'center',
  },
  pickerTall: {
    height: 56,
  },
  pickerDisabled: {
    opacity: 0.6,
  },
  inputDisabledStyle: {
    backgroundColor: colors.gray100,
    color: colors.textTertiary,
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