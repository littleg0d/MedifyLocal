import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Platform, View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../src/lib/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { globalStyles, colors } from "../../assets/styles";
import { Picker } from "@react-native-picker/picker";
import { PROVINCIAS, OBRAS_SOCIALES } from "../../src/constants/argentina";

export default function Perfil() {
  // Datos EDITABLES
  const [addressData, setAddressData] = useState({
    street: "",
    city: "",
    province: "Seleccioná tu provincia",
    postalCode: "",
  });

  const [obraSocialData, setObraSocialData] = useState({
    name: "Seleccioná tu obra social",
    number: "",
  });

  const [phone, setPhone] = useState("");

  // Datos READ-ONLY 
  const [readOnlyData, setReadOnlyData] = useState({
    firstName: "",
    lastName: "",
    dni: "",
    birthDate: "",
  });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Datos READ-ONLY
        setReadOnlyData({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          dni: data.dni || "",
          birthDate: data.birthDate || "",
        });

        // Datos EDITABLES
        setPhone(data.phone || "");

        setAddressData({
          street: data.address?.street || "",
          city: data.address?.city || "",
          province: data.address?.province || "Seleccioná tu provincia",
          postalCode: data.address?.postalCode || "",
        });

        setObraSocialData({
          name: data.obraSocial?.name || "Seleccioná tu obra social",
          number: data.obraSocial?.number || "",
        });
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
      Alert.alert("Error", "No pudimos cargar tus datos.");
    } finally {
      setLoading(false);
    }
  };

  const validateData = () => {
    if (addressData.province === "Seleccioná tu provincia") {
      Alert.alert("Error", "Por favor seleccioná una provincia");
      return false;
    }
    if (obraSocialData.name === "Seleccioná tu obra social") {
      Alert.alert("Error", "Por favor seleccioná una obra social");
      return false;
    }
    if (!obraSocialData.number.trim()) {
      Alert.alert("Error", "El número de afiliado es obligatorio");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateData()) return;

    try {
      setSaving(true);
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, "users", user.uid);
      
      // Solo actualizar campos EDITABLES
      await updateDoc(docRef, {
        phone: phone.trim(),
        address: {
          street: addressData.street.trim(),
          city: addressData.city.trim(),
          province: addressData.province,
          postalCode: addressData.postalCode.trim(),
        },
        obraSocial: {
          name: obraSocialData.name,
          number: obraSocialData.number.trim(),
        },
      });

      Alert.alert("¡Listo!", "Tus datos se guardaron correctamente");
    } catch (error) {
      console.error("Error al guardar:", error);
      Alert.alert("Error", "No pudimos guardar los cambios. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
        const performLogout = async () => {
        try {
        await signOut(auth);
      } 
      catch (error) {
        console.error("Error al cerrar sesion: ", error);
        Alert.alert("Error", "No pudimos cerrar sesión.");
    }
      };
    
    // Logica  para Web, Usar la confirmación  del navegador
      if (Platform.OS === "web") {
        const confirmed = window.confirm("¿Estás seguro que querés salir?");
        if (confirmed) {
          await performLogout();}
    // Si no se confirma, la función termina aquí.
        return;
        }
    
    // Logica para celular: Usar Alert.alert de React Native
        Alert.alert(
        "Cerrar Sesión",
        "¿Estás seguro que querés salir?",
        [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salir",
          style: "destructive",
          onPress: performLogout,
          },
    ]
  );

    };
      

 // Codigo anterior
  /*const handleLogout = async () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro que querés salir?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salir",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (error) {
              console.error("Error al cerrar sesión:", error);
              Alert.alert("Error", "No pudimos cerrar sesión.");
            }
          },
        },
      ]
    );
  };
*/
  if (loading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={globalStyles.loadingContainer}>
          <Text style={globalStyles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container} edges={["top"]}>
      <ScrollView style={globalStyles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Text style={globalStyles.title}>Mi Perfil</Text>
        </View>

        {/* Email (solo lectura) */}
        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Correo electrónico</Text>
          <View style={globalStyles.inputDisabled}>
            <Ionicons name="mail-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.inputText}>{auth.currentUser?.email}</Text>
          </View>
        </View>

        {/* Datos Personales (READ-ONLY) */}
        <Text style={styles.sectionTitle}>Datos Personales</Text>
        
        <View style={globalStyles.row}>
          <View style={[globalStyles.section, globalStyles.halfWidth]}>
            <Text style={globalStyles.label}>Nombre</Text>
            <View style={globalStyles.inputDisabled}>
              <Ionicons name="person-outline" size={20} color={colors.textTertiary} />
              <Text style={styles.inputText}>{readOnlyData.firstName || "No configurado"}</Text>
            </View>
          </View>

          <View style={[globalStyles.section, globalStyles.halfWidth]}>
            <Text style={globalStyles.label}>Apellido</Text>
            <View style={globalStyles.inputDisabled}>
              <Ionicons name="person-outline" size={20} color={colors.textTertiary} />
              <Text style={styles.inputText}>{readOnlyData.lastName || "No configurado"}</Text>
            </View>
          </View>
        </View>

        <View style={globalStyles.row}>
          <View style={[globalStyles.section, globalStyles.halfWidth]}>
            <Text style={globalStyles.label}>DNI</Text>
            <View style={globalStyles.inputDisabled}>
              <Ionicons name="card-outline" size={20} color={colors.textTertiary} />
              <Text style={styles.inputText}>{readOnlyData.dni || "No configurado"}</Text>
            </View>
          </View>

          <View style={[globalStyles.section, globalStyles.halfWidth]}>
            <Text style={globalStyles.label}>Fecha de Nacimiento</Text>
            <View style={globalStyles.inputDisabled}>
              <Ionicons name="calendar-outline" size={20} color={colors.textTertiary} />
              <Text style={styles.inputText}>{readOnlyData.birthDate || "No configurado"}</Text>
            </View>
          </View>
        </View>

        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Teléfono</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="11 1234-5678"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        {/* Dirección  */}
        <Text style={styles.sectionTitle}>Dirección</Text>

        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Calle y número</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="Av. Corrientes 1234"
            value={addressData.street}
            onChangeText={(text) => setAddressData({ ...addressData, street: text })}
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        <View style={globalStyles.row}>
          <View style={[globalStyles.section, globalStyles.halfWidth]}>
            <Text style={globalStyles.label}>Ciudad</Text>
            <TextInput
              style={globalStyles.input}
              placeholder="Buenos Aires"
              value={addressData.city}
              onChangeText={(text) => setAddressData({ ...addressData, city: text })}
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={[globalStyles.section, globalStyles.halfWidth]}>
            <Text style={globalStyles.label}>Código Postal</Text>
            <TextInput
              style={globalStyles.input}
              placeholder="1000"
              value={addressData.postalCode}
              onChangeText={(text) => setAddressData({ ...addressData, postalCode: text })}
              keyboardType="numeric"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </View>

        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Provincia *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={addressData.province}
              onValueChange={(value) => setAddressData({ ...addressData, province: value })}
              style={styles.picker}
            >
              {PROVINCIAS.map((provincia) => (
                <Picker.Item
                  key={provincia}
                  label={provincia}
                  value={provincia}
                  enabled={provincia !== "Seleccioná tu provincia"}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Obra Social*/}
        <Text style={styles.sectionTitle}>Obra Social</Text>

        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Obra Social *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={obraSocialData.name}
              onValueChange={(value) => setObraSocialData({ ...obraSocialData, name: value })}
              style={styles.picker}
            >
              {OBRAS_SOCIALES.map((obra) => (
                <Picker.Item
                  key={obra}
                  label={obra}
                  value={obra}
                  enabled={obra !== "Seleccioná tu obra social"}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Número de afiliado *</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="123456789"
            value={obraSocialData.number}
            onChangeText={(text) => setObraSocialData({ ...obraSocialData, number: text })}
            keyboardType="numeric"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        {/* Botón Guardar */}
        <Pressable
          style={({ pressed }) => [
            globalStyles.primaryButton,
            pressed && globalStyles.buttonPressed,
            saving && globalStyles.buttonDisabled,
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={globalStyles.primaryButtonText}>
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Text>
        </Pressable>

        <View style={{ marginTop: 16 }} />

        {/* Botón Cerrar Sesión */}
        <Pressable
          style={({ pressed }) => [
            globalStyles.dangerButton,
            pressed && globalStyles.buttonPressed,
          ]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={globalStyles.dangerButtonText}>Cerrar Sesión</Text>
        </Pressable>

        <View style={globalStyles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: 24,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 12,
  },
  inputText: {
    fontSize: 16,
    color: colors.textSecondary,
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
    color: colors.textPrimary,
  },
});