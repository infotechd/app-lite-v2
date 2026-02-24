import { Platform, Vibration } from 'react-native';

/**
 * Dispara um feedback tátil leve.
 * No ambiente web, a chamada é silenciosamente ignorada pois a API Vibration
 * não está disponível em navegadores via React Native Web.
 *
 * @param {number} [duration=10] - Duração da vibração em milissegundos.
 */
export function vibrateLight(duration = 10): void {
    if (Platform.OS === 'web') return;
    Vibration.vibrate(duration);
}
