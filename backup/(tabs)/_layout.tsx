import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#16A34A',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      
      {/* HOME */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "home" : "home-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />

      {/* RECETAS */}
      <Tabs.Screen
        name="recetas"
        options={{
          title: 'Mis Recetas',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "receipt" : "receipt-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />

      {/* PEDIDOS */}
      <Tabs.Screen
        name="pedidos"
        options={{
          title: 'Mis Pedidos',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "cube" : "cube-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />

      {/* PERFIL */}
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "person" : "person-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />

      {/* SOLICITUDES - OCULTO DEL TAB BAR */}
      <Tabs.Screen
        name="solicitudes"
        options={{
          href: null, // Esto oculta la pantalla del tab bar
          title: 'Solicitudes',
        }}
      />
    </Tabs>
  );
}