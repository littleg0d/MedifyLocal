import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from '@react-native-picker/picker';
import { auth, db } from "../../src/lib/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const LOCALIDADES_BS_AS = [
  "Seleccioná tu localidad",
  "La Plata",
  "Mar del Plata",
  "Bahía Blanca",
  "Quilmes",
  "Avellaneda",
  "Lanús",
  "San Isidro",
  "Vicente López",
  "Lomas de Zamora",
  "Banfield",
  "Temperley",
  "Adrogué",
  "Morón",
  "Hurlingham",
  "Ituzaingó",
  "San Martín",
  "Villa Ballester",
  "Tres de Febrero",
  "San Miguel",
  "José C. Paz",
  "Malvinas Argentinas",
  "Tigre",
  "Escobar",
  "Pilar",
  "San Fernando",
  "Berazategui",
  "Florencio Varela",
  "Presidente Perón",
  "Esteban Echeverría",
  "Ezeiza",
  "La Matanza",
  "González Catán",
  "Isidro Casanova",
  "Rafael Castillo",
  "San Justo",
  "Merlo",
  "Moreno",
  "General Rodríguez",
  "Luján",
  "Mercedes",
  "Chivilcoy",
  "Bragado",
  "Junín",
  "Lincoln",
  "Chacabuco",
  "Pergamino",
  "San Nicolás",
  "Ramallo",
  "San Pedro",
  "Baradero",
  "Zárate",
  "Campana",
  "Olavarría",
  "Azul",
  "Tandil",
  "Balcarce",
  "Necochea",
  "Tres Arroyos",
  "Coronel Suárez",
  "Pigüé",
  "Tornquist",
  "Punta Alta",
  "Coronel Rosales",
  "Carmen de Patagones",
  "Villarino",
  "Chascomús",
  "Dolores",
  "General Madariaga",
  "Pinamar",
  "Villa Gesell",
  "General Pueyrredón",
  "General Alvarado",
  "Lobos",
  "Saladillo",
  "25 de Mayo",
  "9 de Julio",
  "Carlos Casares",
  "Pehuajó",
  "Trenque Lauquen",
  "General Villegas",
  "Pellegrini",
  "Salliqueló",
  "Daireaux",
  "Bolívar",
  "Tapalqué",
  "Las Flores",
  "General Belgrano",
  "Monte",
  "Brandsen",
  "Cañuelas",
  "San Vicente",
  "Almirante Brown",
  "Burzaco",
  "Claypole",
  "Glew",
  "Longchamps",
  "Ministro Rivadavia",
  "Rafael Calzada",
  "San Francisco Solano",
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Mi Perfil</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Correo electrónico</Text>
          <View style={styles.inputDisabled}>
            <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
            <Text style={styles.emailText}>{auth.currentUser?.email}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="Tu nombre"
              value={userData.firstName}
              onChangeText={(text) => setUserData({ ...userData, firstName: text })}
            />
          </View>

          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>Apellido</Text>
            <TextInput
              style={styles.input}
              placeholder="Tu apellido"
              value={userData.lastName}
              onChangeText={(text) => setUserData({ ...userData, lastName: text })}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>DNI</Text>
            <View style={styles.inputDisabled}>
              <Ionicons name="card-outline" size={20} color="#9CA3AF" />
              <Text style={styles.emailText}>{userData.dni || "No configurado"}</Text>
            </View>
          </View>

          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>Teléfono</Text>
            <TextInput
              style={styles.input}
              placeholder="11 1234-5678"
              value={userData.phone}
              onChangeText={(text) => setUserData({ ...userData, phone: text })}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Dirección</Text>
          <Pressable 
            style={({ pressed }) => [
              styles.addressField,
              pressed && styles.addressFieldPressed,
            ]}
            onPress={() => setModalVisible(true)}
          >
            <View style={styles.addressContent}>
              <Ionicons name="home-outline" size={20} color={addressData.street ? "#111827" : "#9CA3AF"} />
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
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.buttonPressed,
            saving && styles.buttonDisabled,
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </Pressable>

        <View style={{ height: 80 }} />
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Configurar Dirección</Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </Pressable>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.label}>Nombre de la dirección</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Casa, Trabajo, Casa de mamá"
                  value={addressData.name}
                  onChangeText={(text) => setAddressData({ ...addressData, name: text })}
                />
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.label}>Calle y número</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Av. 7 N° 1234"
                  value={addressData.street}
                  onChangeText={(text) => setAddressData({ ...addressData, street: text })}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.modalSection, styles.halfWidth]}>
                  <Text style={styles.label}>Depto/Piso (opcional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: 2B"
                    value={addressData.department}
                    onChangeText={(text) => setAddressData({ ...addressData, department: text })}
                  />
                </View>

                <View style={[styles.modalSection, styles.halfWidth]}>
                  <Text style={styles.label}>Código Postal</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1900"
                    value={addressData.postalCode}
                    onChangeText={(text) => setAddressData({ ...addressData, postalCode: text })}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.label}>Localidad</Text>
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

              <View style={styles.modalSection}>
                <Text style={styles.label}>Provincia</Text>
                <View style={styles.inputDisabled}>
                  <Ionicons name="location-outline" size={20} color="#9CA3AF" />
                  <Text style={styles.emailText}>{addressData.province}</Text>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.modalSaveButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleSaveAddress}
              >
                <Text style={styles.modalSaveButtonText}>Guardar Dirección</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.modalCancelButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F8F7",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#6B7280",
    fontSize: 16,
  },
  header: {
    marginBottom: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  section: {
    marginBottom: 20,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    color: "#111827",
  },
  inputDisabled: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emailText: {
    fontSize: 16,
    color: "#6B7280",
  },
  addressField: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addressFieldPressed: {
    backgroundColor: "#F9FAFB",
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
    color: "#111827",
    marginBottom: 2,
  },
  addressPreview: {
    fontSize: 14,
    color: "#6B7280",
  },
  addressPlaceholder: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  pickerContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  saveButton: {
    backgroundColor: "#22C55E",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    backgroundColor: "#FEF2F2",
  },
  logoutText: {
    color: "#EF4444",
    fontWeight: "600",
    fontSize: 16,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSaveButton: {
    backgroundColor: "#22C55E",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
  },
  modalSaveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  modalCancelButton: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  modalCancelButtonText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
  },
});