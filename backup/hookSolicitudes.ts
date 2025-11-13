import { useState, useEffect } from "react";
import { collection, query, onSnapshot, Timestamp, orderBy } from "firebase/firestore";
import { db } from "../../src/lib/firebase";
import { Cotizacion } from "../../assets/types";

/**
 * Hook que obtiene las cotizaciones de una receta en tiempo real
 */
export function usarCotizaciones(recetaId: string | null) {
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
    const cotizacionesRef = collection(db, 'recetas', recetaId, 'cotizaciones');
    const q = query(
      cotizacionesRef, 
    orderBy('estado', 'asc'), // Muestra "cotizado" primero
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const cotizacionesData = querySnapshot.docs.map(doc => 
          mapearCotizacion(doc.id, doc.data())
        );
        
        setCotizaciones(cotizacionesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error en usarCotizaciones:', error);
        setError(error);
        setCotizaciones([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [recetaId]);

  return { cotizaciones, loading , error};
}

/**
 * Mapea los datos de Firestore al tipo Cotizacion
 */
function mapearCotizacion(id: string, data: any): Cotizacion {
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