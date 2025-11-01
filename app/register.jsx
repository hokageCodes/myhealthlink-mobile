import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Toast from 'react-native-toast-message';
import useAuthStore from '../src/store/authStore';

const registerSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .required('Full name is required'),
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  phone: Yup.string()
    .matches(/^(\+234|0)/, 'Please enter a valid Nigerian phone number')
    .required('Phone number is required'),
  dateOfBirth: Yup.string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid date (YYYY-MM-DD)')
    .required('Date of birth is required'),
  gender: Yup.string()
    .oneOf(['male', 'female', 'other'], 'Please select a gender')
    .required('Gender is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);

  const handleRegister = async (values, { setSubmitting }) => {
    try {
      // Format phone number
      const formattedPhone = values.phone.startsWith('0') 
        ? '+234' + values.phone.substring(1) 
        : values.phone;

      const result = await register({
        name: values.name,
        email: values.email,
        phone: formattedPhone,
        dateOfBirth: values.dateOfBirth,
        gender: values.gender,
        password: values.password,
      });

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Registration Successful!',
          text2: 'Please verify your email',
        });
        router.push({ pathname: '/verify-otp', params: { email: values.email } });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Registration Failed',
          text2: result.message || 'An error occurred',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An unexpected error occurred',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>
        </View>

        <Formik
          initialValues={{
            name: '',
            email: '',
            phone: '',
            dateOfBirth: '',
            gender: '',
            password: '',
            confirmPassword: '',
          }}
          validationSchema={registerSchema}
          onSubmit={handleRegister}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={[styles.input, errors.name && touched.name && styles.inputError]}
                  placeholder="Enter your full name"
                  value={values.name}
                  onChangeText={handleChange('name')}
                  onBlur={handleBlur('name')}
                  autoCapitalize="words"
                />
                {errors.name && touched.name && (
                  <Text style={styles.errorText}>{errors.name}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, errors.email && touched.email && styles.inputError]}
                  placeholder="Enter your email"
                  value={values.email}
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
                {errors.email && touched.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <Text style={styles.hint}>Nigerian number (+234 or 0...)</Text>
                <TextInput
                  style={[styles.input, errors.phone && touched.phone && styles.inputError]}
                  placeholder="e.g., +2348012345678 or 08012345678"
                  value={values.phone}
                  onChangeText={handleChange('phone')}
                  onBlur={handleBlur('phone')}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                />
                {errors.phone && touched.phone && (
                  <Text style={styles.errorText}>{errors.phone}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Date of Birth</Text>
                <Text style={styles.hint}>Format: YYYY-MM-DD</Text>
                <TextInput
                  style={[styles.input, errors.dateOfBirth && touched.dateOfBirth && styles.inputError]}
                  placeholder="e.g., 1990-01-15"
                  value={values.dateOfBirth}
                  onChangeText={handleChange('dateOfBirth')}
                  onBlur={handleBlur('dateOfBirth')}
                  keyboardType="default"
                />
                {errors.dateOfBirth && touched.dateOfBirth && (
                  <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.genderContainer}>
                  {['male', 'female', 'other'].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.genderButton,
                        values.gender === g && styles.genderButtonActive,
                      ]}
                      onPress={() => {
                        handleChange('gender')(g);
                      }}
                    >
                      <Text
                        style={[
                          styles.genderButtonText,
                          values.gender === g && styles.genderButtonTextActive,
                        ]}
                      >
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.gender && touched.gender && (
                  <Text style={styles.errorText}>{errors.gender}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={[styles.input, errors.password && touched.password && styles.inputError]}
                  placeholder="Create a password (min 6 characters)"
                  value={values.password}
                  onChangeText={handleChange('password')}
                  onBlur={handleBlur('password')}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password-new"
                />
                {errors.password && touched.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={[styles.input, errors.confirmPassword && touched.confirmPassword && styles.inputError]}
                  placeholder="Confirm your password"
                  value={values.confirmPassword}
                  onChangeText={handleChange('confirmPassword')}
                  onBlur={handleBlur('confirmPassword')}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password-new"
                />
                {errors.confirmPassword && touched.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.registerButton, isSubmitting && styles.registerButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.registerButtonText}>Sign Up</Text>
                )}
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/login')}>
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Formik>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '400',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#111827',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  genderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  genderButtonTextActive: {
    color: '#ffffff',
  },
  registerButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loginText: {
    fontSize: 14,
    color: '#6b7280',
  },
  loginLink: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
  },
});
