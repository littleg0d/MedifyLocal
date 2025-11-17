import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput, 
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../src/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { globalStyles, colors } from "../../assets/styles";


interface FarmaciaData {
  email: string; 
  nombreComercial: string;
  telefono: string;
  direccion: string;
  horario: string;
}

export default function EditarPerfilFarmacia() {
  const router = useRouter();
  const [data, setData] = useState<FarmaciaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Cargar los datos actuales de la farmacia
    const user = auth.currentUser;
    if (user) {
      // Usamos user.email del Auth como fuente para el campo de solo lectura
      loadFarmacia(user.uid, user.email || ""); 
    } else {
      router.back(); 
    }
  }, []);

  const loadFarmacia = async (uid: string, userEmail: string) => {
    try {
      const farmaciaRef = doc(db, "farmacias", uid);
      const farmaciaSnap = await getDoc(farmaciaRef);

      let farmaciaData: FarmaciaData;

      if (farmaciaSnap.exists()) {
        const firestoreData = farmaciaSnap.data();
        farmaciaData = {
          email: userEmail, // Email siempre del Auth (lectura)
          nombreComercial: firestoreData.nombreComercial || "",
          telefono: firestoreData.telefono || "",
          direccion: firestoreData.direccion || "",
          horario: firestoreData.horario || "",
        };
      } else {
         farmaciaData = {
            email: userEmail,
            nombreComercial: "",
            telefono: "",
            direccion: "",
            horario: "",
        };
      }

      setData(farmaciaData);

    } catch (error) {
      console.error("❌ Error cargando datos para editar:", error); // ✅ Error
      Alert.alert("Error", "No se pudieron cargar los datos actuales.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!data || !auth.currentUser) return;

    if (!data.nombreComercial.trim() || !data.direccion.trim()) {
        console.warn("Validacion: Campos requeridos vacios."); // ✅ Validación
        Alert.alert("Campos requeridos", "El Nombre Comercial y la Dirección son obligatorios.");
        return;
    }

    setIsSaving(true);
    try {
      const farmaciaRef = doc(db, "farmacias", auth.currentUser.uid);
      
      // Creamos un objeto con los datos a actualizar, EXCLUYENDO el email.
      const dataToUpdate = {
        nombreComercial: data.nombreComercial,
        telefono: data.telefono,
        direccion: data.direccion,
        horario: data.horario,
      };

      await updateDoc(farmaciaRef, dataToUpdate); // ✅ Firebase Interaction
      
      Alert.alert("Éxito", "Perfil actualizado correctamente.");
      router.back(); 
      
    } catch (error) {
      console.error("❌ Error al guardar datos:", error); // ✅ Error
      Alert.alert("Error", "No se pudo guardar la información.");
    } finally {
      setIsSaving(false);
    }
  };
  
  // La función de cambio solo acepta campos editables
  const handleChange = (field: Exclude<keyof FarmaciaData, 'email'>, value: string) => {
    setData(prev => (prev ? { ...prev, [field]: value } : null));
  };


  if (loading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={stylesModal.centerRow}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={stylesModal.loadingText}>Cargando datos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={stylesModal.header}>
        <Text style={stylesModal.title}>Editar Perfil</Text>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close-circle-outline" size={30} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView style={globalStyles.scrollView} contentContainerStyle={stylesModal.scrollContent}>
        
        {/* ------------------------------------- */}
        {/* Email - SOLO LECTURA (NO EDITABLE)    */}
        {/* ------------------------------------- */}
        <View style={stylesModal.inputGroup}>
            <Text style={stylesModal.labelReadOnly}>Email (no editable)</Text>
            <View style={stylesModal.readOnlyInput}> 
                <Text style={stylesModal.readOnlyText}>{data?.email}</Text>
            </View>
        </View>
        
        {/* Campo Nombre Comercial */}
        <View style={stylesModal.inputGroup}>
          <Text style={stylesModal.label}>Nombre Comercial</Text>
          <TextInput
            style={stylesModal.input}
            value={data?.nombreComercial}
            onChangeText={(text) => handleChange('nombreComercial', text)}
            placeholder="Nombre de la farmacia"
          />
        </View>

        {/* Campo Teléfono */}
        <View style={stylesModal.inputGroup}>
          <Text style={stylesModal.label}>Teléfono</Text>
          <TextInput
            style={stylesModal.input}
            value={data?.telefono}
            onChangeText={(text) => handleChange('telefono', text)}
            placeholder="Ej: 1123456789"
            keyboardType="phone-pad"
          />
        </View>
        
        {/* Campo Dirección */}
        <View style={stylesModal.inputGroup}>
          <Text style={stylesModal.label}>Dirección</Text>
          <TextInput
            style={stylesModal.input}
            value={data?.direccion}
            onChangeText={(text) => handleChange('direccion', text)}
            placeholder="Calle, número, localidad"
          />
        </View>
        
        {/* Campo Horario */}
        <View style={stylesModal.inputGroup}>
          <Text style={stylesModal.label}>Horario de Atención</Text>
          <TextInput
            style={stylesModal.input}
            value={data?.horario}
            onChangeText={(text) => handleChange('horario', text)}
            placeholder="Ej: Lunes a Viernes 8:00 - 18:00"
          />
        </View>
        
        <View style={{ height: 20 }} /> 
        
        {/* Botón de Guardar */}
        <Pressable
            style={({ pressed }) => [
              stylesModal.saveButton,
              pressed && { opacity: 0.8 },
              isSaving && { backgroundColor: colors.textTertiary }
            ]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={stylesModal.saveButtonText}>Guardar Cambios</Text>
            )}
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}


const stylesModal = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  labelReadOnly: { // Etiqueta para el campo no editable
    fontSize: 14,
    fontWeight: "600",
    color: colors.textTertiary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  // Estilos para campo de SOLO LECTURA
  readOnlyInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.background, // Color de fondo para indicar que está deshabilitado
  },
  readOnlyText: {
    fontSize: 16,
    color: colors.textTertiary, // Color de texto para indicar que es solo lectura
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  centerRow: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8, 
  },
  loadingText: {
    color: colors.textSecondary,
  },
});