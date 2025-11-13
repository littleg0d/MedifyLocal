// app/admin/farmacias.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../assets/styles";
import { db } from "../../src/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

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
  const [error, setError] = useState<string>("");

  useEffect(() => {
    loadFarmacias();
  }, []);

  const loadFarmacias = async () => {
    try {
      setLoading(true);
      setError("");

      const farmaciasRef = collection(db, "farmacias");
      let q = query(farmaciasRef);

      // Si tenés campo createdAt, podés usar:
      // q = query(farmaciasRef, orderBy("createdAt", "desc"));

      const snapshot = await getDocs(q);
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
    } catch (e) {
      console.error("Error cargando farmacias:", e);
      setError("No pudimos cargar las farmacias.");
      Alert.alert("Error", "No pudimos cargar las farmacias.");
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: FarmaciaItem }) => {
    const nombre =
      item.nombreComercial ||
      item.usuario ||
      item.email ||
      "Farmacia sin nombre";

    return (
      <View style={styles.item}>
        <View>
          <Text style={styles.name}>{nombre}</Text>
          {item.usuario ? (
            <Text style={styles.subtext}>Usuario: {item.usuario}</Text>
          ) : null}
          {item.email ? (
            <Text style={styles.subtext}>Email: {item.email}</Text>
          ) : null}
          <Text style={styles.roleText}>Rol: {item.role ?? "farmacia"}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏥 Lista de Farmacias</Text>

      {loading && (
        <View style={styles.centerRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando farmacias...</Text>
        </View>
      )}

      {error && !loading && <Text style={styles.errorText}>{error}</Text>}

      {!loading && !error && (
        <FlatList
          data={farmacias}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Todavía no hay farmacias registradas.
            </Text>
          }
        />
      )}

      <Pressable
        style={styles.addButton}
        onPress={() => router.push("/admin/crearfarmacias")}
      >
        <Ionicons name="add-circle-outline" size={22} color="white" />
        <Text style={styles.addButtonText}>Agregar Farmacia</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16, color: colors.textPrimary },
  item: {
    backgroundColor: "#f9f9f9",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  name: { fontSize: 16, fontWeight: "600", color: colors.textPrimary },
  subtext: { fontSize: 13, color: "#666", marginTop: 2 },
  roleText: { fontSize: 12, color: colors.textTertiary, marginTop: 4 },
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
  addButtonText: { color: "white", fontWeight: "600", fontSize: 16 },
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 8,
  },
  loadingText: { color: colors.textSecondary },
  errorText: { color: colors.error, marginVertical: 8 },
  emptyText: { marginTop: 16, color: colors.textSecondary },
});
