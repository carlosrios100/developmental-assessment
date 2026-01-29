import { Tabs } from 'expo-router';
import { Home, Users, FileText, Bot, Menu } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingTop: 8,
          paddingBottom: 8,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#3b82f6',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'DevAssess',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="children"
        options={{
          title: 'Children',
          headerTitle: 'My Children',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          headerTitle: 'AI Reports',
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai-info"
        options={{
          title: 'AI Info',
          headerTitle: 'AI & Privacy',
          tabBarIcon: ({ color, size }) => <Bot size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          headerTitle: 'More Options',
          tabBarIcon: ({ color, size }) => <Menu size={size} color={color} />,
        }}
      />
      {/* Hidden tabs - accessible via navigation */}
      <Tabs.Screen
        name="videos"
        options={{
          href: null, // Hide from tab bar
          headerTitle: 'Video Library',
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          href: null, // Hide from tab bar
          headerTitle: 'Development Progress',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null, // Hide from tab bar
          headerTitle: 'Settings',
        }}
      />
    </Tabs>
  );
}
