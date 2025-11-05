// scripts/seedRecetas.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCN-3foF88tiQ-IXs7jOekpQfqSfN9cyw4",
  authDomain: "medify-850f3.firebaseapp.com",
  projectId: "medify-850f3",
  storageBucket: "medify-850f3.firebasestorage.app",
  messagingSenderId: "580228292877",
  appId: "1:580228292877:web:e29f241aa5450fd3015044",
  measurementId: "G-QDT2SX0S35"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const IMAGENES_RECETAS = [
  "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400",
  "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400",
  "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400",
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400",
  "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400",
];

async function seedRecetas() {
  try {
    console.log("🚀 Iniciando seed de recetas...");

    const USER_ID = "jdIDKuPYy0ZumjxrRWHZt0ORE0H3";

    // ========== RECETA 1: Sin cotizaciones ==========
    console.log("\n📄 Receta 1 (sin cotizaciones)...");
    const receta1Ref = await addDoc(collection(db, "recetas"), {
      userId: USER_ID,
      imagenUrl: IMAGENES_RECETAS[0],
      fechaCreacion: new Date(2024, 10, 1),
      estado: "esperando_respuestas",
      cotizacionesCount: 0,
    });
    console.log(`✅ ${receta1Ref.id}`);

    // ========== RECETA 2: Con 3 cotizaciones ==========
    console.log("\n📄 Receta 2 (con cotizaciones)...");
    const receta2Ref = await addDoc(collection(db, "recetas"), {
      userId: USER_ID,
      imagenUrl: IMAGENES_RECETAS[1],
      fechaCreacion: new Date(2024, 10, 3),
      estado: "farmacias_respondiendo",
      cotizacionesCount: 3,
    });
    console.log(`✅ ${receta2Ref.id}`);

    await addDoc(collection(db, "recetas", receta2Ref.id, "cotizaciones"), {
      farmaciaId: "farm_1",
      nombreComercial: "Farmacia del Sol",
      direccion: "Av. Siempre Viva 123",
      precio: 1550.00,
      estado: "cotizado",
      fechaCreacion: new Date(2024, 10, 3, 10, 30),
    });

    await addDoc(collection(db, "recetas", receta2Ref.id, "cotizaciones"), {
      farmaciaId: "farm_2",
      nombreComercial: "Farmacia Central",
      direccion: "Calle Falsa 456",
      estado: "sin_stock",
      fechaCreacion: new Date(2024, 10, 3, 11, 0),
    });

    await addDoc(collection(db, "recetas", receta2Ref.id, "cotizaciones"), {
      farmaciaId: "farm_3",
      nombreComercial: "Farma Vida",
      direccion: "Bulevar de los Sueños 789",
      estado: "ilegible",
      fechaCreacion: new Date(2024, 10, 3, 12, 15),
    });
    console.log("  💊 3 cotizaciones");

    // ========== RECETA 3: Sin cotizaciones ==========
    console.log("\n📄 Receta 3 (sin cotizaciones)...");
    const receta3Ref = await addDoc(collection(db, "recetas"), {
      userId: USER_ID,
      imagenUrl: IMAGENES_RECETAS[2],
      fechaCreacion: new Date(2024, 10, 5),
      estado: "esperando_respuestas",
      cotizacionesCount: 0,
    });
    console.log(`✅ ${receta3Ref.id}`);

    // ========== RECETA 4: Con 5 cotizaciones ==========
    console.log("\n📄 Receta 4 (con cotizaciones)...");
    const receta4Ref = await addDoc(collection(db, "recetas"), {
      userId: USER_ID,
      imagenUrl: IMAGENES_RECETAS[3],
      fechaCreacion: new Date(2024, 10, 7),
      estado: "farmacias_respondiendo",
      cotizacionesCount: 5,
    });
    console.log(`✅ ${receta4Ref.id}`);

    await addDoc(collection(db, "recetas", receta4Ref.id, "cotizaciones"), {
      farmaciaId: "farm_1",
      nombreComercial: "Farmacia del Sol",
      direccion: "Av. Siempre Viva 123",
      precio: 2200.00,
      estado: "cotizado",
      fechaCreacion: new Date(2024, 10, 7, 9, 0),
    });

    await addDoc(collection(db, "recetas", receta4Ref.id, "cotizaciones"), {
      farmaciaId: "farm_4",
      nombreComercial: "Farmacia La Salud",
      direccion: "Av. Libertador 1500",
      precio: 1875.00,
      estado: "cotizado",
      fechaCreacion: new Date(2024, 10, 7, 9, 30),
    });

    await addDoc(collection(db, "recetas", receta4Ref.id, "cotizaciones"), {
      farmaciaId: "farm_5",
      nombreComercial: "Farmacia Plus",
      direccion: "Calle Corrientes 890",
      estado: "esperando",
      fechaCreacion: new Date(2024, 10, 7, 10, 0),
    });

    await addDoc(collection(db, "recetas", receta4Ref.id, "cotizaciones"), {
      farmaciaId: "farm_2",
      nombreComercial: "Farmacia Central",
      direccion: "Calle Falsa 456",
      precio: 2550.00,
      estado: "cotizado",
      fechaCreacion: new Date(2024, 10, 7, 11, 0),
    });

    await addDoc(collection(db, "recetas", receta4Ref.id, "cotizaciones"), {
      farmaciaId: "farm_6",
      nombreComercial: "Farmacia Express",
      direccion: "Av. Santa Fe 2200",
      estado: "sin_stock",
      fechaCreacion: new Date(2024, 10, 7, 12, 30),
    });
    console.log("  💊 5 cotizaciones");

    // ========== RECETA 5: Finalizada ==========
    console.log("\n📄 Receta 5 (finalizada)...");
    const receta5Ref = await addDoc(collection(db, "recetas"), {
      userId: USER_ID,
      imagenUrl: IMAGENES_RECETAS[4],
      fechaCreacion: new Date(2024, 10, 10),
      estado: "finalizada",
      cotizacionesCount: 2,
    });
    console.log(`✅ ${receta5Ref.id}`);

    const cot1 = await addDoc(collection(db, "recetas", receta5Ref.id, "cotizaciones"), {
      farmaciaId: "farm_1",
      nombreComercial: "Farmacia del Sol",
      direccion: "Av. Siempre Viva 123",
      precio: 1800.00,
      estado: "cotizado",
      fechaCreacion: new Date(2024, 10, 10, 8, 0),
    });

    await addDoc(collection(db, "recetas", receta5Ref.id, "cotizaciones"), {
      farmaciaId: "farm_4",
      nombreComercial: "Farmacia La Salud",
      direccion: "Av. Libertador 1500",
      precio: 1700.00,
      estado: "cotizado",
      fechaCreacion: new Date(2024, 10, 10, 9, 0),
    });
    console.log("  💊 2 cotizaciones");

    // Crear un PEDIDO de ejemplo para la receta 5
    console.log("\n📦 Creando pedido de ejemplo...");
    await addDoc(collection(db, "pedidos"), {
      userId: USER_ID,
      recetaId: receta5Ref.id,
      cotizacionId: cot1.id,
      farmaciaId: "farm_1",
      precio: 1800.00,
      estado: "pagado",
      fechaCreacion: new Date(2024, 10, 10, 10, 0),
      fechaPago: new Date(2024, 10, 10, 10, 5),
    });
    console.log("✅ Pedido creado");

    console.log("\n✨ Seed completado!");
    console.log("\n📊 Resumen:");
    console.log("   - 5 recetas");
    console.log("   - 10 cotizaciones");
    console.log("   - 1 pedido");

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

seedRecetas();