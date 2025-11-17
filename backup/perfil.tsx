import { Ionicons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { Platform, View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert, ActivityIndicator, Modal, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { auth, db } from "../../src/lib/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, collection, addDoc, deleteDoc, getDocs, query, orderBy, writeBatch, serverTimestamp } from "firebase/firestore";
import { globalStyles, colors } from "../../assets/styles";
import { Picker } from "@react-native-picker/picker";
import { PROVINCIAS, OBRAS_SOCIALES } from "../../src/constants/argentina";
import { showError, showSuccess } from "../../src/components/common/tdhelper"; // Asumo que este helper existe
import { AddressWithMetadata, ObraSocial } from "../../assets/types";

export default function Perfil() {
  const router = useRouter();
  console.log("[PerfilScreen] Renderizando...");
  
  // Direcciones
  const [addresses, setAddresses] = useState<AddressWithMetadata[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressWithMetadata | null>(null);
  
  // Formulario de direccion (en el modal)
  const [addressForm, setAddressForm] = useState({
    street: "",
    city: "",
    province: "Selecciona tu provincia",
    postalCode: "",
    alias: "",
  });

  // Obra social y telefono (editables)
  const [obraSocialData, setObraSocialData] = useState<ObraSocial>({
    name: "Sin obra social",
    number: "",
  });
  const [phone, setPhone] = useState("");

  // Datos de solo lectura
  const [readOnlyData, setReadOnlyData] = useState({
    firstName: "",
    lastName: "",
    dni: "",
    birthDate: "",
  });

  // Estados de carga
  const [saving, setSaving] = useState(false); // Guardando datos principales
  const [loading, setLoading] = useState(true); // Carga inicial
  const [savingAddress, setSavingAddress] = useState(false); // Guardando direccion en modal

  // Flag para logica condicional
  const debeIngresarNumero = 
    obraSocialData.name !== "Selecciona tu obra social" && 
    obraSocialData.name !== "Sin obra social";

  // Cargar datos cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      console.log("[useFocusEffect] Pantalla enfocada. Cargando datos...");
      loadUserData();
      loadAddresses();
      
      // Cleanup al salir de la pantalla
      return () => {
        console.log("[useFocusEffect] Pantalla desenfocada. Reseteando datos.");
        resetData();
      };
    }, [])
  );

  // Resetea estados (usado en cleanup)
  const resetData = () => {
    setAddresses([]);
    setObraSocialData({ name: "Sin obra social", number: "" });
    setPhone("");
    setReadOnlyData({ firstName: "", lastName: "", dni: "", birthDate: "" });
  };

  // Carga datos del doc /users/{uid}
  const loadUserData = async () => {
    console.log("[loadUserData] Cargando datos principales del usuario...");
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log("[loadUserData] No hay usuario.");
        return;
      }

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        console.log("[loadUserData] Doc de usuario encontrado.");
        const data = docSnap.data();
        
        setReadOnlyData({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          dni: data.dni || "",
          birthDate: data.birthDate || "",
        });

        setPhone(data.phone || "");

        // Manejo correcto de obra social (si es null/undefined)
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
      } else {
        console.log("❌❌❌❌ [loadUserData] Doc de usuario NO encontrado.");
      }
    } catch (error) {
      console.log("❌❌❌❌ Error al cargar datos:", error);
      showError("No pudimos cargar tus datos. Intenta recargar la página.");
    } finally {
      console.log("[loadUserData] Fin (finally). setLoading(false)");
      setLoading(false);
    }
  };

  // Carga datos de la subcoleccion /users/{uid}/addresses
  const loadAddresses = async () => {
    console.log("[loadAddresses] Cargando direcciones...");
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
      
      console.log(`[loadAddresses] ${addressList.length} direcciones encontradas.`);
      setAddresses(addressList);
    } catch (error) {
      console.log("❌❌❌❌ Error cargando direcciones:", error);
      showError("No pudimos cargar tus direcciones.");
    }
  };

  // --- Helpers de Validacion ---
  const validatePhone = (phone: string) => {
    if (!phone.trim()) return true; // Vacio es valido
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

  // Handler de cambio de Obra Social
  const handleObraSocialChange = useCallback((value: string) => {
    console.log(`[handleObraSocialChange] Seleccionado: ${value}`);
    if (value === "Sin obra social") {
      setObraSocialData({ name: value, number: "" });
    } else {
      setObraSocialData(prev => ({ ...prev, name: value }));
    }
  }, []);

  // Validar datos principales (Telefono y OS)
  const validateData = useCallback(() => {
    console.log("[validateData] Validando datos principales...");
    if (phone.trim() && !validatePhone(phone)) {
      showError("El teléfono debe tener entre 10 y 15 dígitos");
      return false;
    }
    
    if (obraSocialData.name === "Selecciona tu obra social") {
      showError("Por favor selecciona una obra social o 'Sin obra social'");
      return false;
    }
    
    if (debeIngresarNumero && !obraSocialData.number?.trim()) {
      showError("El número de afiliado es obligatorio para la obra social seleccionada");
      return false;
    }
    
    console.log("[validateData] OK.");
    return true;
  }, [obraSocialData, phone, debeIngresarNumero]);

  // Guardar datos principales
  const handleSave = useCallback(async () => {
    console.log("[handleSave] Iniciando guardado de datos principales...");
    if (!validateData()) return;

    // Validar que tenga al menos una direccion
    if (addresses.length === 0) {
      console.log("[handleSave] Validacion: No hay direcciones.");
      showError("Debes tener al menos una dirección configurada.");
      return;
    }

    try {
      setSaving(true);
      const user = auth.currentUser;
      if (!user) {
        showError("No se detectó una sesión activa. Por favor inicia sesión nuevamente.");
        return;
      }

      const docRef = doc(db, "users", user.uid);
      
      const updateData: any = {
        phone: phone.trim() || null, // Guardar null si esta vacio
      };

      // Guardar obra social (null si es "Sin obra social")
      if (obraSocialData.name === "Sin obra social") {
        updateData.obraSocial = null;
      } else {
        updateData.obraSocial = {
          name: obraSocialData.name,
          number: obraSocialData.number?.trim() || "",
        };
      }
      
      console.log("[handleSave] Enviando updateDoc:", updateData);
      await updateDoc(docRef, updateData);

      showSuccess("Tus datos se guardaron correctamente");
    } catch (error) {
      console.log("❌❌❌❌ Error al guardar:", error);
      showError("No pudimos guardar los cambios. Intenta de nuevo en unos momentos.");
    } finally {
      console.log("[handleSave] Fin (finally).");
      setSaving(false);
    }
  }, [validateData, obraSocialData, phone, addresses]);

  // ==================== GESTION DE DIRECCIONES ====================

  // Abrir modal (para crear o editar)
  const openAddressModal = (address?: AddressWithMetadata) => {
    if (address) {
      // Editando
      console.log(`[openAddressModal] Abriendo modal para EDITAR: ${address.alias}`);
      setEditingAddress(address);
      setAddressForm({
        street: address.street,
        city: address.city,
        province: address.province,
        postalCode: address.postalCode,
        alias: address.alias,
      });
    } else {
      // Creando
      console.log("[openAddressModal] Abriendo modal para CREAR nueva direccion.");
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

  // Cerrar y resetear modal
  const closeAddressModal = () => {
    console.log("[closeAddressModal] Cerrando y reseteando modal de direccion.");
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

  // Validar formulario del modal
  const validateAddressForm = () => {
    console.log("[validateAddressForm] Validando formulario de direccion...");
    if (!validateStreet(addressForm.street)) {
      showError("La calle debe tener al menos 3 caracteres");
      return false;
    }
    if (!validateCity(addressForm.city)) {
      showError("La ciudad debe tener al menos 2 caracteres");
      return false;
    }
    if (addressForm.province === "Selecciona tu provincia") {
      showError("Por favor selecciona una provincia");
      return false;
    }
    if (!validatePostalCode(addressForm.postalCode)) {
      showError("El código postal debe tener 4 dígitos");
      return false;
    }
    if (!addressForm.alias.trim()) {
      showError("Por favor ingresa un alias para la dirección (ej: Casa, Trabajo)");
      return false;
    }
    console.log("[validateAddressForm] OK.");
    return true;
  };

  // Guardar (Crear o Editar) direccion
  const handleSaveAddress = async () => {
    console.log("[handleSaveAddress] Iniciando guardado de direccion...");
    if (!validateAddressForm()) return;

    try {
      setSavingAddress(true);
      const user = auth.currentUser;
      if (!user) {
        showError("No se detectó una sesión activa.");
        return;
      }

      const addressesRef = collection(db, "users", user.uid, "addresses");

      if (editingAddress) {
        // --- Editar direccion existente ---
        console.log(`[handleSaveAddress] Editando direccion ID: ${editingAddress.id}`);
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
        // --- Crear nueva direccion ---
        console.log("[handleSaveAddress] Creando nueva direccion...");
        const isFirstAddress = addresses.length === 0;
        
        await addDoc(addressesRef, {
          street: addressForm.street.trim(),
          city: addressForm.city.trim(),
          province: addressForm.province,
          postalCode: addressForm.postalCode.trim(),
          alias: addressForm.alias.trim(),
          isDefault: isFirstAddress, // Primera direccion es predeterminada
          fechaCreacion: serverTimestamp(),
        });
        
        showSuccess("Dirección agregada");
      }

      await loadAddresses(); // Recargar lista de direcciones
      closeAddressModal(); // Cerrar modal
    } catch (error) {
      console.log("❌❌❌❌ Error guardando dirección:", error);
      showError("No pudimos guardar la dirección.");
    } finally {
      console.log("[handleSaveAddress] Fin (finally).");
      setSavingAddress(false);
    }
  };

  // Poner direccion como predeterminada
  const handleSetDefaultAddress = async (addressId: string) => {
    console.log(`[handleSetDefaultAddress] Seteando default a: ${addressId}`);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const batch = writeBatch(db);

      // 1. Quitar isDefault de todas
      addresses.forEach(addr => {
        const addrRef = doc(db, "users", user.uid, "addresses", addr.id);
        batch.update(addrRef, { isDefault: false });
      });

      // 2. Establecer la nueva default
      const newDefaultRef = doc(db, "users", user.uid, "addresses", addressId);
      batch.update(newDefaultRef, { isDefault: true });

      console.log("[handleSetDefaultAddress] Ejecutando batch...");
      await batch.commit();
      await loadAddresses(); // Recargar lista
      showSuccess("Dirección predeterminada actualizada");
    } catch (error) {
      console.log("❌❌❌❌ Error estableciendo dirección predeterminada:", error);
      showError("No pudimos actualizar la dirección predeterminada.");
    }
  };

  // Borrar direccion
  const handleDeleteAddress = async (addressId: string, isDefault: boolean) => {
    console.log(`[handleDeleteAddress] Pidiendo confirmacion para borrar: ${addressId}`);
    
    const performDelete = async () => {
      console.log(`[handleDeleteAddress] Confirmado. Borrando ${addressId}...`);
      try {
        const user = auth.currentUser;
        if (!user) return;

        // No permitir eliminar si es la unica direccion
        if (addresses.length === 1) {
          console.log("[handleDeleteAddress] Error: No se puede borrar la ultima direccion.");
          showError("Debes tener al menos una dirección configurada.");
          return;
        }

        await deleteDoc(doc(db, "users", user.uid, "addresses", addressId));

        // Si era la predeterminada, establecer la primera restante como predeterminada
        if (isDefault && addresses.length > 1) {
          console.log("[handleDeleteAddress] Era default. Seteando nueva default...");
          const remainingAddresses = addresses.filter(a => a.id !== addressId);
          if (remainingAddresses.length > 0) {
            await updateDoc(
              doc(db, "users", user.uid, "addresses", remainingAddresses[0].id),
              { isDefault: true }
            );
          }
        }

        await loadAddresses(); // Recargar lista
        showSuccess("Dirección eliminada");
      } catch (error) {
        console.log("❌❌❌❌ Error eliminando dirección:", error);
        showError("No pudimos eliminar la dirección.");
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

  // Cerrar sesion
  const handleLogout = useCallback(async () => {
    console.log("[handleLogout] Pidiendo confirmacion para logout...");
    
    const performLogout = async () => {
      console.log("[handleLogout] Confirmado. Ejecutando signOut...");
      try {
        await signOut(auth);
        // El AuthGuard global (RootLayout) se encargara de redirigir
      } catch (error) {
        console.log("❌❌❌❌ Error al cerrar sesión:", error);
        showError("No pudimos cerrar sesión. Intenta nuevamente.");
      }
    };
    
    if (Platform.OS === "web") {
      const confirmed = window.confirm("¿Estás seguro que quieres salir?");
      if (confirmed) {
        await performLogout();
      }
      return;
    }
    
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro que quieres salir?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Salir", style: "destructive", onPress: performLogout },
      ]
    );
  }, []);

  // Render de Carga
  if (loading) {
    console.log("[Render] Estado: Cargando (loading=true)");
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={globalStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[globalStyles.loadingText, { marginTop: 12 }]}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render Principal
  console.log(`[Render] Estado: OK. ${addresses.length} direcciones cargadas.`);
  return (
    <SafeAreaView style={globalStyles.container} edges={["top"]}>
      <ScrollView style={globalStyles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Text style={globalStyles.title}>Mi Perfil</Text>
        </View>

        {/* Email */}
        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Correo electrónico</Text>
          <View style={[globalStyles.inputDisabled, styles.flexibleContainer]}>
            <Ionicons name="mail-outline" size={20} color={colors.textTertiary} style={styles.icon} />
            <Text style={styles.inputText} numberOfLines={1} ellipsizeMode="middle">
              {auth.currentUser?.email}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Datos Personales</Text>
        
        {/* Nombre y Apellido */}
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

        {/* DNI */}
        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>DNI</Text>
          <View style={[globalStyles.inputDisabled, styles.flexibleContainer]}>
            <Ionicons name="card-outline" size={20} color={colors.textTertiary} style={styles.icon} />
            <Text style={styles.inputTextFixed}>
              {readOnlyData.dni || "No configurado"}
            </Text>
          </View>
        </View>

        {/* Fecha Nacimiento */}
        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Fecha de Nacimiento</Text>
          <View style={[globalStyles.inputDisabled, styles.flexibleContainer]}>
            <Ionicons name="calendar-outline" size={20} color={colors.textTertiary} style={styles.icon} />
            <Text style={styles.inputTextFixed}>
              {readOnlyData.birthDate || "No configurado"}
            </Text>
          </View>
        </View>

        {/* Telefono */}
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
          // Estado vacio de direcciones
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
          // Lista de direcciones
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

        {/* ==================== OBRA SOCIAL ==================== */}
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

        {/* ==================== ACCIONES ==================== */}
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
          <Text style={globalStyles.dangerButtonText}>Cerrar Sesión</Text>
        </Pressable>

        <View style={globalStyles.spacer} />
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
              {/* Alias */}
              <View style={globalStyles.section}>
                <Text style={globalStyles.label}>Alias *</Text>
                <TextInput
                  style={globalStyles.input}
                  placeholder="Ej: Casa, Trabajo, Casa de mis padres"
                  value={addressForm.alias}
                  onChangeText={(text) => setAddressForm({ ...addressForm, alias: text })}
                  placeholderTextColor={colors.textTertiary}
                  editable={!savingAddress}
                />
              </View>

              {/* Calle */}
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
                {/* Ciudad */}
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

                {/* CP */}
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

              {/* Provincia */}
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
                        enabled={provincia !== "Selecciona tu provincia"}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            </ScrollView>

            {/* Footer del Modal */}
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

// (Estilos sin cambios)
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
  inputTextFixed: {
    fontSize: 16,
    color: colors.textSecondary,
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
  },
  pickerDisabled: {
    opacity: 0.6,
  },
  picker: {
    height: 50,
  },
  inputDisabledStyle: {
    backgroundColor: colors.surface, // Cambiado a surface
    color: colors.textTertiary,
    opacity: 0.6, // Agregado opacity
  },
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changePasswordButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  changePasswordText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
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
    maxHeight: '70%', // Limita la altura del scroll
  },
  modalFooter: {
    marginTop: 20,
  },
});