import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
  Timestamp,
  Query,
  DocumentData,
} from "firebase/firestore";

import { db, auth } from "./firebase";
import {
  Pedido,
  EstadoPedido,
  PedidoActivoReceta,
  Cotizacion,
  PAYMENT_CONFIG,
} from "../../assets/types";


// HOOK GENERICO BASE

/**
 * Hook generico para suscripciones en tiempo real a Firestore
 */
function useFirestoreSubscription<T>(
  queryBuilder: () => Query<DocumentData> | null,
  mapper: (id: string, data: any) => T,
  deps: any[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = queryBuilder();

    if (!q) {
      setLoading(false);
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const items = querySnapshot.docs.map((doc) =>
          mapper(doc.id, doc.data())
        );
        setData(items);
        setLoading(false);
      },
      (err) => {
        console.error("Error en suscripción Firestore:", err);
        setError(err);
        setData([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, deps);

  return { data, loading, error };
}


// HOOKS DE PEDIDOS

/**
 * Hook que obtiene todos los pedidos del usuario actual en tiempo real
 */
export function usePedidosDelUsuario() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const userId = auth.currentUser?.uid;

    if (!userId) {
      setLoading(false);
      setPedidos([]);
      return;
    }

    setLoading(true);
    setError(null);

    const pedidosRef = collection(db, "pedidos");
    const q = query(
      pedidosRef,
      where("userId", "==", userId),
      orderBy("fechaCreacion", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const pedidosData = querySnapshot.docs.map((doc) =>
          mapPedidoFromFirestore(doc.id, doc.data())
        );

        setPedidos(pedidosData);
        setLoading(false);
      },
      (err) => {
        console.error("Error en usePedidosDelUsuario:", err);
        setError(err);
        setPedidos([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { pedidos, loading, error };
}

/**
 * Hook que obtiene el ultimo pedido bloqueante de una receta específica en tiempo real
 */
export function useUltimoPedidoPorReceta(recetaId: string | null) {
  const [pedido, setPedido] = useState<PedidoActivoReceta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const userId = auth.currentUser?.uid;

    if (!userId || !recetaId) {
      setLoading(false);
      setPedido(null);
      return;
    }

    setLoading(true);
    setError(null);

    const pedidosRef = collection(db, "pedidos");
    const q = query(
      pedidosRef,
      where("userId", "==", userId),
      where("recetaId", "==", recetaId),
      where("estado", "in", [...PAYMENT_CONFIG.ESTADOS_BLOQUEANTES]),
      orderBy("fechaCreacion", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        if (querySnapshot.empty) {
          setPedido(null);
          setLoading(false);
          return;
        }

        const doc = querySnapshot.docs[0];
        const data = doc.data();

        setPedido({
          id: doc.id,
          estado: data.estado as EstadoPedido,
          cotizacionId: data.cotizacionId,
          nombreComercialFarmacia: data.nombreComercial || "Farmacia",
          precio: data.precio,
          fechaCreacion: (data.fechaCreacion as Timestamp).toDate(),
          paymentId: data.paymentId,
        });

        setLoading(false);
      },
      (err) => {
        console.error("Error en useUltimoPedidoPorReceta:", err);
        setError(err);
        setPedido(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [recetaId]);

  return { pedido, loading, error };
}


// HOOKS DE COTIZACIONES

/**
 * Hook que obtiene las cotizaciones de una receta en tiempo real
 */
export function useCotizaciones(recetaId: string | null) {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!recetaId) {
      setLoading(false);
      setCotizaciones([]);
      return;
    }

    setLoading(true);
    setError(null);

    const cotizacionesRef = collection(db, "recetas", recetaId, "cotizaciones");
    const q = query(
      cotizacionesRef,
      orderBy("estado", "asc") // Muestra cotizados primero
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const cotizacionesData = querySnapshot.docs.map((doc) =>
          mapCotizacionFromFirestore(doc.id, doc.data())
        );

        setCotizaciones(cotizacionesData);
        setLoading(false);
      },
      (err) => {
        console.error("Error en useCotizaciones:", err);
        setError(err);
        setCotizaciones([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [recetaId]);

  return { cotizaciones, loading, error };
}


// FUNCIONES DE MAPEO


/**
 * Mapea los datos de Firestore al tipo Pedido
 */
function mapPedidoFromFirestore(id: string, data: any): Pedido {
  return {
    id,
    userId: data.userId,
    recetaId: data.recetaId,
    cotizacionId: data.cotizacionId,
    farmaciaId: data.farmaciaId,
    precio: data.precio,
    estado: data.estado as EstadoPedido,
    fechaCreacion: (data.fechaCreacion as Timestamp).toDate(),
    fechaPago: data.fechaPago ? (data.fechaPago as Timestamp).toDate() : null,
    fechaCierre: data.fechaCierre
      ? (data.fechaCierre as Timestamp).toDate()
      : undefined,
    paymentId: data.paymentId,
    paymentStatus: data.paymentStatus,
    nombreComercial: data.nombreComercial,
    addressUser: data.addressUser,
    imagenUrl: data.imagenUrl,
  };
}

/**
 * Mapea los datos de Firestore al tipo Cotizacion
 */
function mapCotizacionFromFirestore(id: string, data: any): Cotizacion {
  return {
    id,
    farmaciaId: data.farmaciaId,
    nombreComercial: data.nombreComercial,
    direccion: data.direccion,
    precio: data.precio,
    estado: data.estado,
    fechaCreacion: (data.fechaCreacion as Timestamp).toDate(),
    imagenUrl: data.imagenUrl,
  };
}