import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius, Shadow, GradientPresets } from '../theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminLogin'>;

export default function LoginScreen({ navigation }: Props) {
  const { admin, isConfigured, isInitializing, signIn, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isInitializing && admin) {
      navigation.replace('AdminEditor');
    }
  }, [admin, isInitializing, navigation]);

  const handleSignIn = async () => {
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    const result = await signIn(email, password);
    if (!result.success && result.error) {
      setError(result.error);
    }
  };

  return (
    <LinearGradient
      colors={GradientPresets.brand}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>🤖</Text>
          </View>
          <Text style={styles.appTitle}>AI Agents Solutions</Text>
          <Text style={styles.appSubtitle}>Generative AI Knowledge Hub</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Admin Login</Text>
          <Text style={styles.cardSubtitle}>Only the configured administrator can sign in and manage article publishing.</Text>

          {!isConfigured ? (
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                This server does not have `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `SESSION_SECRET` configured yet.
              </Text>
            </View>
          ) : null}

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="admin@yourdomain.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Admin password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.signInButton, isLoading && styles.signInButtonDisabled]}
            onPress={handleSignIn}
            disabled={isLoading || !isConfigured}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.signInButtonText}>Continue to Admin</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backLink}
            onPress={() => navigation.navigate('Articles')}
            activeOpacity={0.8}
          >
            <Text style={styles.backLinkText}>Back to public articles</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>© 2026 AI Agents Solutions. All rights reserved.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['4xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.overlayMedium,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    ...Shadow.lg,
  },
  logoIcon: {
    fontSize: 42,
  },
  appTitle: {
    ...Typography.displayMd,
    color: Colors.textOnPrimary,
    textAlign: 'center',
  },
  appSubtitle: {
    ...Typography.bodySm,
    color: 'rgba(255,255,255,0.78)',
    marginTop: Spacing.sm,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius['2xl'],
    padding: Spacing['2xl'],
    borderTopWidth: 4,
    borderTopColor: Colors.primary,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderLeftColor: '#EDE9FF',
    borderRightColor: '#EDE9FF',
    borderBottomColor: '#EDE9FF',
    ...Shadow.xl,
  },
  cardTitle: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  cardSubtitle: {
    ...Typography.bodySm,
    color: Colors.textMuted,
    marginBottom: Spacing['2xl'],
    lineHeight: 20,
  },
  infoContainer: {
    backgroundColor: Colors.infoBg,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
  },
  infoText: {
    color: Colors.info,
    fontSize: 13,
    lineHeight: 18,
  },
  errorContainer: {
    backgroundColor: Colors.errorBg,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.labelMd,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.borderDefault,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 13,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.surfaceElevated,
  },
  passwordContainer: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: Colors.borderDefault,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 13,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  eyeButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 13,
  },
  eyeIcon: {
    fontSize: 18,
  },
  signInButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: Spacing.sm,
    ...Shadow.lg,
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
  signInButtonText: {
    color: Colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  backLink: {
    marginTop: Spacing.lg,
    alignSelf: 'center',
    paddingVertical: Spacing.sm,
  },
  backLinkText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: Spacing['3xl'],
    letterSpacing: 0.2,
  },
});
