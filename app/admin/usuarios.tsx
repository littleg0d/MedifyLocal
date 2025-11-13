import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../src/lib/firebase";
import { colors } from "../../assets/styles";

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

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        setLoading(true);
        setError(null);

        const usersRef = collection(db, "users");
        const q = query(usersRef, orderBy("createdAt", "desc")); // si no existe createdAt, igual funciona pero sin ordenar
        const snapshot = await getDocs(q);

        const data: UserItem[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data() as any;
          return {
            id: docSnap.id,
            email: d.email,
            firstName: d.firstName,
            lastName: d.lastName,
            role: d.role,
          };
        });

        setUsuarios(data);
      } catch (e) {
        console.error("Error cargando usuarios:", e);
        setError("No pudimos cargar la lista de usuarios.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsuarios();
  }, []);

  const renderItem = ({ item }: { item: UserItem }) => {
    const name =
      `${item.firstName ?? ""} ${item.lastName ?? ""}`.trim() ||
      item.email ||
      "Sin nombre";

    return (
      <View style={styles.card}>
        <Text style={styles.name}>{name}</Text>
        {item.email ? <Text style={styles.email}>{item.email}</Text> : null}
        <Text style={styles.role}>Rol: {item.role ?? "no definido"}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
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
});