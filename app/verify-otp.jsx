import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import useAuthStore from '../src/store/authStore';
import { authAPI } from '../src/api/auth';

export default function VerifyOTPScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email || '';
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);
  const verifyOTP = useAuthStore((state) => state.verifyOTP);

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key, index) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter the complete 6-digit OTP',
      });
      return;
    }

    setLoading(true);
    const result = await verifyOTP(email, otpString);
    setLoading(false);

    if (result.success) {
      Toast.show({
        type: 'success',
        text1: 'Success!',
        text2: 'Email verified successfully',
      });
      router.replace('/(tabs)/home');
    } else {
      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: result.message || 'Invalid verification code',
      });
    }
  };

  const handleResend = async () => {
    if (!email) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Email not found',
      });
      return;
    }
    
    setResending(true);
    try {
      const result = await authAPI.resendOTP(email);
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Code Sent',
          text2: 'Verification code sent to your email',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.message || 'Failed to resend code',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to resend code',
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Verify Email</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{'\n'}
          <Text style={styles.email}>{email}</Text>
        </Text>
      </View>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref)}
            style={styles.otpInput}
            value={digit}
            onChangeText={(text) => handleOtpChange(text, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
            keyboardType="number-pad"
            maxLength={1}
            autoFocus={index === 0}
            selectTextOnFocus
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
        onPress={handleVerify}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.verifyButtonText}>Verify OTP</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.resendContainer}
        onPress={handleResend}
        disabled={resending}
      >
        <Text style={styles.resendText}>Didn't receive code? </Text>
        <Text style={[styles.resendLink, resending && styles.resendLinkDisabled]}>
          {resending ? 'Sending...' : 'Resend'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 60,
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
  },
  email: {
    fontWeight: '600',
    color: '#111827',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  otpInput: {
    width: 48,
    height: 56,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  verifyButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  verifyButtonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#6b7280',
  },
  resendLink: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
  },
  resendLinkDisabled: {
    opacity: 0.5,
  },
});
