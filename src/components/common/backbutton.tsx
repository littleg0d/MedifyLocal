
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../../../assets/styles";

interface BackButtonProps {
  label?: string;
  onPress?: () => void;
}

export default function BackButton({ label = "Volver", onPress }: BackButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
      ]}
      onPress={handlePress}
    >
      <Ionicons name="arrow-back" size={20} color={colors.primary} />
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  buttonPressed: {
    opacity: 0.6,
  },
  text: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "500",
  },
});