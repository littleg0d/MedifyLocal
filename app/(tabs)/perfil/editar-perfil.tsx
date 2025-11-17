import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { auth, db } from "../../../src/lib/firebase";
import { doc, getDoc, updateDoc, collection, addDoc, deleteDoc, getDocs, query, orderBy, writeBatch, serverTimestamp } from "firebase/firestore";
import { globalStyles, colors } from "../../../assets/styles";
import { Picker } from "@react-native-picker/picker";
import { OBRAS_SOCIALES, PROVINCIAS } from "../../../src/constants/argentina";
import { showError, showSuccess } from "../../../src/components/common/tdhelper";
import { ObraSocial, AddressWithMetadata } from "../../../assets/types";
import BackButton from "../../../src/components/common/backbutton";

export default function EditarPerfil() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [phone, setPhone] = useState("");
  const [obraSocialData, setObraSocialData] = useState<ObraSocial>({
    name: "Sin obra social",
    number: "",
  });

  const [readOnlyData, setReadOnlyData] = useState({
    firstName: "",
    lastName: "",
    dni: "",
    birthDate: "",
    email: "",
  });

  // Direcciones
  const [addresses, setAddresses] = useState<AddressWithMetadata[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressWithMetadata | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  
  const [addressForm, setAddressForm] = useState({
    street: "",
    city: "",
    province: "Selecciona tu provincia",
    postalCode: "",
    alias: "",
  });

  const debeIngresarNumero = 
      obraSocialData.name !== OBRAS_SOCIALES[0] && // Usar la constante
      obraSocialData.name !== "Sin obra social";

  useEffect(() => {
    loadUserData();
    loadAddresses();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        router.replace("/(tabs)/perfil");
        return;
      }

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        
        setReadOnlyData({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          dni: data.dni || "",
          birthDate: data.birthDate || "",
          email: user.email || "",
        });

        setPhone(data.phone || "");

        if (data.obraSocial) {
          setObraSocialData({
            name: data.obraSocial.name || "Sin obra social",
            number: data.obraSocial.number || "",
          });
        } else {
          setObraSocialData({
            name: "Sin obra social",
            number: "",
          });
        }
      }
    } catch (error) {
      console.log(" ❌❌❌ Error cargando datos:", error);
      showError("No pudimos cargar tus datos");
    } finally {
      setLoading(false);
    }
  };

  const loadAddresses = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const addressesRef = collection(db, "users", user.uid, "addresses");
      const q = query(addressesRef, orderBy("fechaCreacion", "desc"));
      const snapshot = await getDocs(q);

      const addressList: AddressWithMetadata[] = snapshot.docs.map(doc => ({
        id: doc.id,
        street: doc.data().street || "",
        city: doc.data().city || "",
        province: doc.data().province || "",
        postalCode: doc.data().postalCode || "",
        alias: doc.data().alias || "Sin alias",
        isDefault: doc.data().isDefault || false,
        fechaCreacion: doc.data().fechaCreacion,
      }));
      
      setAddresses(addressList);
    } catch (error) {
      console.log(" ❌❌❌ Error cargando direcciones:", error);
      showError("No pudimos cargar tus direcciones");
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

  const validateData = () => {
    if (phone.trim() && !validatePhone(phone)) {
      showError("El teléfono debe tener entre 10 y 15 dígitos");
      return false;
    }
    
    if (obraSocialData.name === OBRAS_SOCIALES[0]) {
      showError("Por favor selecciona una obra social o 'Sin obra social'");
      return false;
    }
    
    if (debeIngresarNumero && !obraSocialData.number?.trim()) {
      showError("El número de afiliado es obligatorio para la obra social seleccionada");
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateData()) return;

    if (addresses.length === 0) {
      showError("Debes tener al menos una dirección configurada");
      return;
    }

    try {
      setSaving(true);
      const user = auth.currentUser;
      if (!user) {
        showError("No se detectó una sesión activa");
        return;
      }

      const docRef = doc(db, "users", user.uid);
      
      const updateData: any = {
        phone: phone.trim() || null,
      };

      if (obraSocialData.name === "Sin obra social") {
        updateData.obraSocial = null;
      } else {
        updateData.obraSocial = {
          name: obraSocialData.name,
          number: obraSocialData.number?.trim() || "",
        };
      }
      
      await updateDoc(docRef, updateData);

      showSuccess("Perfil actualizado correctamente");
      
      if (router.canDismiss()) {
        router.dismiss();
      } else {
        router.push("/(tabs)/perfil");
      }
    } catch (error) {
      console.log(" ❌❌❌ Error guardando:", error);
      showError("No pudimos guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  const handleObraSocialChange = (value: string) => {
    if (value === "Sin obra social") {
      setObraSocialData({ name: value, number: "" });
    } else {
      setObraSocialData(prev => ({ ...prev, name: value }));
    }
  };

  // ==================== GESTIÓN DE DIRECCIONES ====================

  const openAddressModal = (address?: AddressWithMetadata) => {
    if (address) {
      setEditingAddress(address);
      setAddressForm({
        street: address.street,
        city: address.city,
        province: address.province,
        postalCode: address.postalCode,
        alias: address.alias,
      });
    } else {
      setEditingAddress(null);
      setAddressForm({
        street: "",
        city: "",
        province: "Selecciona tu provincia",
        postalCode: "",
        alias: "",
      });
    }
    setShowAddressModal(true);
  };

  const closeAddressModal = () => {
    setShowAddressModal(false);
    setEditingAddress(null);
    setAddressForm({
      street: "",
      city: "",
      province: "Selecciona tu provincia",
      postalCode: "",
      alias: "",
    });
  };

  const validateAddressForm = () => {
    if (!validateStreet(addressForm.street)) {
      showError("La calle debe tener al menos 3 caracteres");
      return false;
    }
    if (!validateCity(addressForm.city)) {
      showError("La ciudad debe tener al menos 2 caracteres");
      return false;
    }
    if (addressForm.province === PROVINCIAS[0]) {
      showError("Por favor selecciona una provincia");
      return false;
    }
    if (!validatePostalCode(addressForm.postalCode)) {
      showError("El código postal debe tener 4 dígitos");
      return false;
    }
    if (!addressForm.alias.trim()) {
      showError("Por favor ingresa un alias para la dirección");
      return false;
    }
    return true;
  };

  const handleSaveAddress = async () => {
    if (!validateAddressForm()) return;

    try {
      setSavingAddress(true);
      const user = auth.currentUser;
      if (!user) {
        showError("No se detectó una sesión activa");
        return;
      }

      const addressesRef = collection(db, "users", user.uid, "addresses");

      if (editingAddress) {
        const addressDocRef = doc(db, "users", user.uid, "addresses", editingAddress.id);
        await updateDoc(addressDocRef, {
          street: addressForm.street.trim(),
          city: addressForm.city.trim(),
          province: addressForm.province,
          postalCode: addressForm.postalCode.trim(),
          alias: addressForm.alias.trim(),
        });
        showSuccess("Dirección actualizada");
      } else {
        const isFirstAddress = addresses.length === 0;
        
        await addDoc(addressesRef, {
          street: addressForm.street.trim(),
          city: addressForm.city.trim(),
          province: addressForm.province,
          postalCode: addressForm.postalCode.trim(),
          alias: addressForm.alias.trim(),
          isDefault: isFirstAddress,
          fechaCreacion: serverTimestamp(),
        });
        
        showSuccess("Dirección agregada");
      }

      await loadAddresses();
      closeAddressModal();
    } catch (error) {
      console.log(" ❌❌❌ Error guardando dirección:", error);
      showError("No pudimos guardar la dirección");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const batch = writeBatch(db);

      addresses.forEach(addr => {
        const addrRef = doc(db, "users", user.uid, "addresses", addr.id);
        batch.update(addrRef, { isDefault: false });
      });

      const newDefaultRef = doc(db, "users", user.uid, "addresses", addressId);
      batch.update(newDefaultRef, { isDefault: true });

      await batch.commit();
      await loadAddresses();
      showSuccess("Dirección predeterminada actualizada");
    } catch (error) {
      console.log(" ❌❌❌ Error estableciendo dirección predeterminada:", error);
      showError("No pudimos actualizar la dirección predeterminada");
    }
  };

  const handleDeleteAddress = async (addressId: string, isDefault: boolean) => {
    const performDelete = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        if (addresses.length === 1) {
          showError("Debes tener al menos una dirección configurada");
          return;
        }

        await deleteDoc(doc(db, "users", user.uid, "addresses", addressId));

        if (isDefault && addresses.length > 1) {
          const remainingAddresses = addresses.filter(a => a.id !== addressId);
          if (remainingAddresses.length > 0) {
            await updateDoc(
              doc(db, "users", user.uid, "addresses", remainingAddresses[0].id),
              { isDefault: true }
            );
          }
        }

        await loadAddresses();
        showSuccess("Dirección eliminada");
      } catch (error) {
        console.log(" ❌❌❌ Error eliminando dirección:", error);
        showError("No pudimos eliminar la dirección");
      }
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm("¿Estás seguro que quieres eliminar esta dirección?");
      if (confirmed) {
        await performDelete();
      }
      return;
    }

    Alert.alert(
      "Eliminar Dirección",
      "¿Estás seguro que quieres eliminar esta dirección?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: performDelete },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <BackButton/>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <BackButton onPress={() => router.replace("/perfil")} />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Editar Perfil</Text>

        {/* Email (no editable) */}
        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Correo electrónico</Text>
          <View style={[globalStyles.inputDisabled, styles.flexibleContainer]}>
            <Ionicons name="mail-outline" size={20} color={colors.textTertiary} style={styles.icon} />
            <Text style={styles.inputText} numberOfLines={1} ellipsizeMode="middle">
              {readOnlyData.email}
            </Text>
          </View>
        </View>

        {/* Nombre y Apellido (no editables) */}
        <View style={globalStyles.row}>
          <View style={[globalStyles.section, globalStyles.halfWidth]}>
            <Text style={globalStyles.label}>Nombre</Text>
            <View style={[globalStyles.inputDisabled, styles.flexibleContainer]}>
              <Ionicons name="person-outline" size={20} color={colors.textTertiary} style={styles.icon} />
              <Text style={styles.inputText} numberOfLines={1}>
                {readOnlyData.firstName || "No config."}
              </Text>
            </View>
          </View>

          <View style={[globalStyles.section, globalStyles.halfWidth]}>
            <Text style={globalStyles.label}>Apellido</Text>
            <View style={[globalStyles.inputDisabled, styles.flexibleContainer]}>
              <Ionicons name="person-outline" size={20} color={colors.textTertiary} style={styles.icon} />
              <Text style={styles.inputText} numberOfLines={1}>
                {readOnlyData.lastName || "No config."}
              </Text>
            </View>
          </View>
        </View>

        {/* DNI (no editable) */}
        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>DNI</Text>
          <View style={[globalStyles.inputDisabled, styles.flexibleContainer]}>
            <Ionicons name="card-outline" size={20} color={colors.textTertiary} style={styles.icon} />
            <Text style={styles.inputText}>
              {readOnlyData.dni || "No configurado"}
            </Text>
          </View>
        </View>

        {/* Fecha Nacimiento (no editable) */}
        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Fecha de Nacimiento</Text>
          <View style={[globalStyles.inputDisabled, styles.flexibleContainer]}>
            <Ionicons name="calendar-outline" size={20} color={colors.textTertiary} style={styles.icon} />
            <Text style={styles.inputText}>
              {readOnlyData.birthDate || "No configurado"}
            </Text>
          </View>
        </View>

        {/* Teléfono (editable) */}
        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Teléfono</Text>
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

        {/* ==================== DIRECCIONES ==================== */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mis Direcciones</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => openAddressModal()}
          >
            <Ionicons name="add-circle" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyStateText}>No tienes direcciones configuradas</Text>
            <TouchableOpacity 
              style={styles.emptyStateButton}
              onPress={() => openAddressModal()}
            >
              <Text style={styles.emptyStateButtonText}>Agregar dirección</Text>
            </TouchableOpacity>
          </View>
        ) : (
          addresses.map((address) => (
            <View key={address.id} style={styles.addressCard}>
              <View style={styles.addressCardHeader}>
                <View style={styles.addressCardTitle}>
                  <Ionicons name="location" size={20} color={colors.primary} />
                  <Text style={styles.addressAlias}>{address.alias}</Text>
                  {address.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Predeterminada</Text>
                    </View>
                  )}
                </View>
                <View style={styles.addressCardActions}>
                  <TouchableOpacity onPress={() => openAddressModal(address)}>
                    <Ionicons name="pencil" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handleDeleteAddress(address.id, address.isDefault)}
                    style={{ marginLeft: 16 }}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
              
              <Text style={styles.addressCardStreet}>{address.street}</Text>
              <Text style={styles.addressCardCity}>
                {address.city}, {address.province}
              </Text>
              <Text style={styles.addressCardCity}>CP {address.postalCode}</Text>

              {!address.isDefault && (
                <TouchableOpacity 
                  style={styles.setDefaultButton}
                  onPress={() => handleSetDefaultAddress(address.id)}
                >
                  <Text style={styles.setDefaultButtonText}>
                    Establecer como predeterminada
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}

        {/* Obra Social */}
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
                  enabled={obra !== OBRAS_SOCIALES[0]}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>
            {debeIngresarNumero ? "Número de afiliado *" : "Número de afiliado"}
          </Text>
          <TextInput
            style={[
              globalStyles.input,
              (!debeIngresarNumero || saving) && styles.inputDisabledStyle
            ]}
            placeholder={debeIngresarNumero ? "123456789" : "No requerido"}
            value={obraSocialData.number || ""}
            onChangeText={(text) => setObraSocialData({ ...obraSocialData, number: text })}
            keyboardType="numeric"
            placeholderTextColor={colors.textTertiary}
            editable={debeIngresarNumero && !saving}
          />
        </View>

        {/* Botón Guardar */}
        <Pressable
          style={({ pressed }) => [
            globalStyles.primaryButton,
            pressed && !saving && globalStyles.buttonPressed,
            saving && globalStyles.buttonDisabled,
            styles.saveButton,
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

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ==================== MODAL DE DIRECCIÓN ==================== */}
      <Modal
        visible={showAddressModal}
        transparent
        animationType="slide"
        onRequestClose={closeAddressModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAddress ? "Editar Dirección" : "Nueva Dirección"}
              </Text>
              <TouchableOpacity onPress={closeAddressModal}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={globalStyles.section}>
                <Text style={globalStyles.label}>Alias *</Text>
                <TextInput
                  style={globalStyles.input}
                  placeholder="Ej: Casa, Trabajo"
                  value={addressForm.alias}
                  onChangeText={(text) => setAddressForm({ ...addressForm, alias: text })}
                  placeholderTextColor={colors.textTertiary}
                  editable={!savingAddress}
                />
              </View>

              <View style={globalStyles.section}>
                <Text style={globalStyles.label}>Calle y número *</Text>
                <TextInput
                  style={globalStyles.input}
                  placeholder="Av. Corrientes 1234"
                  value={addressForm.street}
                  onChangeText={(text) => setAddressForm({ ...addressForm, street: text })}
                  placeholderTextColor={colors.textTertiary}
                  editable={!savingAddress}
                />
              </View>

              <View style={globalStyles.row}>
                <View style={[globalStyles.section, globalStyles.halfWidth]}>
                  <Text style={globalStyles.label}>Ciudad *</Text>
                  <TextInput
                    style={globalStyles.input}
                    placeholder="Buenos Aires"
                    value={addressForm.city}
                    onChangeText={(text) => setAddressForm({ ...addressForm, city: text })}
                    placeholderTextColor={colors.textTertiary}
                    editable={!savingAddress}
                  />
                </View>

                <View style={[globalStyles.section, globalStyles.halfWidth]}>
                  <Text style={globalStyles.label}>CP *</Text>
                  <TextInput
                    style={globalStyles.input}
                    placeholder="1000"
                    value={addressForm.postalCode}
                    onChangeText={(text) => setAddressForm({ ...addressForm, postalCode: text })}
                    keyboardType="numeric"
                    placeholderTextColor={colors.textTertiary}
                    maxLength={4}
                    editable={!savingAddress}
                  />
                </View>
              </View>

              <View style={globalStyles.section}>
                <Text style={globalStyles.label}>Provincia *</Text>
                <View style={[styles.pickerContainer, savingAddress && styles.pickerDisabled]}>
                  <Picker
                    selectedValue={addressForm.province}
                    onValueChange={(value) => setAddressForm({ ...addressForm, province: value })}
                    style={styles.picker}
                    enabled={!savingAddress}
                    mode="dropdown"
                  >
                    {PROVINCIAS.map((provincia) => (
                      <Picker.Item
                        key={provincia}
                        label={provincia}
                        value={provincia}
                        enabled={provincia !== PROVINCIAS[0]}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={({ pressed }) => [
                  globalStyles.primaryButton,
                  pressed && !savingAddress && globalStyles.buttonPressed,
                  savingAddress && globalStyles.buttonDisabled,
                ]}
                onPress={handleSaveAddress}
                disabled={savingAddress}
              >
                {savingAddress ? (
                  <View style={styles.savingContainer}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={[globalStyles.primaryButtonText, { marginLeft: 8 }]}>
                      Guardando...
                    </Text>
                  </View>
                ) : (
                  <Text style={globalStyles.primaryButtonText}>
                    {editingAddress ? "Actualizar" : "Agregar"}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  addButton: {
    padding: 4,
  },
  inputText: {
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 56,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pickerDisabled: {
    opacity: 0.6,
  },
  picker: {
    height: 56,
  },
  inputDisabledStyle: {
    backgroundColor: colors.surface,
    color: colors.textTertiary,
    opacity: 0.6,
  },
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButton: {
    marginTop: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  addressCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  addressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressCardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  addressAlias: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  defaultBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
  },
  addressCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressCardStreet: {
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  addressCardCity: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  setDefaultButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  setDefaultButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalBody: {
    maxHeight: '70%',
  },
  modalFooter: {
    marginTop: 20,
  },
});