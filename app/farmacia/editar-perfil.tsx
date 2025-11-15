// app/farmacia/editar-perfil.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../src/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { globalStyles, colors } from "../../assets/styles";

interface FarmaciaData {
  id: string;
  email?: string;
  nombreComercial?: string;
  direccion?: string;
  telefono?: string;
  horario?: string;
}

export default function EditarPerfilFarmacia() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [farmaciaId, setFarmaciaId] = useState<string>("");
  
  // Campos editables
  const [nombreComercial, setNombreComercial] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [horario, setHorario] = useState("");
  
  // Campo no editable
  const [email, setEmail] = useState("");

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/farmacia");
    }
  };

  useEffect(() => {
    loadFarmacia();
  }, []);

  const loadFarmacia = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const farmaciaRef = doc(db, "farmacias", user.uid);
      const farmaciaSnap = await getDoc(farmaciaRef);

      if (farmaciaSnap.exists()) {
        const data = farmaciaSnap.data();
        setFarmaciaId(farmaciaSnap.id);
        setEmail(data.email || user.email || "");
        setNombreComercial(data.nombreComercial || "");
        setDireccion(data.direccion || "");
        setTelefono(data.telefono || "");
        setHorario(data.horario || "");
      } else {
        Alert.alert("Error", "No se encontró la farmacia");
        handleBack();
      }
    } catch (error) {
      console.error("Error cargando farmacia:", error);
      Alert.alert("Error", "No se pudieron cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async () => {
    // Validaciones
    if (!nombreComercial.trim()) {
      Alert.alert("Error", "El nombre comercial es requerido");
      return;
    }

    if (!telefono.trim()) {
      Alert.alert("Error", "El teléfono es requerido");
      return;
    }

    if (!direccion.trim()) {
      Alert.alert("Error", "La dirección es requerida");
      return;
    }

    if (!horario.trim()) {
      Alert.alert("Error", "El horario es requerido");
      return;
    }

    try {
      setSubmitting(true);

      const farmaciaRef = doc(db, "farmacias", farmaciaId);
      await updateDoc(farmaciaRef, {
        nombreComercial: nombreComercial.trim(),
        direccion: direccion.trim(),
        telefono: telefono.trim(),
        horario: horario.trim(),
      });

      Alert.alert("Éxito", "Perfil actualizado correctamente", [
        {
          text: "OK",
          onPress: handleBack,
        },
      ]);
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      Alert.alert("Error", "No se pudo actualizar el perfil");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={styles.header}>
          <Pressable onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Editar Perfil</Text>
        </View>
        <View style={styles.centerRow}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Editar Perfil</Text>
      </View>

      <ScrollView
        style={globalStyles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Email (no editable) */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Email</Text>
          <View style={[styles.inputDisabled]}>
            <Ionicons name="mail-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.disabledText}>{email}</Text>
          </View>
          <Text style={styles.hint}>El email no se puede modificar</Text>
        </View>

        {/* Nombre Comercial */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Nombre Comercial *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="business-outline" size={20} color={colors.textTertiary} />
            <TextInput
              style={styles.input}
              value={nombreComercial}
              onChangeText={setNombreComercial}
              placeholder="Ej: Farmacia Central"
              placeholderTextColor={colors.textTertiary}
              editable={!submitting}
            />
          </View>
        </View>

        {/* Teléfono */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Teléfono *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="call-outline" size={20} color={colors.textTertiary} />
            <TextInput
              style={styles.input}
              value={telefono}
              onChangeText={setTelefono}
              placeholder="Ej: 011 1234-5678"
              placeholderTextColor={colors.textTertiary}
              keyboardType="phone-pad"
              editable={!submitting}
            />
          </View>
        </View>

        {/* Dirección */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Dirección *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="location-outline" size={20} color={colors.textTertiary} />
            <TextInput
              style={styles.input}
              value={direccion}
              onChangeText={setDireccion}
              placeholder="Ej: Av. Corrientes 1234, CABA"
              placeholderTextColor={colors.textTertiary}
              editable={!submitting}
            />
          </View>
        </View>

        {/* Horario */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Horario *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="time-outline" size={20} color={colors.textTertiary} />
            <TextInput
              style={styles.input}
              value={horario}
              onChangeText={setHorario}
              placeholder="Ej: 8:00 a 20:00"
              placeholderTextColor={colors.textTertiary}
              editable={!submitting}
            />
          </View>
          <Text style={styles.hint}>Formato: 8:00 a 12:00</Text>
        </View>

        {/* Botón Guardar */}
        <Pressable
          style={({ pressed }) => [
            globalStyles.primaryButton,
            pressed && globalStyles.buttonPressed,
            submitting && globalStyles.buttonDisabled,
            styles.guardarButton,
          ]}
          onPress={handleGuardar}
          disabled={submitting}
        >
          <Text style={globalStyles.primaryButtonText}>
            {submitting ? "Guardando..." : "Guardar Cambios"}
          </Text>
        </Pressable>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  centerRow: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputDisabled: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  disabledText: {
    flex: 1,
    fontSize: 15,
    color: colors.textTertiary,
  },
  hint: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
  guardarButton: {
    marginTop: 8,
  },
});