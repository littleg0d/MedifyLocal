import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  Alert,  
  StyleSheet,
  Platform 
} from 'react-native';
import { navigateToRecetas } from '../src/lib/navigationHelpers';
import { LoadingScreen } from '../src/components/common';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../src/lib/firebase';
import { globalStyles, colors } from '../assets/styles';
import { API_URL } from '@/src/config/apiConfig';

export default function CargarRecetaScreen() {
  const router = useRouter();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
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
        if (Platform.OS === 'web') {
          window.alert("Se necesitan permisos para la cámara y la galería para continuar.");
        } else {
          Alert.alert(
            "Permisos necesarios",
            "Se necesitan permisos para la cámara y la galería para continuar."
          );
        }
      }
    })();
  }, []);

  const onTakePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setUploadedImage(result.assets[0].uri);
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
    }
  };

  const onClearImage = () => {
    setUploadedImage(null);
  };

  const handleUploadRecipe = async () => {
    if (!uploadedImage) return;

    const user = auth.currentUser;
    if (!user) {
      const mensaje = "Debes iniciar sesión para subir una receta.";
      Platform.OS === 'web' ? window.alert(mensaje) : Alert.alert("Error", mensaje);
      return;
    }

    setIsLoading(true);

    try {
      console.log("📤 Subiendo receta al backend (operación atómica)...");
      
      const formData = new FormData();
      
      // ✅ Solo userId y file - El backend obtiene todo lo demás desde Firebase
      formData.append('userId', user.uid);
      formData.append('file', {
        uri: uploadedImage,
        name: `receta_${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as any);

      console.log("📋 Request simplificado - userId:", user.uid);

      // Endpoint atómico: crea receta + sube imagen en una transacción
      const response = await fetch(`${API_URL}/api/recetas/crear-con-imagen`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const { recetaId, mensaje } = await response.json();
      console.log(`✅ Receta creada exitosamente: ${recetaId}`);
      
      if (Platform.OS === 'web') {
        window.alert("¡Receta subida! Tu receta fue enviada. Recibirás notificaciones cuando las farmacias respondan.");
      } else {
        Alert.alert(
          "¡Receta subida!",
          "Tu receta fue enviada. Recibirás notificaciones cuando las farmacias respondan."
        );
      }
      
      navigateToRecetas(router);

    } catch (error) {
      console.error("❌ Error subiendo la receta:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      
      if (Platform.OS === 'web') {
        window.alert(`Error: No se pudo subir la receta. ${errorMessage}`);
      } else {
        Alert.alert("Error", `No se pudo subir la receta. ${errorMessage}`);
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
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cargar Receta</Text>
        <View style={styles.backButton} />
      </View>
      
      <View style={styles.centerContainer}>
        {!uploadedImage ? (
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
                <Text style={globalStyles.secondaryButtonText}>Subir desde Galería</Text>
              </View>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Image 
              source={{ uri: uploadedImage }} 
              style={styles.uploadedImage}
              resizeMode="contain"
            />
            
            <TouchableOpacity onPress={handleUploadRecipe} style={[globalStyles.primaryButton, styles.buttonFullWidth]}>
              <View style={styles.buttonContent}>
                <Ionicons name="checkmark" size={20} color={colors.surface} />
                <Text style={globalStyles.primaryButtonText}>Usar esta foto</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={onClearImage} style={[globalStyles.secondaryButton, styles.buttonFullWidth, { marginTop: 16 }]}>
              <View style={styles.buttonContent}>
                <Ionicons name="refresh" size={20} color={colors.textSecondary} />
                <Text style={globalStyles.secondaryButtonText}>Tomar otra foto</Text>
              </View>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

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
    marginBottom: 24,
    backgroundColor: colors.gray100, 
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
});