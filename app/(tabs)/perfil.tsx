import { Ionicons } from "@expo/vector-icons";
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { auth, db } from "../../src/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { colors } from "../../assets/styles";
import { ObraSocial } from "../../assets/types";
import { showError } from "../../src/components/common/tdhelper";

export default function PerfilUsuarioCard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    dni: "",
    birthDate: "",
    phone: "",
    email: "",
    obraSocial: { name: "Sin obra social", number: "" } as ObraSocial,
  });

  useFocusEffect(
    useCallback(() => {
      loadUserData();
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
        setUserData({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          dni: data.dni || "",
          birthDate: data.birthDate || "",
          phone: data.phone || "Sin teléfono",
          email: user.email || "",
          obraSocial: data.obraSocial || { name: "Sin obra social", number: "" },
        });
      }
    } catch (error) {
      console.log(" ❌❌❌Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPress = () => {
    router.push("/perfil/editar-perfil");
  };

  const handleChangePassword = () => {
    router.push("/perfil/change-password");
  };

  const handleLogout = async () => {
    const performLogout = async () => {
      try {
        await signOut(auth);
        // El AuthGuard se encargará de redirigir
      } catch (error) {
        console.log(" ❌❌❌ Error al cerrar sesión:", error);
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
  };

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  const nombreCompleto = `${userData.firstName} ${userData.lastName}`.trim() || "Usuario";
  const obraSocialDisplay = userData.obraSocial.name === "Sin obra social" 
    ? "Sin obra social"
    : `${userData.obraSocial.name}${userData.obraSocial.number ? ` - ${userData.obraSocial.number}` : ""}`;

  return (
    <View style={styles.container}>
      {/* Tarjeta de perfil */}
      <View style={styles.card}>
        {/* Header con nombre */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={28} color={colors.primary} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.nombreCompleto}>{nombreCompleto}</Text>
            <Text style={styles.email}>{userData.email}</Text>
          </View>
        </View>

        {/* Info Grid - 2 columnas */}
        <View style={styles.infoGrid}>
          {/* DNI */}
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="card-outline" size={16} color={colors.textSecondary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>DNI</Text>
              <Text style={styles.infoValue}>{userData.dni || "No config."}</Text>
            </View>
          </View>

          {/* Fecha Nacimiento */}
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Nacimiento</Text>
              <Text style={styles.infoValue}>{userData.birthDate || "No config."}</Text>
            </View>
          </View>

          {/* Teléfono */}
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Teléfono</Text>
              <Text style={styles.infoValue}>{userData.phone}</Text>
            </View>
          </View>

          {/* Obra Social */}
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="medical-outline" size={16} color={colors.textSecondary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Obra Social</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{obraSocialDisplay}</Text>
            </View>
          </View>
        </View>

        {/* Botón Editar */}
        <Pressable
          style={({ pressed }) => [
            styles.editButton,
            pressed && styles.editButtonPressed,
          ]}
          onPress={handleEditPress}
        >
          <Ionicons name="create-outline" size={18} color={colors.primary} />
          <Text style={styles.editButtonText}>Editar perfil</Text>
        </Pressable>
      </View>

      {/* Botón Cambiar Contraseña */}
      <Pressable
        style={({ pressed }) => [
          styles.secondaryButton,
          pressed && styles.secondaryButtonPressed,
        ]}
        onPress={handleChangePassword}
      >
        <Ionicons name="key-outline" size={20} color={colors.primary} />
        <Text style={styles.secondaryButtonText}>Cambiar Contraseña</Text>
      </Pressable>

      {/* Botón Cerrar Sesión */}
      <Pressable
        style={({ pressed }) => [
          styles.dangerButton,
          pressed && styles.dangerButtonPressed,
        ]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.dangerButtonText}>Cerrar Sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight || colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  nombreCompleto: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  email: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    width: "48%",
  },
  infoIcon: {
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  editButtonPressed: {
    opacity: 0.7,
    backgroundColor: colors.primaryLight || colors.background,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryButtonPressed: {
    opacity: 0.7,
    backgroundColor: colors.primaryLight || colors.background,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },
  dangerButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.error,
  },
  dangerButtonPressed: {
    opacity: 0.7,
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.error,
  },
});