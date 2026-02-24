import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@/constants/config';

/**
 * Camada de abstração de armazenamento seguro.
 * - Mobile (iOS/Android): utiliza expo-secure-store (armazenamento criptografado nativo).
 * - Web: utiliza localStorage como fallback (não criptografado; aceitável para web).
 */
class StorageService {
    private async set(key: string, value: string): Promise<void> {
        if (Platform.OS === 'web') {
            localStorage.setItem(key, value);
            return;
        }
        await SecureStore.setItemAsync(key, value);
    }

    private async get(key: string): Promise<string | null> {
        if (Platform.OS === 'web') {
            return localStorage.getItem(key);
        }
        return SecureStore.getItemAsync(key);
    }

    private async remove(key: string): Promise<void> {
        if (Platform.OS === 'web') {
            localStorage.removeItem(key);
            return;
        }
        await SecureStore.deleteItemAsync(key);
    }

    async saveAuthToken(token: string): Promise<void> {
        try {
            await this.set(STORAGE_KEYS.AUTH_TOKEN, token);
        } catch (error) {
            console.error('Erro ao salvar token:', error);
            throw new Error('Falha ao salvar credenciais');
        }
    }

    async getAuthToken(): Promise<string | null> {
        try {
            return await this.get(STORAGE_KEYS.AUTH_TOKEN);
        } catch (error) {
            console.error('Erro ao obter token:', error);
            return null;
        }
    }

    async removeAuthToken(): Promise<void> {
        try {
            await this.remove(STORAGE_KEYS.AUTH_TOKEN);
        } catch (error) {
            console.error('Erro ao remover token:', error);
        }
    }

    async saveUserData(userData: string): Promise<void> {
        try {
            await this.set(STORAGE_KEYS.USER_DATA, userData);
        } catch (error) {
            console.error('Erro ao salvar dados do usuário:', error);
        }
    }

    async getUserData(): Promise<string | null> {
        try {
            return await this.get(STORAGE_KEYS.USER_DATA);
        } catch (error) {
            console.error('Erro ao obter dados do usuário:', error);
            return null;
        }
    }

    async removeUserData(): Promise<void> {
        try {
            await this.remove(STORAGE_KEYS.USER_DATA);
        } catch (error) {
            console.error('Erro ao remover dados do usuário:', error);
        }
    }

    async clearAll(): Promise<void> {
        try {
            await Promise.all([
                this.removeAuthToken(),
                this.removeUserData(),
            ]);
        } catch (error) {
            console.error('Erro ao limpar dados:', error);
        }
    }
}

export const storageService = new StorageService();