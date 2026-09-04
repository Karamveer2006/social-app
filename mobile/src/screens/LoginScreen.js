import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

export const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter your email or username and password');
      return;
    }

    setLoading(true);
    try {
      const res = await login({ loginIdentifier: identifier.trim(), password });
      if (res.success) {
        navigation.navigate('Social');
      } else {
        Alert.alert('Login Failed', res.message || 'Invalid credentials');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (email, pass) => {
    setIdentifier(email);
    setPassword(pass);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerBox}>
          <Text style={styles.logoText}>TaskPlanet</Text>
          <Text style={styles.subtitle}>Welcome back! Sign in to join the social feed.</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email or Username"
          placeholderTextColor={colors.textSecondary}
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.loginBtn, loading && { opacity: 0.6 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginBtnText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Quick demo buttons */}
        <Text style={styles.demoHeader}>Quick Demo Logins</Text>
        <View style={styles.demoRow}>
          <TouchableOpacity
            style={styles.demoBadge}
            onPress={() => handleQuickFill('aarav@example.com', 'Password123!')}
          >
            <Text style={styles.demoBadgeText}>Aarav</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.demoBadge}
            onPress={() => handleQuickFill('priya@example.com', 'Password123!')}
          >
            <Text style={styles.demoBadgeText}>Priya</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.demoBadge}
            onPress={() => handleQuickFill('rohan@example.com', 'Password123!')}
          >
            <Text style={styles.demoBadgeText}>Rohan</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.signupLink}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={styles.signupLinkText}>
            Don't have an account? <Text style={{ color: colors.primary, fontWeight: '700' }}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  content: {
    padding: 24,
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  loginBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  loginBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  demoHeader: {
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 10,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  demoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  demoBadge: {
    backgroundColor: '#E0E7FF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  demoBadgeText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  signupLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  signupLinkText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
