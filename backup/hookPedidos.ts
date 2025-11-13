import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
  Timestamp,
} from "firebase/firestore";

import { db, auth } from "../../src/lib/firebase";
import { 
  Pedido, 
  EstadoPedido, 
  PedidoActivoReceta ,
  PAYMENT_CONFIG 
} from "../../assets/types";

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
    const pedidosRef = collection(db, 'pedidos');
    const q = query(
      pedidosRef,
      where('userId', '==', userId),
      orderBy('fechaCreacion', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const pedidosData = querySnapshot.docs.map(doc => 
          mapPedidoFromFirestore(doc.id, doc.data())
        );
        
        setPedidos(pedidosData);
        setLoading(false);
      },
      (error) => {
        console.error('Error en usePedidosDelUsuario:', error);
        setError(error);
        setPedidos([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { pedidos, loading , error};
}

/**
 * Hook que obtiene el último pedido de una receta específica en tiempo real
 */
export function useUltimoPedidoPorReceta(recetaId: string | null) {
  const [pedido, setPedido] = useState<PedidoActivoReceta | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const userId = auth.currentUser?.uid;

    if (!userId || !recetaId) {
      setLoading(false);
      setPedido(null);
      return;
    }

    setLoading(true);
    const pedidosRef = collection(db, 'pedidos');
    const q = query(
      pedidosRef,
      where('userId', '==', userId),
      where('recetaId', '==', recetaId),
      
      // Filtramos solo por los estados que bloquean la receta,
      // usando la constante importada de 'types.ts'.
      where('estado', 'in', [...PAYMENT_CONFIG.ESTADOS_BLOQUEANTES]),
      orderBy('fechaCreacion', 'desc'),
      limit(1) // Traer el más reciente DE LOS BLOQUEANTES
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
          nombreComercialFarmacia: data.nombreComercial || 'Farmacia',
          precio: data.precio,
          fechaCreacion: (data.fechaCreacion as Timestamp).toDate(),
          paymentId: data.paymentId,
        });
        
        setLoading(false);
      },
      (error) => {
        console.error('Error en useUltimoPedidoPorReceta:', error);
        setPedido(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [recetaId]);

  return { pedido, loading };
}



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
    fechaPago: data.fechaPago 
      ? (data.fechaPago as Timestamp).toDate() 
      : null,
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