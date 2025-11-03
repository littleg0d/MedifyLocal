
// ========== pedidos.tsx ==========
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { globalStyles, colors } from "../../assets/styles";
export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);

  return (
    <SafeAreaView style={globalStyles.container} edges={["top"]}>
      <View style={globalStyles.header}>
        <View style={{ width: 48 }} />
        <Text style={globalStyles.titleMedium}>Mis Pedidos</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView style={{ flex: 1 }}>
        <View style={globalStyles.emptyContainer}>
          <View style={globalStyles.iconContainerRound}>
            <Ionicons name="cube-outline" size={64} color={colors.textMutedDark} />
          </View>
          <Text style={globalStyles.emptyTitle}>Sin pedidos aún</Text>
          <Text style={globalStyles.emptyText}>
            Cuando realices tu primer pedido, aparecerá aquí
          </Text>
        </View>

        <View style={globalStyles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}