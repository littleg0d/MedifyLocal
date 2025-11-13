
const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://medifybackend.onrender.com";

if (API_URL.includes("localhost")) {
  console.warn(
    `ADVERTENCIA: La API está apuntando a un servidor local: ${API_URL}`
  );
}

export { API_URL };