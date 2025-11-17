import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  Alert,  
  StyleSheet,
  Platform,
  Modal,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { navigateToRecetas } from '../src/lib/navigationHelpers';
import { LoadingScreen } from '../src/components/common';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../src/lib/firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { globalStyles, colors } from '../assets/styles';
import { API_URL } from '@/src/config/apiConfig';
import { AddressWithMetadata } from '../assets/types';

export default function CargarRecetaScreen() {
  const router = useRouter();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addresses, setAddresses] = useState<AddressWithMetadata[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<AddressWithMetadata | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    (async () => {
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus.status !== 'granted' || mediaLibraryStatus.status !== 'granted') {
        const mensaje = "Se necesitan permisos para la camara y la galeria para continuar.";
        if (Platform.OS === 'web') {
          window.alert(mensaje);
        } else {
          Alert.alert("Permisos necesarios", mensaje);
        }
      }
    })();
  }, []);

  const loadAddresses = async () => {
    const user = auth.currentUser;
    if (!user) {
      console.log("❌❌❌❌ [loadAddresses] No hay usuario autenticado.");
      return;
    }

    setLoadingAddresses(true);
    try {
      
      const addressesRef = collection(db, 'users', user.uid, 'addresses');
      const q = query(addressesRef, orderBy('fechaCreacion', 'desc'));
      const snapshot = await getDocs(q); // ✅ Firebase query
      
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

      const defaultAddress = addressList.find(addr => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
      } else if (addressList.length > 0) {
        setSelectedAddress(addressList[0]);
      }

      if (addressList.length === 0) {
        const mensaje = "Primero debes configurar una direccion en tu perfil.";
        if (Platform.OS === 'web') {
          window.alert(mensaje);
        } else {
          Alert.alert("Direccion requerida", mensaje);
        }
        router.push('../(tabs)/perfil');
      }

    } catch (error) {
      console.log("❌❌❌❌ Error cargando direcciones (Firebase):", error); // ✅ Firebase Error
      const mensaje = "No pudimos cargar tus direcciones.";
      Platform.OS === 'web' ? window.alert(mensaje) : Alert.alert("Error", mensaje);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const onTakePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setUploadedImage(result.assets[0].uri);
      await loadAddresses();
    }
  };

  const onPickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setUploadedImage(result.assets[0].uri);
      await loadAddresses();
    }
  };

  const onClearImage = () => {
    setUploadedImage(null);
    setSelectedAddress(null);
    setAddresses([]);
  };

  const handleUploadRecipe = async () => {
    
    if (!uploadedImage) {
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      console.log("❌❌❌❌ [handleUploadRecipe] No hay usuario autenticado."); // ✅ Validación
      const mensaje = "Debes iniciar sesion para subir una receta.";
      Platform.OS === 'web' ? window.alert(mensaje) : Alert.alert("Error", mensaje);
      return;
    }

    if (!selectedAddress) {
      console.log("❌❌❌❌ [handleUploadRecipe] No hay direccion seleccionada."); // ✅ Validación
      const mensaje = "Debes seleccionar una direccion de entrega.";
      Platform.OS === 'web' ? window.alert(mensaje) : Alert.alert("Error", mensaje);
      return;
    }

    setIsLoading(true);

    try {
      
      const formData = new FormData();
      
      formData.append('userId', user.uid);
      formData.append('addressId', selectedAddress.id);

      // Formato correcto del archivo segun la plataforma
      if (Platform.OS === 'web') {
        // Web: Convertir URI a Blob
        const response = await fetch(uploadedImage);
        const blob = await response.blob();
        formData.append('file', blob, `receta_${Date.now()}.jpg`);
      } else {
        // Mobile: Formato React Native
        const fileUri = Platform.OS === 'android' 
          ? uploadedImage 
          : uploadedImage.replace('file://', '');
        
        formData.append('file', {
          uri: fileUri,
          name: `receta_${Date.now()}.jpg`,
          type: 'image/jpeg',
        } as any);
      }

      const endpoint = `${API_URL}/api/recetas/crear-con-imagen`; // ✅ API URL

      // Endpoint atomico: crea receta + sube imagen en una transaccion
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`❌❌❌❌ [handleUploadRecipe] Response NO OK de la API: ${errorText}`); // ✅ API Error
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || "Error desconocido" };
        }
        
        throw new Error(errorData.error || `Error ${response.status}: ${errorText}`);
      }

      const result = await response.json(); // ✅ API Success
      
      const mensaje_exito = "Tu receta fue enviada. Recibiras notificaciones cuando las farmacias respondan.";
      if (Platform.OS === 'web') {
        window.alert("¡Receta subida! " + mensaje_exito);
      } else {
        Alert.alert("¡Receta subida!", mensaje_exito);
      }
      
      // Limpiar estado
      setUploadedImage(null);
      setSelectedAddress(null);
      setAddresses([]);
      
      navigateToRecetas(router);

    } catch (error) {
      console.log("❌❌❌❌ Error subiendo la receta (API/Net):", error); // ✅ API/General Error
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      
      if (Platform.OS === 'web') {
        window.alert(`Error: No se pudo subir la receta.\n\n${errorMessage}`);
      } else {
        Alert.alert("Error", `No se pudo subir la receta.\n\n${errorMessage}`);
      }
      
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Subiendo tu receta..." />;
  }

  return (
    <SafeAreaView style={globalStyles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cargar Receta</Text>
        <View style={styles.backButton} />
      </View>
      
      <View style={styles.centerContainer}>
        {!uploadedImage ? (
          // Vista para seleccionar imagen
          <>
            <View style={styles.uploadPlaceholder}>
              <Ionicons name="camera-outline" size={64} color={colors.textTertiary} />
              <Text style={styles.uploadText}>Coloca la receta dentro del marco</Text>
            </View>
            
            <TouchableOpacity onPress={onTakePhoto} style={[globalStyles.primaryButton, styles.buttonFullWidth]}>
              <View style={styles.buttonContent}>
                <Ionicons name="camera" size={20} color={colors.surface} />
                <Text style={globalStyles.primaryButtonText}>Tomar Foto</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={onPickImage} style={[globalStyles.secondaryButton, styles.buttonFullWidth, { marginTop: 16 }]}>
              <View style={styles.buttonContent}>
                <Ionicons name="image" size={20} color={colors.textSecondary} />
                <Text style={globalStyles.secondaryButtonText}>Subir desde Galeria</Text>
              </View>
            </TouchableOpacity>
          </>
        ) : (
          // Vista para confirmar imagen y direccion
          <>
            <Image 
              source={{ uri: uploadedImage }} 
              style={styles.uploadedImage}
              resizeMode="contain"
            />

            {/* Selector de Direccion */}
            {loadingAddresses ? (
              <View style={styles.addressSelector}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Cargando direcciones...</Text>
              </View>
            ) : selectedAddress ? (
              <TouchableOpacity 
                style={styles.addressSelector}
                onPress={() => {
                  setShowAddressModal(true);
                }}
              >
                <View style={styles.addressInfo}>
                  <Ionicons name="location" size={20} color={colors.primary} />
                  <View style={styles.addressTextContainer}>
                    <Text style={styles.addressLabel}>Direccion de entrega:</Text>
                    <Text style={styles.addressText} numberOfLines={2}>
                      {selectedAddress.alias ? `${selectedAddress.alias} - ` : ''}
                      {selectedAddress.street}, {selectedAddress.city}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            ) : (
              // Fallback si no hay direcciones
              <TouchableOpacity 
                style={[styles.addressSelector, styles.addressSelectorError]}
                onPress={() => router.push('../(tabs)/perfil')}
              >
                <Ionicons name="alert-circle" size={20} color={colors.error} />
                <Text style={styles.errorText}>Configura una direccion en tu perfil</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              onPress={handleUploadRecipe} 
              style={[
                globalStyles.primaryButton, 
                styles.buttonFullWidth,
                !selectedAddress && styles.buttonDisabled 
              ]}
              disabled={!selectedAddress || isLoading}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="checkmark" size={20} color={colors.surface} />
                <Text style={globalStyles.primaryButtonText}>Usar esta foto</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={onClearImage} 
              style={[globalStyles.secondaryButton, styles.buttonFullWidth, { marginTop: 16 }]}
              disabled={isLoading}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="refresh" size={20} color={colors.textSecondary} />
                <Text style={globalStyles.secondaryButtonText}>Tomar otra foto</Text>
              </View>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Modal de Seleccion de Direccion */}
      <Modal
        visible={showAddressModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Direccion</Text>
              <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.addressList}>
              {addresses.map((address) => (
                <TouchableOpacity
                  key={address.id}
                  style={[
                    styles.addressItem,
                    selectedAddress?.id === address.id && styles.addressItemSelected
                  ]}
                  onPress={() => {
                    setSelectedAddress(address);
                    setShowAddressModal(false);
                  }}
                >
                  <View style={styles.addressItemContent}>
                    <Ionicons 
                      name={selectedAddress?.id === address.id ? "radio-button-on" : "radio-button-off"} 
                      size={24} 
                      color={selectedAddress?.id === address.id ? colors.primary : colors.textTertiary} 
                    />
                    <View style={styles.addressItemText}>
                      {address.alias && (
                        <Text style={styles.addressAlias}>{address.alias}</Text>
                      )}
                      <Text style={styles.addressItemStreet}>{address.street}</Text>
                      <Text style={styles.addressItemCity}>
                        {address.city}, {address.province} - CP {address.postalCode}
                      </Text>
                      {address.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Predeterminada</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={() => {
                setShowAddressModal(false);
                router.push('../(tabs)/perfil');
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.addAddressText}>Agregar nueva direccion</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// (Estilos sin cambios)
const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { 
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  uploadPlaceholder: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface, 
    marginBottom: 24,
  },
  uploadText: {
    fontSize: 16,
    color: colors.textSecondary, 
    marginTop: 16,
  },
  uploadedImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: colors.gray100, 
  },
  addressSelector: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  addressSelectorError: {
    borderColor: colors.error,
    backgroundColor: '#FFF5F5',
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  addressLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  loadingText: {
    marginLeft: 12,
    color: colors.textSecondary,
  },
  errorText: {
    marginLeft: 12,
    color: colors.error,
    fontWeight: '500',
  },
  buttonFullWidth: {
    width: '100%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  addressList: {
    maxHeight: 400,
  },
  addressItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  addressItemSelected: {
    backgroundColor: colors.primaryLight,
  },
  addressItemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressItemText: {
    flex: 1,
    marginLeft: 12,
  },
  addressAlias: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  addressItemStreet: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  addressItemCity: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  defaultBadge: {
    marginTop: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  defaultBadgeText: {
    fontSize: 12,
    color: colors.surface,
    fontWeight: '600',
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addAddressText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
});