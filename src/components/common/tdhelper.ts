import { Platform, Alert } from "react-native";

export type ToastType = "error" | "success" | "info";

interface ToastOptions {
  message: string;
  type?: ToastType;
  title?: string;
}

export const showToast = ({ message, type = "info", title }: ToastOptions) => {
  let defaultTitle = "Informacion";
  
  switch (type) {
    case "error":
      defaultTitle = "Error";
      break;
    case "success":
      defaultTitle = "Listo";
      break;
    case "info":
      defaultTitle = "Informacion";
      break;
  }

  const finalTitle = title || defaultTitle;

  if (Platform.OS === "web") {
    window.alert(`${finalTitle}: ${message}`);
  } else {
    Alert.alert(finalTitle, message);
  }
};

// Funciones helper especificas
export const showError = (message: string, title?: string) => {
  showToast({ message, type: "error", title });
};

export const showSuccess = (message: string, title?: string) => {
  showToast({ message, type: "success", title });
};

export const showInfo = (message: string, title?: string) => {
  showToast({ message, type: "info", title });
};