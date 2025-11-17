import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../assets/styles";
import { auth, db } from "../../src/lib/firebase";
import {
  collection,
  query,
  doc,
  deleteDoc,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { API_URL } from "../../src/config/apiConfig";
import BackButton from "../../src/components/common/backbutton";

interface FarmaciaItem {
  id: string;
  nombreComercial?: string;
  usuario?: string;
  email?: string;
  role?: string;
}

export default function FarmaciasAdmin() {
  const router = useRouter();
  const [farmacias, setFarmacias] = useState<FarmaciaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  // Subscripcion a farmacias en tiempo real
  useEffect(() => {
    setLoading(true);
    setError("");

    const farmaciasRef = collection(db, "farmacias");
    const q = query(farmaciasRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: FarmaciaItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          items.push({
            id: docSnap.id,
            nombreComercial: data.nombreComercial,
            usuario: data.usuario,
            email: data.email,
            role: data.role ?? "farmacia",
          });
        });

        setFarmacias(items);
        setLoading(false);
      },
      (e) => {
        console.log(" ❌❌❌❌ [FarmaciasAdmin] Error en onSnapshot (Firebase):", e); // ✅ Firebase Error
        setError("No pudimos cargar las farmacias.");
        setLoading(false);
      }
    );

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * Logica de eliminacion
   */
  const handleEliminarFarmacia = async (farmacia: FarmaciaItem) => {
    const nombreFarmacia = farmacia.nombreComercial || farmacia.id;

    // 1. Pedir password de admin (solo para confirmar la intencion)
    const solicitarPasswordAdmin = () => {
      
      if (Platform.OS === 'web') {
        const adminPassword = window.prompt(
          `Para eliminar "${nombreFarmacia}", ingresa tu password de administrador:`
        );
        
        if (adminPassword) {
          confirmarYEliminar(adminPassword);
        }
      } else {
        Alert.prompt(
          "Password de Administrador",
          `Para eliminar "${nombreFarmacia}", ingresa tu password:`,
          [
            { text: "Cancelar", style: "cancel" },
            { 
              text: "Eliminar", 
              style: "destructive",
              onPress: (password) => {
                if (password) {
                  confirmarYEliminar(password);
                }
              }
            },
          ],
          "secure-text"
        );
      }
    };

    // 2. Logica core de borrado
    const confirmarYEliminar = async (adminPassword: string) => {
      
      try {
        setDeleting(farmacia.id);

        const adminUser = auth.currentUser;
        if (!adminUser) {
          throw new Error("No hay un administrador autenticado");
        }

        // --- PASO 1: Eliminar de Firebase Auth (via Backend) ---
        const token = await adminUser.getIdToken(true); // ✅ Firebase Interaction

        const response = await fetch(`${API_URL}/api/admin/users/${farmacia.id}`, { // ✅ API Request
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.log(` ❌❌❌❌ [confirmarYEliminar] Error API backend: ${response.status}`, errorData); // ✅ API Error
          throw new Error(errorData.error || `Error del backend: ${response.status}`);
        }
        
        // --- PASO 2: Eliminar de Firestore (SI PASO 1 FUE EXITOSO) ---

        // 2a. Eliminar cotizaciones
        await eliminarCotizacionesDeFarmacia(farmacia.id); // ✅ Firestore Interaction

        // 2b. Eliminar pedidos
        await eliminarPedidosDeFarmacia(farmacia.id); // ✅ Firestore Interaction

        // 2c. Eliminar documento de farmacia
        await deleteDoc(doc(db, "farmacias", farmacia.id)); // ✅ Firestore Interaction

        const successMsg = `Farmacia "${nombreFarmacia}" eliminada exitosamente.`;
        if (Platform.OS === 'web') {
          window.alert(successMsg);
        } else {
          Alert.alert("Eliminada", successMsg);
        }

      } catch (e: any) {
        console.log(" ❌❌❌❌ [confirmarYEliminar] _ERROR_:", e); // ✅ General Error
        
        let mensaje = e.message || "No se pudo eliminar la farmacia.";
        if (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") {
          mensaje = "Password de administrador incorrecta.";
        }
        
        if (Platform.OS === 'web') {
          window.alert(`Error: ${mensaje}`);
        } else {
          Alert.alert("Error", mensaje);
        }
      } finally {
        setDeleting(null);
      }
    };

    // 0. Confirmacion inicial
    const alertTitle = "Eliminar Farmacia";
    const alertMessage =
      `¿Seguro que queres eliminar la farmacia "${nombreFarmacia}"?\n\n` +
      `Esto eliminara:\n` +
      `- El usuario de autenticacion (Auth)\n` +
      `- El documento de la farmacia (Firestore)\n` +
      `- Todas sus cotizaciones y pedidos.\n\n` +
      `ACCION IRREVERSIBLE.`;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(alertMessage);
      if (confirmed) {
        solicitarPasswordAdmin();
      }
    } else {
      Alert.alert(
        alertTitle,
        alertMessage,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Continuar", style: "destructive", onPress: solicitarPasswordAdmin },
        ]
      );
    }
  };

  /**
   * Helper: Elimina cotizaciones de una farmacia
   */
  const eliminarCotizacionesDeFarmacia = async (farmaciaId: string) => {
    try {
      const recetasSnapshot = await getDocs(collection(db, "recetas"));
      
      for (const recetaDoc of recetasSnapshot.docs) {
        // Borra cotizaciones
        const cotizacionesRef = collection(db, "recetas", recetaDoc.id, "cotizaciones");
        const q = query(cotizacionesRef, where("farmaciaId", "==", farmaciaId));
        const cotizacionesSnapshot = await getDocs(q);
        
        for (const cotizacionDoc of cotizacionesSnapshot.docs) {
          await deleteDoc(cotizacionDoc.ref);
        }
        
        // Borra flag 'farmaciasRespondieron'
        try {
          const farmaciaRespondioRef = doc(db, "recetas", recetaDoc.id, "farmaciasRespondieron", farmaciaId);
          await deleteDoc(farmaciaRespondioRef);
        } catch (e) { 
          // Ignorar si no existe
        }
      }
    } catch (e) {
      console.log(" ❌❌❌❌ [eliminarCotizaciones] _ERROR_:", e); // ✅ Error
      throw e; 
    }
  };

  /**
   * Helper: Elimina pedidos de una farmacia
   */
  const eliminarPedidosDeFarmacia = async (farmaciaId: string) => {
    try {
      const pedidosRef = collection(db, "pedidos");
      const q = query(pedidosRef, where("farmaciaId", "==", farmaciaId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
         return;
      }
      
      for (const pedidoDoc of snapshot.docs) {
        await deleteDoc(pedidoDoc.ref);
      }
    } catch (e) {
      console.log(" ❌❌❌❌ [eliminarPedidos] _ERROR_:", e); // ✅ Error
      throw e; 
    }
  };

  // Render de cada item
  const renderItem = ({ item }: { item: FarmaciaItem }) => {
    const nombre =
      item.nombreComercial ||
      item.usuario ||
      item.email ||
      "Farmacia sin nombre";
    const isDeleting = deleting === item.id;
    
    return (
      <View style={styles.item}>
        <View style={styles.itemContent}>
          <View style={styles.itemInfo}>
            <Text style={styles.name}>{nombre}</Text>
            {item.usuario && (
              <Text style={styles.subtext}>Usuario: {item.usuario}</Text>
            )}
            {item.email && (
              <Text style={styles.subtext}>Email: {item.email}</Text>
            )}
            <Text style={styles.roleText}>Rol: {item.role ?? "farmacia"}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && !isDeleting && styles.deleteButtonPressed,
              isDeleting && styles.deleteButtonDisabled,
            ]}
            onPress={() => handleEliminarFarmacia(item)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            )}
          </Pressable>
        </View>
      </View>
    );
  };

  // Render principal
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <BackButton />
      
      <Text style={styles.title}>🏥 Lista de Farmacias</Text>

      {loading && (
        <View style={styles.centerRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando farmacias...</Text>
        </View>
      )}
      
      {error && !loading && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {!loading && !error && (
        <FlatList
          data={farmacias}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Todavia no hay farmacias registradas.
            </Text>
          }
        />
      )}

      <Pressable
        style={({ pressed }) => [
          styles.addButton,
          pressed && styles.addButtonPressed,
        ]}
        onPress={() => router.push("/admin/crearfarmacias")}
      >
        <Ionicons name="add-circle-outline" size={22} color="white" />
        <Text style={styles.addButtonText}>Agregar Farmacia</Text>
      </Pressable>
    </SafeAreaView>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff", 
    padding: 16 
  },
  title: { 
    fontSize: 22, 
    fontWeight: "700", 
    marginBottom: 12, 
    color: colors.textPrimary 
  },
  item: {
    backgroundColor: "#f9f9f9",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  name: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: colors.textPrimary 
  },
  subtext: { 
    fontSize: 13, 
    color: "#666", 
    marginTop: 2 
  },
  roleText: { 
    fontSize: 12, 
    color: colors.textTertiary, 
    marginTop: 4 
  },
  deleteButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FFE5E5',
    marginLeft: 12,
  },
  deleteButtonPressed: {
    opacity: 0.7,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  addButton: {
    backgroundColor: colors.primaryDark,
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
  addButtonPressed: {
    opacity: 0.8,
  },
  addButtonText: { 
    color: "white", 
    fontWeight: "600", 
    fontSize: 16 
  },
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 8,
  },
  loadingText: { 
    color: colors.textSecondary 
  },
  errorText: { 
    color: colors.error, 
    marginVertical: 8 
  },
  emptyText: { 
    marginTop: 16, 
    color: colors.textSecondary 
  },
});