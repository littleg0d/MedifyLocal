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
  const [loading, setLoading] = useState(true); // Spinner de carga inicial
  const [submitting, setSubmitting] = useState(false); // Spinner de guardado
  const [farmaciaId, setFarmaciaId] = useState<string>("");
  
  // Campos editables
  const [nombreComercial, setNombreComercial] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [horario, setHorario] = useState("");
  
  // Campo no editable
  const [email, setEmail] = useState("");

  console.log("[EditarPerfilFarmacia] Renderizando...");

  // Navegacion de vuelta
  const handleBack = () => {
    console.log("[handleBack] Volviendo a pantalla anterior.");
    if (router.canGoBack()) {
      router.back();
    } else {
      console.log("[handleBack] No se puede 'back', reemplazando a /farmacia");
      router.replace("/farmacia");
    }
  };

  // Carga inicial de datos
  useEffect(() => {
    console.log("[useEffect] Montando. Llamando a loadFarmacia...");
    loadFarmacia();
  }, []);

  const loadFarmacia = async () => {
    console.log("[loadFarmacia] Cargando datos de farmacia...");
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log("[loadFarmacia] No hay usuario, redirigiendo a login.");
        router.replace("/auth/login");
        return;
      }

      console.log(`[loadFarmacia] Buscando doc /farmacias/${user.uid}`);
      const farmaciaRef = doc(db, "farmacias", user.uid);
      const farmaciaSnap = await getDoc(farmaciaRef);

      if (farmaciaSnap.exists()) {
        console.log("[loadFarmacia] Doc encontrado. Seteando datos.");
        const data = farmaciaSnap.data();
        setFarmaciaId(farmaciaSnap.id);
        setEmail(data.email || user.email || "");
        setNombreComercial(data.nombreComercial || "");
        setDireccion(data.direccion || "");
        setTelefono(data.telefono || "");
        setHorario(data.horario || "");
      } else {
        console.log("[loadFarmacia] Error: Doc de farmacia no existe.");
        Alert.alert("Error", "No se encontró la farmacia");
        handleBack();
      }
    } catch (error) {
      console.log(" ❌❌❌ Error cargando farmacia:", error);
      Alert.alert("Error", "No se pudieron cargar los datos");
    } finally {
      console.log("[loadFarmacia] Fin (finally). setLoading(false)");
      setLoading(false);
    }
  };

  // Guardar cambios
  const handleGuardar = async () => {
    console.log("[handleGuardar] Iniciando guardado...");

    // Validaciones
    if (!nombreComercial.trim()) {
      console.log("[handleGuardar] Validacion: Nombre comercial vacio.");
      Alert.alert("Error", "El nombre comercial es requerido");
      return;
    }

    if (!telefono.trim()) {
      console.log("[handleGuardar] Validacion: Telefono vacio.");
      Alert.alert("Error", "El teléfono es requerido");
      return;
    }

    if (!direccion.trim()) {
      console.log("[handleGuardar] Validacion: Direccion vacia.");
      Alert.alert("Error", "La dirección es requerida");
      return;
    }

    if (!horario.trim()) {
      console.log("[handleGuardar] Validacion: Horario vacio.");
      Alert.alert("Error", "El horario es requerido");
      return;
    }

    console.log("[handleGuardar] Validaciones OK. Iniciando 'try' block...");
    
    try {
      setSubmitting(true);

      const farmaciaRef = doc(db, "farmacias", farmaciaId);
      const datosAGuardar = {
        nombreComercial: nombreComercial.trim(),
        direccion: direccion.trim(),
        telefono: telefono.trim(),
        horario: horario.trim(),
      };

      console.log(`[handleGuardar] Actualizando doc ${farmaciaId} con:`, datosAGuardar);
      await updateDoc(farmaciaRef, datosAGuardar);

      console.log("[handleGuardar] Exito. Perfil actualizado.");
      Alert.alert("Éxito", "Perfil actualizado correctamente", [
        {
          text: "OK",
          onPress: handleBack, // Volver atras al confirmar
        },
      ]);
    } catch (error) {
      console.log(" ❌❌❌ Error actualizando perfil:", error);
      Alert.alert("Error", "No se pudo actualizar el perfil");
    } finally {
      console.log("[handleGuardar] Fin (finally). setSubmitting(false)");
      setSubmitting(false);
    }
  };

  // Render de carga inicial
  if (loading) {
    console.log("[Render] Estado: Cargando (loading=true)");
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

  // Render del formulario
  console.log(`[Render] Estado: Formulario (loading=false, submitting=${submitting})`);
  return (
    <SafeAreaView style={globalStyles.container} edges={["top", "bottom"]}>
      {/* Header */}
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

        {/* Telefono */}
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

        {/* Direccion */}
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

        {/* Boton Guardar */}
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

// (Los estilos son identicos, no se tocan)
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
    paddingHorizontal: 20, // Agregado para alinear con el header
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
    backgroundColor: colors.background, // Un fondo mas "deshabilitado"
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
    marginHorizontal: 20, // Agregado para alinear
  },
});