import { Ionicons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { Platform, View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { auth, db } from "../../src/lib/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { globalStyles, colors } from "../../assets/styles";
import { Picker } from "@react-native-picker/picker";
import { PROVINCIAS, OBRAS_SOCIALES } from "../../src/constants/argentina";
import { isAddressValid } from "../../src/lib/formatHelpers";
import { showError, showSuccess } from "../../src/components/common/tdhelper";

export default function Perfil() {
  const router = useRouter();
  const [addressData, setAddressData] = useState({
    street: "",
    city: "",
    province: "Selecciona tu provincia",
    postalCode: "",
  });

  const [obraSocialData, setObraSocialData] = useState({
    name: "Sin obra social",
    number: "",
  });

  const [phone, setPhone] = useState("");

  const [readOnlyData, setReadOnlyData] = useState({
    firstName: "",
    lastName: "",
    dni: "",
    birthDate: "",
  });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const debeIngresarNumero = 
    obraSocialData.name !== "Selecciona tu obra social" && 
    obraSocialData.name !== "Sin obra social";

  // Cargar datos cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      loadUserData();
      
      // Resetear datos cuando la pantalla pierde el foco
      return () => {
        setAddressData({
          street: "",
          city: "",
          province: "Selecciona tu provincia",
          postalCode: "",
        });
        setObraSocialData({
          name: "Sin obra social",
          number: "",
        });
        setPhone("");
        setReadOnlyData({
          firstName: "",
          lastName: "",
          dni: "",
          birthDate: "",
        });
      };
    }, [])
  );

  const loadUserData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        
        setReadOnlyData({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          dni: data.dni || "",
          birthDate: data.birthDate || "",
        });

        setPhone(data.phone || "");

        setAddressData({
          street: data.address?.street || "",
          city: data.address?.city || "",
          province: data.address?.province || "Selecciona tu provincia",
          postalCode: data.address?.postalCode || "",
        });

        setObraSocialData({
          name: data.obraSocial?.name || "Sin obra social",
          number: data.obraSocial?.number || "",
        });
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
      showError("No pudimos cargar tus datos. Intenta recargar la pagina.");
    } finally {
      setLoading(false);
    }
  };

  const validatePhone = (phone: string) => {
    if (!phone.trim()) return true;
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15;
  };

  const validatePostalCode = (code: string) => {
    const digits = code.replace(/\D/g, "");
    return digits.length === 4;
  };

  const validateStreet = (street: string) => {
    return street.trim().length >= 3;
  };

  const validateCity = (city: string) => {
    return city.trim().length >= 2;
  };

  const handleObraSocialChange = useCallback((value: string) => {
    if (value === "Sin obra social") {
      setObraSocialData({ name: value, number: "" });
    } else {
      setObraSocialData(prev => ({ ...prev, name: value }));
    }
  }, []);

  const validateData = useCallback(() => {
    if (!validateStreet(addressData.street)) {
      showError("La calle debe tener al menos 3 caracteres");
      return false;
    }

    if (!validateCity(addressData.city)) {
      showError("La ciudad debe tener al menos 2 caracteres");
      return false;
    }

    if (!isAddressValid(addressData)) {
      showError("La direccion esta incompleta");
      return false;
    }
    
    if (addressData.province === "Selecciona tu provincia") {
      showError("Por favor selecciona una provincia");
      return false;
    }

    if (!validatePostalCode(addressData.postalCode)) {
      showError("El codigo postal debe tener 4 digitos");
      return false;
    }

    if (phone.trim() && !validatePhone(phone)) {
      showError("El telefono debe tener entre 10 y 15 digitos");
      return false;
    }
    
    if (obraSocialData.name === "Selecciona tu obra social") {
      showError("Por favor selecciona una obra social o 'Sin obra social'");
      return false;
    }
    
    if (debeIngresarNumero && !obraSocialData.number.trim()) {
      showError("El numero de afiliado es obligatorio para la obra social seleccionada");
      return false;
    }
    
    return true;
  }, [addressData, obraSocialData, phone, debeIngresarNumero]);

  const handleSave = useCallback(async () => {
    if (!validateData()) return;

    try {
      setSaving(true);
      const user = auth.currentUser;
      if (!user) {
        showError("No se detecto una sesion activa. Por favor inicia sesion nuevamente.");
        return;
      }

      const docRef = doc(db, "users", user.uid);
      
      const updateData: any = {
        phone: phone.trim() || null,
        address: {
          street: addressData.street.trim(),
          city: addressData.city.trim(),
          province: addressData.province,
          postalCode: addressData.postalCode.trim(),
        },
      };

      if (obraSocialData.name === "Sin obra social") {
        updateData.obraSocial = null;
      } else {
        updateData.obraSocial = {
          name: obraSocialData.name,
          number: obraSocialData.number.trim(),
        };
      }

      await updateDoc(docRef, updateData);

      showSuccess("Tus datos se guardaron correctamente");
    } catch (error) {
      console.error("Error al guardar:", error);
      showError("No pudimos guardar los cambios. Intenta de nuevo en unos momentos.");
    } finally {
      setSaving(false);
    }
  }, [validateData, addressData, obraSocialData, phone]);

  const handleLogout = useCallback(async () => {
    const performLogout = async () => {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Error al cerrar sesion:", error);
        showError("No pudimos cerrar sesion. Intenta nuevamente.");
      }
    };
    
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Estas seguro que queres salir?");
      if (confirmed) {
        await performLogout();
      }
      return;
    }
    
    Alert.alert(
      "Cerrar Sesion",
      "Estas seguro que queres salir?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Salir", style: "destructive", onPress: performLogout },
      ]
    );
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={globalStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[globalStyles.loadingText, { marginTop: 12 }]}>Cargando...</Text>
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

        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Correo electronico</Text>
          <View style={[globalStyles.inputDisabled, styles.flexibleContainer]}>
            <Ionicons name="mail-outline" size={20} color={colors.textTertiary} style={styles.icon} />
            <Text style={styles.inputText} numberOfLines={1} ellipsizeMode="middle">
              {auth.currentUser?.email}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Datos Personales</Text>
        
        <View style={globalStyles.row}>
          <View style={[globalStyles.section, globalStyles.halfWidth]}>
            <Text style={globalStyles.label}>Nombre</Text>
            <View style={[globalStyles.inputDisabled, styles.flexibleContainer]}>
              <Ionicons name="person-outline" size={20} color={colors.textTertiary} style={styles.icon} />
              <Text style={styles.inputText} numberOfLines={1}>
                {readOnlyData.firstName || "No configurado"}
              </Text>
            </View>
          </View>

          <View style={[globalStyles.section, globalStyles.halfWidth]}>
            <Text style={globalStyles.label}>Apellido</Text>
            <View style={[globalStyles.inputDisabled, styles.flexibleContainer]}>
              <Ionicons name="person-outline" size={20} color={colors.textTertiary} style={styles.icon} />
              <Text style={styles.inputText} numberOfLines={1}>
                {readOnlyData.lastName || "No configurado"}
              </Text>
            </View>
          </View>
        </View>

        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>DNI</Text>
          <View style={[globalStyles.inputDisabled, styles.flexibleContainer]}>
            <Ionicons name="card-outline" size={20} color={colors.textTertiary} style={styles.icon} />
            <Text style={styles.inputTextFixed}>
              {readOnlyData.dni || "No configurado"}
            </Text>
          </View>
        </View>

        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Fecha de Nacimiento</Text>
          <View style={[globalStyles.inputDisabled, styles.flexibleContainer]}>
            <Ionicons name="calendar-outline" size={20} color={colors.textTertiary} style={styles.icon} />
            <Text style={styles.inputTextFixed}>
              {readOnlyData.birthDate || "No configurado"}
            </Text>
          </View>
        </View>

        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Telefono</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="11 1234-5678"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor={colors.textTertiary}
            editable={!saving}
          />
        </View>

        <Text style={styles.sectionTitle}>Direccion</Text>

        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Calle y numero *</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="Av. Corrientes 1234"
            value={addressData.street}
            onChangeText={(text) => setAddressData({ ...addressData, street: text })}
            placeholderTextColor={colors.textTertiary}
            editable={!saving}
          />
        </View>

        <View style={globalStyles.row}>
          <View style={[globalStyles.section, globalStyles.halfWidth]}>
            <Text style={globalStyles.label}>Ciudad *</Text>
            <TextInput
              style={globalStyles.input}
              placeholder="Buenos Aires"
              value={addressData.city}
              onChangeText={(text) => setAddressData({ ...addressData, city: text })}
              placeholderTextColor={colors.textTertiary}
              editable={!saving}
            />
          </View>

          <View style={[globalStyles.section, globalStyles.halfWidth]}>
            <Text style={globalStyles.label}>Codigo Postal *</Text>
            <TextInput
              style={globalStyles.input}
              placeholder="1000"
              value={addressData.postalCode}
              onChangeText={(text) => setAddressData({ ...addressData, postalCode: text })}
              keyboardType="numeric"
              placeholderTextColor={colors.textTertiary}
              maxLength={4}
              editable={!saving}
            />
          </View>
        </View>

        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Provincia *</Text>
          <View style={[styles.pickerContainer, saving && styles.pickerDisabled]}>
            <Picker
              selectedValue={addressData.province}
              onValueChange={(value) => setAddressData({ ...addressData, province: value })}
              style={styles.picker}
              enabled={!saving}
              mode="dropdown"
            >
              {PROVINCIAS.map((provincia) => (
                <Picker.Item
                  key={provincia}
                  label={provincia}
                  value={provincia}
                  enabled={provincia !== "Selecciona tu provincia"}
                />
              ))}
            </Picker>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Obra Social</Text>

        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Obra Social *</Text>
          <View style={[styles.pickerContainer, saving && styles.pickerDisabled]}>
            <Picker
              selectedValue={obraSocialData.name}
              onValueChange={handleObraSocialChange}
              style={styles.picker}
              enabled={!saving}
              mode="dropdown"
            >
              {OBRAS_SOCIALES.map((obra) => (
                <Picker.Item
                  key={obra}
                  label={obra}
                  value={obra}
                  enabled={obra !== "Selecciona tu obra social"}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>
            {debeIngresarNumero ? "Numero de afiliado *" : "Numero de afiliado"}
          </Text>
          <TextInput
            style={[
              globalStyles.input,
              (!debeIngresarNumero || saving) && styles.inputDisabledStyle
            ]}
            placeholder={debeIngresarNumero ? "123456789" : "No requerido"}
            value={obraSocialData.number}
            onChangeText={(text) => setObraSocialData({ ...obraSocialData, number: text })}
            keyboardType="numeric"
            placeholderTextColor={colors.textTertiary}
            editable={debeIngresarNumero && !saving}
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            globalStyles.primaryButton,
            pressed && !saving && globalStyles.buttonPressed,
            saving && globalStyles.buttonDisabled,
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <View style={styles.savingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={[globalStyles.primaryButtonText, { marginLeft: 8 }]}>
                Guardando...
              </Text>
            </View>
          ) : (
            <Text style={globalStyles.primaryButtonText}>Guardar Cambios</Text>
          )}
        </Pressable>

        <View style={{ marginTop: 16 }} />

        <Pressable
          style={({ pressed }) => [
            styles.changePasswordButton,
            pressed && globalStyles.buttonPressed,
          ]}
          onPress={() => router.push("/change-password")}
          disabled={saving}
        >
          <Ionicons name="key-outline" size={20} color={colors.primary} />
          <Text style={styles.changePasswordText}>Cambiar Contraseña</Text>
        </Pressable>

        <View style={{ marginTop: 16 }} />

        <Pressable
          style={({ pressed }) => [
            globalStyles.dangerButton,
            pressed && globalStyles.buttonPressed,
          ]}
          onPress={handleLogout}
          disabled={saving}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={globalStyles.dangerButtonText}>Cerrar Sesion</Text>
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
    flex: 1,
  },
  inputTextFixed: {
    fontSize: 16,
    color: colors.textSecondary,
    flex: 1,
  },
  flexibleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  icon: {
    marginRight: 8,
    flexShrink: 0,
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
    height: 56,
    justifyContent: 'center',
  },
  pickerDisabled: {
    opacity: 0.6,
  },
  picker: {
    height: Platform.OS === 'ios' ? 56 : 56,
    color: colors.textPrimary,
    fontSize: 16,
    marginTop: Platform.OS === 'android' ? -8 : 0,
    marginBottom: Platform.OS === 'android' ? -8 : 0,
  },
  inputDisabledStyle: {
    backgroundColor: colors.gray100,
    color: colors.textTertiary,
  },
  savingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  changePasswordButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  changePasswordText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 16,
  },
});