import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  ActivityIndicator, 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../src/lib/firebase";
import {
  doc,
  getDoc,
} from "firebase/firestore"; 
import { globalStyles, colors } from "../../assets/styles";
import { signOut } from "firebase/auth"; 

interface Farmacia {
  id: string;
  nombreComercial?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  horario?: string;
  usuario?: string;
}

// Dashboard principal de la farmacia
export default function FarmaciaHome() {
  const router = useRouter();
  const [farmacia, setFarmacia] = useState<Farmacia | null>(null);
  const [loading, setLoading] = useState(true);

  // Carga de datos
  useEffect(() => {
    // El _layout ya verifico al usuario. Solo cargamos sus datos.
    const user = auth.currentUser;
    if (user) {
      loadFarmacia(user.uid); // ✅ Firebase Interaction
    } else {
      // Si por alguna razon no hay usuario, redirigir (fallback)
      router.replace("/auth/login");
    }
  }, []);

  // Funcion para traer los datos del doc de la farmacia
  const loadFarmacia = async (uid: string) => {
    try {
      setLoading(true);

      const farmaciaRef = doc(db, "farmacias", uid);
      const farmaciaSnap = await getDoc(farmaciaRef); // ✅ Firebase Interaction

      if (!farmaciaSnap.exists()) {
        Alert.alert(
          "Error de cuenta",
          "No encontramos una farmacia asociada a esta cuenta."
        );
        setFarmacia(null);
        await signOut(auth); // ✅ Firebase Interaction
        return;
      }

      const data = farmaciaSnap.data();

      setFarmacia({
        id: farmaciaSnap.id,
        nombreComercial: data.nombreComercial,
        email: data.email,
        telefono: data.telefono,
        direccion: data.direccion,
        horario: data.horario,
        usuario: data.usuario,
      });
    } catch (error) {
      console.log("❌❌❌❌ Error cargando farmacia:", error); // ✅ General Error
      Alert.alert("Error", "No pudimos cargar los datos de la farmacia.");
    } finally {
      setLoading(false);
    }
  };

  // Logica de logout
  const handleLogout = async () => {
    
    const confirmLogout = async () => {
      try {
        await signOut(auth); // ✅ Firebase Interaction
        // El _layout.tsx detectara el cambio y redirigira
      } catch (error) {
        console.log("❌❌❌❌ Error al cerrar sesión:", error); // ✅ General Error
        // -----------------------
        if (Platform.OS === 'web') {
            window.alert("No pudimos cerrar sesión. Intentá nuevamente.");
        } else {
          Alert.alert("Error", "No pudimos cerrar sesión. Intentá nuevamente.");
        }
      }
    };

    // Alerta de confirmacion (distinta para web y native)
    if (Platform.OS === 'web') {
      if (window.confirm("¿Querés salir de la cuenta de farmacia?")) {
        await confirmLogout();
      }
    } else {
      Alert.alert("Cerrar sesión", "¿Querés salir de la cuenta de farmacia?", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salir",
          style: "destructive",
          onPress: confirmLogout,
        },
      ]);
    }
  };

  // Render de carga
  if (loading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={styles.centerRow}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando farmacia...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render principal
  return (
    <SafeAreaView style={globalStyles.container} edges={["top", "bottom"]}>
      <ScrollView
        style={globalStyles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="business-outline" size={26} color={colors.primaryDark} />
            <View>
              <Text style={styles.title}>
                {farmacia?.nombreComercial ?? "Farmacia"}
              </Text>
              <Text style={styles.subtitle}>Panel de farmacia</Text>
            </View>
          </View>
        </View>

        {/* Info principal */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Datos de la farmacia</Text>
            <Pressable
              style={({ pressed }) => [
                styles.editButton,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => router.push("/farmacia/editar-perfil")}
            >
              <Ionicons name="create-outline" size={18} color={colors.primary} />
              <Text style={styles.editButtonText}>Editar</Text>
            </Pressable>
          </View>

          <View style={styles.row}>
            <Ionicons name="mail-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.rowText}>
              {farmacia?.email ?? auth.currentUser?.email ?? "Sin email"}
            </Text>
          </View>

          {farmacia?.telefono ? (
            <View style={styles.row}>
              <Ionicons name="call-outline" size={20} color={colors.textTertiary} />
              <Text style={styles.rowText}>{farmacia.telefono}</Text>
            </View>
          ) : null}

          {farmacia?.direccion ? (
            <View style={styles.row}>
              <Ionicons name="location-outline" size={20} color={colors.textTertiary} />
              <Text style={styles.rowText}>{farmacia.direccion}</Text>
            </View>
          ) : null}

          {farmacia?.horario ? (
            <View style={styles.row}>
              <Ionicons name="time-outline" size={20} color={colors.textTertiary} />
              <Text style={styles.rowText}>{farmacia.horario}</Text>
            </View>
          ) : null}
        </View>

        {/* Acciones principales */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => router.push("/farmacia/pedidos")}
          >
            <Ionicons name="cart-outline" size={20} color="white" />
            <Text style={styles.actionText}>Pedidos</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButtonSecondary,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => router.push("/farmacia/recetas-sin-responder")}
          >
            <Ionicons name="document-text-outline" size={20} color="white" />
            <Text style={styles.actionText}>Recetas sin responder</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => router.push("/farmacia/mis-cotizaciones")}
          >
            <Ionicons name="pricetag-outline" size={20} color="white" />
            <Text style={styles.actionText}>Mis Cotizaciones</Text>
          </Pressable>
        </View>

        {/* Cerrar sesion */}
        <View style={styles.logoutContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && { opacity: 0.8 },
            ]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={styles.secondaryText}>Cerrar sesión</Text>
          </Pressable>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// (Estilos sin cambios)
const styles = StyleSheet.create({
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  header: {
    width: "100%",
    maxWidth: 500,
    marginBottom: 20,
    paddingTop: 8,
  },
  headerContent: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
    width: "100%",
    maxWidth: 500,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  actions: {
    marginTop: 24,
    gap: 12,
    width: "100%",
    maxWidth: 500,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionButtonSecondary: {
    backgroundColor: colors.primaryDark,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  logoutContainer: {
    marginTop: 32,
    width: "100%",
    maxWidth: 500,
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.error,
    width: "100%",
  },
  secondaryText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  centerRow: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8, 
  },
  loadingText: {
    color: colors.textSecondary,
  },
});