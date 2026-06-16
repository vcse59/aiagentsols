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
            style={[styles.signInButtonWrapper, isLoading && styles.signInButtonDisabled]}
            onPress={handleSignIn}
            disabled={isLoading || !isConfigured}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#5B5BD6', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.signInButtonGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.signInButtonText}>Continue to Admin →</Text>
              )}
            </LinearGradient>
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
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    ...Shadow.lg,
  },
  logoIcon: {
    fontSize: 44,
  },
  appTitle: {
    ...Typography.displayLg,
    color: Colors.textOnPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    ...Typography.bodyMd,
    color: 'rgba(255,255,255,0.82)',
    marginTop: Spacing.sm,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius['2xl'],
    padding: Spacing['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    ...Shadow.xl,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    letterSpacing: -0.4,
  },
  cardSubtitle: {
    ...Typography.bodySm,
    color: Colors.textMuted,
    marginBottom: Spacing['2xl'],
    lineHeight: 21,
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
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 13,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.surfaceDim,
  },
  passwordContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceDim,
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
  signInButtonWrapper: {
    borderRadius: Radius.xl,
    marginTop: Spacing.sm,
    overflow: 'hidden',
    ...Shadow.lg,
  },
  signInButtonGradient: {
    paddingVertical: 17,
    alignItems: 'center',
  },
  signInButtonDisabled: {
    opacity: 0.55,
  },
  signInButtonText: {
    color: Colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  backLink: {
    marginTop: Spacing.lg,
    alignSelf: 'center',
    paddingVertical: Spacing.sm,
  },
  backLinkText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '80