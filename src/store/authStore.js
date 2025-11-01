import { create } from 'zustand';
import { authAPI } from '../api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist, createJSONStorage } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      initialize: async () => {
        set({ isLoading: true });
        
        const isAuth = await authAPI.isAuthenticated();
        const userData = await authAPI.getUserData();

        if (isAuth && userData) {
          set({
            user: userData,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      login: async (emailOrPhone, password, rememberMe) => {
        set({ isLoading: true });
        try {
          const response = await authAPI.login(emailOrPhone, password, rememberMe);
          
          if (response && response.success) {
            const user = response.data?.user;
            if (user) {
              set({
                user: user,
                isAuthenticated: true,
                isLoading: false,
              });
              return { success: true, data: response.data };
            } else {
              set({ isLoading: false });
              return { success: false, message: 'Invalid response from server' };
            }
          } else {
            set({ isLoading: false });
            return { 
              success: false, 
              message: response?.message || 'Login failed. Please check your credentials.' 
            };
          }
        } catch (error) {
          set({ isLoading: false });
          const errorMessage = error.response?.data?.message 
            || error.message 
            || 'Login failed. Please check your connection and try again.';
          return {
            success: false,
            message: errorMessage,
          };
        }
      },

      register: async (userData) => {
        set({ isLoading: true });
        try {
          const response = await authAPI.register(userData);
          set({ isLoading: false });
          return response;
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            message: error.response?.data?.message || 'Registration failed',
          };
        }
      },

      verifyOTP: async (email, otp) => {
        set({ isLoading: true });
        try {
          const response = await authAPI.verifyOTP(email, otp);
          
          if (response.success) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
            });
            return { success: true, data: response.data };
          } else {
            set({ isLoading: false });
            return { success: false, message: response.message };
          }
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            message: error.response?.data?.message || 'OTP verification failed',
          };
        }
      },

      logout: async () => {
        await authAPI.logout();
        set({
          user: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useAuthStore;

