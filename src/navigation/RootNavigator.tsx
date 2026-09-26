import React from 'react';
import { View, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Sparkles,
  Package,
  ShoppingBag,
  Clock,
  LogOut,
} from 'lucide-react-native';

import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/theme';

// Screen Imports
import { AuthScreen } from '../screens/auth/AuthScreen';
import { CreateProductScreen } from '../screens/artisan/CreateProductScreen';
import { InventoryScreen } from '../screens/artisan/InventoryScreen';
import { MarketplaceScreen } from '../screens/buyer/MarketplaceScreen';
import { MyOrdersScreen } from '../screens/buyer/MyOrdersScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Artisan Bottom Tabs
const ArtisanTabNavigator = () => {
  const { logout } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.artisan.primary,
        tabBarInactiveTintColor: Colors.neutral.muted,
        tabBarStyle: styles.tabBar,
        headerStyle: { backgroundColor: Colors.neutral.card },
        headerTitleStyle: styles.headerTitle,
        headerRight: () => (
          <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.7}>
            <LogOut size={20} color={Colors.artisan.primary} />
          </TouchableOpacity>
        ),
      }}
    >
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          title: 'Inventory & Stock',
          tabBarLabel: 'Stock',
          tabBarIcon: ({ color, size }) => <Package size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="CreateProduct"
        component={CreateProductScreen}
        options={{
          title: 'AI Product Studio',
          tabBarLabel: 'Add Craft',
          tabBarIcon: ({ color, size }) => <Sparkles size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

// Buyer Bottom Tabs
const BuyerTabNavigator = () => {
  const { logout } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.buyer.primary,
        tabBarInactiveTintColor: Colors.neutral.muted,
        tabBarStyle: styles.tabBar,
        headerStyle: { backgroundColor: Colors.neutral.card },
        headerTitleStyle: styles.headerTitle,
        headerRight: () => (
          <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.7}>
            <LogOut size={20} color={Colors.buyer.primary} />
          </TouchableOpacity>
        ),
      }}
    >
      <Tab.Screen
        name="Marketplace"
        component={MarketplaceScreen}
        options={{
          title: 'Direct Craft Market',
          tabBarLabel: 'Discover',
          tabBarIcon: ({ color, size }) => <ShoppingBag size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="MyOrders"
        component={MyOrdersScreen}
        options={{
          title: 'My Purchases',
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, size }) => <Clock size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

// Root Navigator with Auth Branching
export const RootNavigator = () => {
  const { user, token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.artisan.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!token || !user ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : user.role === 'artisan' ? (
          <Stack.Screen name="ArtisanHome" component={ArtisanTabNavigator} />
        ) : (
          <Stack.Screen name="BuyerHome" component={BuyerTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral.background,
  },
  tabBar: {
    backgroundColor: Colors.neutral.card,
    borderTopColor: Colors.neutral.border,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 18,
    color: Colors.neutral.text,
  },
  logoutBtn: {
    marginRight: 16,
    padding: 6,
  },
});