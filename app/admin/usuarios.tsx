import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  collection,
  getDocs,
  orderBy,
  query,
  onSnapshot,
  doc,
  deleteDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "../../src/lib/firebase";
import { colors } from "../../assets/styles";
import BackButton from "../../src/components/common/backbutton";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "../../src/config/apiConfig";

type UserItem = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
};

export default function UsuariosScreen() {
  const [usuarios, setUsuarios] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Suscripción a usuarios en tiempo real
  useEffect(() => {
    setLoading(true);
    setError(null);

    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: UserItem[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            email: d.email,
            firstName: d.firstName,
            lastName: d.lastName,
            role: d.role,
          };
        });
        setUsuarios(data);
        setLoading(false);
      },
      (e) => {
        console.error("❌ [UsuariosScreen] Error en onSnapshot (Firebase):", e); // ✅ Firebase Error
        setError("No pudimos cargar la lista de usuarios.");
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Lógica de eliminación
  const handleEliminarUsuario = async (user: UserItem) => {
    const userName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;

    const solicitarPasswordAdmin = () => {
      
      if (Platform.OS === 'web') {
        const adminPassword = window.prompt(
          `Para eliminar a "${userName}", ingresa tu password de administrador:`
        );
        if (adminPassword) {
          confirmarYEliminar(adminPassword, user);
        }
      } else {
        Alert.prompt(
          "Password de Administrador",
          `Para eliminar a "${userName}", ingresa tu password:`,
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Eliminar",
              style: "destructive",
              onPress: (password) => {
                if (password) {
                  confirmarYEliminar(password, user);
                }
              },
            },
          ],
          "secure-text"
        );
      }
    };

    const confirmarYEliminar = async (adminPassword: string, userToDelete: UserItem) => {
      try {
        setDeleting(userToDelete.id);

        const adminUser = auth.currentUser;
        if (!adminUser) {
          throw new Error("No hay un administrador autenticado");
        }

        console.log(`[confirmarYEliminar] 1. Obteniendo token de admin...`); // ✅ Firebase Interaction
        const token = await adminUser.getIdToken(true);

        console.log(`[confirmarYEliminar] 2. Llamando API backend para borrar Auth: ${userToDelete.id}`); // ✅ API Request
        const response = await fetch(`${API_URL}/api/admin/users/${userToDelete.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`❌ [confirmarYEliminar] Error API backend: ${response.status}`, errorData); // ✅ API Error
          throw new Error(errorData.error || `Error del backend: ${response.status}`);
        }
        
        console.log("[confirmarYEliminar] 2.1. Auth borrado OK. Empezando limpieza Firestore...");

        await eliminarRecetasDeUsuario(userToDelete.id); // ✅ Firestore Interaction
        await eliminarPedidosDeUsuario(userToDelete.id); // ✅ Firestore Interaction

        console.log(`[confirmarYEliminar] 3. Borrando doc /users/${userToDelete.id}`); // ✅ Firestore Interaction
        await deleteDoc(doc(db, "users", userToDelete.id));

        const successMsg = `Usuario "${userName}" eliminado exitosamente.`;
        if (Platform.OS === 'web') {
          window.alert(successMsg);
        } else {
          Alert.alert("Eliminado", successMsg);
        }

      } catch (e: any) {
        console.error("❌ [confirmarYEliminar] Error:", e); // ✅ General Error
        let mensaje = e.message || "No se pudo eliminar el usuario.";
        
        if (e.code === "auth/wrong-password") {
          mensaje = "Password de administrador incorrecta.";
        } else if (e.message.includes("backend")) {
           mensaje = `Error del servidor: ${e.message}`;
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

    const alertTitle = "Eliminar Usuario";
    const alertMessage =
      `¿Seguro que querés eliminar a "${userName}"?\n\n` +
      `Esto eliminará:\n` +
      `- Usuario de Autenticación (Auth)\n` +
      `- Documento de Usuario (Firestore)\n` +
      `- TODAS sus recetas\n` +
      `- TODOS sus pedidos\n\n` +
      `ACCIÓN IRREVERSIBLE.`;

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

  const eliminarRecetasDeUsuario = async (userId: string) => {
    try {
      const recetasRef = collection(db, "recetas");
      const q = query(recetasRef, where("userId", "==", userId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return;
      }

      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

    } catch (e) {
      console.error("❌ [eliminarRecetasDeUsuario] Error:", e); // ✅ Error
      throw e;
    }
  };

  const eliminarPedidosDeUsuario = async (userId: string) => {
    try {
      const pedidosRef = collection(db, "pedidos");
      const q = query(pedidosRef, where("userId", "==", userId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return;
      }

      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();

    } catch (e) {
      console.error("❌ [eliminarPedidosDeUsuario] Error:", e); // ✅ Error
      throw e;
    }
  };

  const renderItem = ({ item }: { item: UserItem }) => {
    const name =
      `${item.firstName ?? ""} ${item.lastName ?? ""}`.trim() ||
      item.email ||
      "Sin nombre";
    
    const isDeleting = deleting === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.itemContent}>
          <View style={styles.itemInfo}>
            <Text style={styles.name}>{name}</Text>
            {item.email ? <Text style={styles.email}>{item.email}</Text> : null}
            <Text style={styles.role}>Rol: {item.role ?? "no definido"}</Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && !isDeleting && styles.deleteButtonPressed,
              isDeleting && styles.deleteButtonDisabled,
            ]}
            onPress={() => handleEliminarUsuario(item)}
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

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <BackButton />
        <Text style={styles.title}>Usuarios registrados</Text>

        {loading && (
          <View style={styles.centerRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Cargando usuarios...</Text>
          </View>
        )}

        {error && !loading && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {!loading && !error && (
          <FlatList
            data={usuarios}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingVertical: 8 }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No hay usuarios registrados todavía.
              </Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 8,
  },
  loadingText: {
    color: colors.textSecondary,
  },
  errorText: {
    color: colors.error,
    marginVertical: 8,
  },
  emptyText: {
    marginTop: 16,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  email: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  role: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textTertiary,
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
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
});