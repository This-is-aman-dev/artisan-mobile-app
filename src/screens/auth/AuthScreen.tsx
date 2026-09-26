import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Sparkles, ShoppingBag, Lock, Phone, User as UserIcon, MapPin, KeyRound, X } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/theme';
import { UserRole } from '../../types';
import api from '../../api/client';

export const AuthScreen = () => {
  const { login, register } = useAuth();

  // Mode toggles
  const [role, setRole] = useState<UserRole>('artisan');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [craftSpecialty, setCraftSpecialty] = useState('');
  const [location, setLocation] = useState('');

  // OTP Reset Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [otpStep, setOtpStep] = useState<1 | 2>(1);
  const [resetPhone, setResetPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const activeColor = role === 'artisan' ? Colors.artisan.primary : Colors.buyer.primary;
  const activeBg = role === 'artisan' ? Colors.artisan.light : Colors.buyer.light;

  const handleSubmit = async () => {
    if (!phone || !password) {
      Alert.alert('Validation Error', 'Please enter your phone number and password.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(phone, password);
      } else {
        if (!name) {
          Alert.alert('Validation Error', 'Please enter your full name.');
          setLoading(false);
          return;
        }
        await register({
          name,
          phone,
          password,
          role,
          craftSpecialty: role === 'artisan' ? craftSpecialty : undefined,
          location,
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Authentication failed. Please verify your credentials.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!resetPhone) {
      Alert.alert('Validation Error', 'Please enter your registered phone number.');
      return;
    }
    setResetLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { phone: resetPhone });
      Alert.alert('OTP Sent', `For testing/demo: OTP is ${res.data.demoOtp || '1234'}`);
      setOtpStep(2);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword) {
      Alert.alert('Validation Error', 'Enter the 4-digit OTP and your new password.');
      return;
    }
    setResetLoading(true);
    try {
      await api.post('/auth/reset-password', {
        phone: resetPhone,
        otp,
        newPassword,
      });
      Alert.alert('Success', 'Password has been reset successfully! Please sign in.');
      setModalVisible(false);
      setOtpStep(1);
      setResetPhone('');
      setOtp('');
      setNewPassword('');
    } catch (err: any) {
      Alert.alert('Reset Failed', err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header Title */}
          <View style={styles.header}>
            <Text style={styles.brandTitle}>Artisan Studio AI</Text>
            <Text style={styles.brandSubtitle}>Direct Fair-Trade Marketplace</Text>
          </View>

          {/* Role Selector Tabs */}
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[
                styles.roleTab,
                role === 'artisan' && { backgroundColor: Colors.artisan.primary, borderColor: Colors.artisan.primary },
              ]}
              onPress={() => setRole('artisan')}
              activeOpacity={0.8}
            >
              <Sparkles size={18} color={role === 'artisan' ? '#ffffff' : Colors.neutral.muted} />
              <Text style={[styles.roleLabel, role === 'artisan' && styles.roleLabelActive]}>
                Artisan / कारीगर
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleTab,
                role === 'buyer' && { backgroundColor: Colors.buyer.primary, borderColor: Colors.buyer.primary },
              ]}
              onPress={() => setRole('buyer')}
              activeOpacity={0.8}
            >
              <ShoppingBag size={18} color={role === 'buyer' ? '#ffffff' : Colors.neutral.muted} />
              <Text style={[styles.roleLabel, role === 'buyer' && styles.roleLabelActive]}>
                Buyer / खरीदार
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Card */}
          <View style={[styles.card, { borderColor: activeColor + '30' }]}>
            <Text style={styles.formTitle}>{isLogin ? 'Sign In to Account' : 'Create New Account'}</Text>

            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <UserIcon size={18} color={Colors.neutral.muted} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Ramesh Sharma"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputWrapper}>
                <Phone size={18} color={Colors.neutral.muted} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 9876543210"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color={Colors.neutral.muted} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            {!isLogin && role === 'artisan' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Craft Specialty</Text>
                <View style={styles.inputWrapper}>
                  <Sparkles size={18} color={Colors.neutral.muted} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Blue Pottery, Wood Carving"
                    value={craftSpecialty}
                    onChangeText={setCraftSpecialty}
                  />
                </View>
              </View>
            )}

            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Location / City</Text>
                <View style={styles.inputWrapper}>
                  <MapPin size={18} color={Colors.neutral.muted} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Jaipur, Rajasthan"
                    value={location}
                    onChangeText={setLocation}
                  />
                </View>
              </View>
            )}

            {isLogin && (
              <TouchableOpacity
                onPress={() => {
                  setResetPhone(phone);
                  setModalVisible(true);
                }}
                style={styles.forgotBtn}
              >
                <Text style={[styles.forgotText, { color: activeColor }]}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: activeColor }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionBtnText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsLogin(!isLogin)}
              style={styles.switchModeBtn}
            >
              <Text style={styles.switchModeText}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <Text style={{ color: activeColor, fontWeight: '700' }}>
                  {isLogin ? 'Sign Up' : 'Log In'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* 4-digit OTP Reset Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Reset Password</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X size={22} color={Colors.neutral.muted} />
                </TouchableOpacity>
              </View>

              {otpStep === 1 ? (
                <View>
                  <Text style={styles.modalDesc}>
                    Enter your registered phone number to receive a 4-digit reset OTP.
                  </Text>
                  <View style={styles.inputWrapper}>
                    <Phone size={18} color={Colors.neutral.muted} />
                    <TextInput
                      style={styles.input}
                      placeholder="Phone number"
                      keyboardType="phone-pad"
                      value={resetPhone}
                      onChangeText={setResetPhone}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: activeColor }]}
                    onPress={handleRequestOtp}
                    disabled={resetLoading}
                  >
                    {resetLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnText}>Send OTP</Text>}
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <Text style={styles.modalDesc}>Enter the 4-digit OTP sent to {resetPhone} and your new password.</Text>
                  <View style={[styles.inputWrapper, { marginBottom: 12 }]}>
                    <KeyRound size={18} color={Colors.neutral.muted} />
                    <TextInput
                      style={styles.input}
                      placeholder="4-digit OTP"
                      keyboardType="numeric"
                      maxLength={4}
                      value={otp}
                      onChangeText={setOtp}
                    />
                  </View>
                  <View style={styles.inputWrapper}>
                    <Lock size={18} color={Colors.neutral.muted} />
                    <TextInput
                      style={styles.input}
                      placeholder="New Password"
                      secureTextEntry
                      value={newPassword}
                      onChangeText={setNewPassword}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: activeColor }]}
                    onPress={handleResetPassword}
                    disabled={resetLoading}
                  >
                    {resetLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.modalBtnText}>Reset Password</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.neutral.text,
  },
  brandSubtitle: {
    fontSize: 14,
    color: Colors.neutral.muted,
    marginTop: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    backgroundColor: Colors.neutral.card,
    gap: 8,
  },
  roleLabel: {
    fontWeight: '600',
    color: Colors.neutral.muted,
    fontSize: 14,
  },
  roleLabelActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  card: {
    backgroundColor: Colors.neutral.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.neutral.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.text,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.neutral.background,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 15,
    color: Colors.neutral.text,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  switchModeBtn: {
    marginTop: 18,
    alignItems: 'center',
  },
  switchModeText: {
    fontSize: 14,
    color: Colors.neutral.muted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.neutral.text,
  },
  modalDesc: {
    fontSize: 13,
    color: Colors.neutral.muted,
    marginBottom: 16,
    lineHeight: 18,
  },
  modalBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  modalBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
});