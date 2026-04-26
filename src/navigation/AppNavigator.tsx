import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import ArticlesScreen from '../screens/ArticlesScreen';
import LoginScreen from '../screens/LoginScreen';
import ArticleDetailScreen from '../screens/ArticleDetailScreen';
import AdminEditorScreen from '../screens/AdminEditorScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Articles" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Articles" component={ArticlesScreen} />
        <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
        <Stack.Screen name="AdminLogin" component={LoginScreen} />
        <Stack.Screen name="AdminEditor" component={AdminEditorScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
