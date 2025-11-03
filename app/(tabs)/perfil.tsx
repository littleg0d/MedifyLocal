import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from '@react-native-picker/picker';
import { auth, db } from "../../src/lib/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { globalStyles, colors } from "../../assets/styles";
const LOCALIDADES_BS_AS = [
  "Seleccioná tu localidad",
  "La Plata",
  "Mar del Plata",
  "Bahía Blanca",
  "Quilmes",
  "Avellaneda",
  // ... (resto de localidades)
].sort();

export default function Perfil() {
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    dni: "",
    phone: "",
  });
  
  const [addressData, setAddressData] = useState({
    name: "",
    street: "",
    department: "",
    postalCode: "",
    city: "Seleccioná tu localidad",
    province: "Buenos Aires",
  });

  const [modalVisible, setModalVisible] = useState(false);
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
        setUserData({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          dni: data.dni || "",
          phone: data.phone || "",
        });

        if (data.address) {
          setAddressData({
            name: data.address.name || "",
            street: data.address.street || "",
            department: data.address.department || "",
            postalCode: data.address.postalCode || "",
            city: data.address.city || "Seleccioná tu localidad",
            province: data.address.province || "Buenos Aires",
          });
        }
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = () => {
    if (!addressData.name.trim()) {
      Alert.alert("Atención", "Ingresá un nombre para tu dirección (ej: Casa, Trabajo)");
      return;
    }
    if (!addressData.street.trim()) {
      Alert.alert("Atención", "Ingresá tu dirección completa");
      return;
    }
    if (addressData.city === "Seleccioná tu localidad") {
      Alert.alert("Atención", "Seleccioná tu localidad");
      return;
    }

    setModalVisible(false);
    Alert.alert("✓", "Dirección guardada. No olvides guardar los cambios.");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, "users", user.uid);
      
      await setDoc(docRef, {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        address: addressData.street ? {
          name: addressData.name,
          street: addressData.street,
          department: addressData.department,
          postalCode: addressData.postalCode,
          city: addressData.city,
          province: addressData.province,
        } : null,
        displayName: `${userData.firstName} ${userData.lastName}`.trim(),
        email: user.email,
      }, { merge: true });

      Alert.alert("¡Listo!", "Tus datos se guardaron correctamente");
    } catch (error) {
      console.error("Error al guardar:", error);
      Alert.alert("Error", "No pudimos guardar los cambios. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
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

  const getAddressPreview = () => {
    if (!addressData.street) return "No configurada";
    
    let preview = addressData.street;
    if (addressData.department) preview += `, ${addressData.department}`;
    if (addressData.city !== "Seleccioná tu localidad") preview += `, ${addressData.city}`;
    if (addressData.postalCode) preview += ` (CP ${addressData.postalCode})`;
    
    return preview;
  };

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

        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Correo electrónico</Text>
          <View style={globalStyles.inputDisabled}>
            <Ionicons name="mail-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.inputText}>{auth.currentUser?.email}</Text>
          </View>
        </View>

        <View style={globalStyles.row}>
          <View style={[globalStyles.section, globalStyles.halfWidth]}>
            <Text style={globalStyles.label}>Nombre</Text>
            <TextInput
              style={globalStyles.input}
              placeholder="Tu nombre"
              value={userData.firstName}
              onChangeText={(text) => setUserData({ ...userData, firstName: text })}
            />
          </View>

          <View style={[globalStyles.section, globalStyles.halfWidth]}>
            <Text style={globalStyles.label}>Apellido</Text>
            <TextInput
              style={globalStyles.input}
              placeholder="Tu apellido"
              value={userData.lastName}
              onChangeText={(text) => setUserData({ ...userData, lastName: text })}
            />
          </View>
        </View>

        <View style={globalStyles.row}>
          <View style={[globalStyles.section, globalStyles.halfWidth]}>
            <Text style={globalStyles.label}>DNI</Text>
            <View style={globalStyles.inputDisabled}>
              <Ionicons name="card-outline" size={20} color={colors.textTertiary} />
              <Text style={styles.inputText}>{userData.dni || "No configurado"}</Text>
            </View>
          </View>

          <View style={[globalStyles.section, globalStyles.halfWidth]}>
            <Text style={globalStyles.label}>Teléfono</Text>
            <TextInput
              style={globalStyles.input}
              placeholder="11 1234-5678"
              value={userData.phone}
              onChangeText={(text) => setUserData({ ...userData, phone: text })}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Dirección</Text>
          <Pressable 
            style={({ pressed }) => [
              styles.addressField,
              pressed && styles.addressFieldPressed,
            ]}
            onPress={() => setModalVisible(true)}
          >
            <View style={styles.addressContent}>
              <Ionicons name="home-outline" size={20} color={addressData.street ? colors.textPrimary : colors.textTertiary} />
              <View style={styles.addressTextContainer}>
                {addressData.name ? (
                  <>
                    <Text style={styles.addressName}>{addressData.name}</Text>
                    <Text style={styles.addressPreview}>{getAddressPreview()}</Text>
                  </>
                ) : (
                  <Text style={styles.addressPlaceholder}>Agregá tu dirección</Text>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </Pressable>
        </View>

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

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={globalStyles.modalOverlay}>
          <View style={globalStyles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={globalStyles.modalHeader}>
                <Text style={globalStyles.modalTitle}>Configurar Dirección</Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </Pressable>
              </View>

              <View style={globalStyles.section}>
                <Text style={globalStyles.label}>Nombre de la dirección</Text>
                <TextInput
                  style={globalStyles.input}
                  placeholder="Ej: Casa, Trabajo, Casa de mamá"
                  value={addressData.name}
                  onChangeText={(text) => setAddressData({ ...addressData, name: text })}
                />
              </View>

              <View style={globalStyles.section}>
                <Text style={globalStyles.label}>Calle y número</Text>
                <TextInput
                  style={globalStyles.input}
                  placeholder="Ej: Av. 7 N° 1234"
                  value={addressData.street}
                  onChangeText={(text) => setAddressData({ ...addressData, street: text })}
                />
              </View>

              <View style={globalStyles.row}>
                <View style={[globalStyles.section, globalStyles.halfWidth]}>
                  <Text style={globalStyles.label}>Depto/Piso (opcional)</Text>
                  <TextInput
                    style={globalStyles.input}
                    placeholder="Ej: 2B"
                    value={addressData.department}
                    onChangeText={(text) => setAddressData({ ...addressData, department: text })}
                  />
                </View>

                <View style={[globalStyles.section, globalStyles.halfWidth]}>
                  <Text style={globalStyles.label}>Código Postal</Text>
                  <TextInput
                    style={globalStyles.input}
                    placeholder="1900"
                    value={addressData.postalCode}
                    onChangeText={(text) => setAddressData({ ...addressData, postalCode: text })}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={globalStyles.section}>
                <Text style={globalStyles.label}>Localidad</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={addressData.city}
                    onValueChange={(value) => setAddressData({ ...addressData, city: value })}
                    style={styles.picker}
                  >
                    {LOCALIDADES_BS_AS.map((localidad) => (
                      <Picker.Item 
                        key={localidad} 
                        label={localidad} 
                        value={localidad}
                        enabled={localidad !== "Seleccioná tu localidad"}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={globalStyles.section}>
                <Text style={globalStyles.label}>Provincia</Text>
                <View style={globalStyles.inputDisabled}>
                  <Ionicons name="location-outline" size={20} color={colors.textTertiary} />
                  <Text style={styles.inputText}>{addressData.province}</Text>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  globalStyles.primaryButton,
                  pressed && globalStyles.buttonPressed,
                ]}
                onPress={handleSaveAddress}
              >
                <Text style={globalStyles.primaryButtonText}>Guardar Dirección</Text>
              </Pressable>

              <View style={{ marginTop: 12 }} />

              <Pressable
                style={({ pressed }) => [
                  globalStyles.secondaryButton,
                  pressed && globalStyles.buttonPressed,
                ]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={globalStyles.secondaryButtonText}>Cancelar</Text>
              </Pressable>

              <View style={{ marginBottom: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: 24,
    paddingTop: 8,
  },
  inputText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  addressField: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addressFieldPressed: {
    backgroundColor: colors.surfaceHover,
  },
  addressContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  addressTextContainer: {
    flex: 1,
  },
  addressName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  addressPreview: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  addressPlaceholder: {
    fontSize: 16,
    color: colors.textTertiary,
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
});