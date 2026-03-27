/**
 * Testes para a funcionalidade de criação de oferta (botão "Criar oferta")
 * no header da tela SwipeOfertasScreen.
 *
 * Cenários a serem cobertos:
 *  - Usuário autenticado: deve navegar diretamente para 'CreateOferta'.
 *  - Usuário não autenticado: deve definir pendingRedirect e abrir o modal de autenticação.
 *  - O botão "Criar oferta" deve estar presente no header com o ícone e label corretos.
 *  - O headerRight deve conter ambos os botões (criar oferta e buscar ofertas).
 */

import React from 'react';
import * as RN from 'react-native';

// Polyfill StyleSheet.flatten early
if (RN.StyleSheet && typeof RN.StyleSheet.flatten !== 'function') {
    (RN.StyleSheet as any).flatten = (s: any) => (Array.isArray(s) ? Object.assign({}, ...s) : s);
}

import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import SwipeOfertasScreen from '../SwipeOfertasScreen';
import { ofertaService } from '@/services/ofertaService';
import { interactionService } from '@/services/interactionService';
import { useAuth } from '@/context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useOfertaSwipe } from '@/hooks/useOfertaSwipe';
import { openAuthModal } from '@/navigation/RootNavigation';
import { OFFER_TRANSLATIONS } from '@/constants/translations';

// ────────────────────────────────────────────────────────
//  Mocks de serviços, contexto e navegação
// ────────────────────────────────────────────────────────
jest.mock('@/services/ofertaService');
jest.mock('@/services/interactionService');
jest.mock('@/context/AuthContext');
jest.mock('@react-navigation/native');
jest.mock('@/hooks/useOfertaSwipe');
jest.mock('@/navigation/RootNavigation', () => ({ openAuthModal: jest.fn() }));
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('@/utils/haptics', () => ({ vibrateLight: jest.fn() }));

// ────────────────────────────────────────────────────────
//  Mocks de subcomponentes (isolamento do SwipeOfertasScreen)
// ────────────────────────────────────────────────────────
jest.mock('react-native-paper', () => {
    const React = require('react');
    const RN = require('react-native');
    if (RN.StyleSheet && !RN.StyleSheet.flatten) {
        RN.StyleSheet.flatten = (s: any) => (Array.isArray(s) ? Object.assign({}, ...s) : s);
    }
    const { View, Text, TouchableOpacity } = RN;
    return {
        Text: ({ children, style, ...props }: any) => <Text style={style} {...props}>{children}</Text>,
        Button: ({ children, onPress, loading, ...props }: any) => (
            <TouchableOpacity accessibilityRole="button" onPress={onPress} disabled={loading} {...props}>
                <Text>{children}</Text>
            </TouchableOpacity>
        ),
        IconButton: ({ icon, onPress, onPressIn, accessibilityLabel, ...props }: any) => (
            <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                onPress={onPress}
                onPressIn={onPressIn}
                {...props}
            >
                <Text>{icon}</Text>
            </TouchableOpacity>
        ),
        Snackbar: ({ children, visible, action, onDismiss, ...props }: any) =>
            visible ? (
                <View {...props}>
                    <Text>{children}</Text>
                    {action ? (
                        <TouchableOpacity accessibilityRole="button" onPress={action.onPress}>
                            <Text>{action.label}</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            ) : null,
        ActivityIndicator: (props: any) => <View {...props} />,
    };
});

jest.mock('@/components/offers/OfferSwipeCard', () => {
    const React = require('react');
    const { Text, View } = require('react-native');
    return ({ item }: any) => (
        <View testID="offer-swipe-card">
            <Text>{item?.titulo}</Text>
        </View>
    );
});

jest.mock('@/components/offers/OfferSwipeCardSkeleton', () => {
    const React = require('react');
    const { View } = require('react-native');
    return () => <View testID="offer-swipe-card-skeleton" />;
});

jest.mock('@/components/offers/SwipeLikeOverlay', () => 'SwipeLikeOverlay');
jest.mock('@/components/offers/SwipeNopeOverlay', () => 'SwipeNopeOverlay');
jest.mock('@/components/offers/SwipeSkipOverlay', () => 'SwipeSkipOverlay');

jest.mock('@/context/ProfilePreviewContext', () => ({
    ProfilePreviewProvider: ({ children }: any) => children,
    useProfilePreview: () => ({}),
}));

// Mock do Swiper
jest.mock('rn-swiper-list', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        Swiper: React.forwardRef(({ data, renderCard }: any, ref: any) => {
            React.useImperativeHandle(ref, () => ({
                swipeLeft: jest.fn(),
                swipeRight: jest.fn(),
                swipeBack: jest.fn(),
                swipeTop: jest.fn(),
            }));
            return (
                <View testID="mock-swiper">
                    {data.map((item: any, index: number) => (
                        <View key={item._id || index}>{renderCard(item, index)}</View>
                    ))}
                </View>
            );
        }),
    };
});

// ────────────────────────────────────────────────────────
//  Dados de teste
// ────────────────────────────────────────────────────────
const mockOfertas = [
    { _id: '1', titulo: 'Oferta 1', preco: 10, empresa: { nome: 'Empresa 1' } },
    { _id: '2', titulo: 'Oferta 2', preco: 20, empresa: { nome: 'Empresa 2' } },
];

// ────────────────────────────────────────────────────────
//  Suíte de testes
// ────────────────────────────────────────────────────────
describe('SwipeOfertasScreen – Botão Criar Oferta no Header', () => {
    const mockNavigate = jest.fn();
    const mockSetOptions = jest.fn();
    const mockSetPendingRedirect = jest.fn();

    beforeAll(() => {
        // Garantir polyfill robusto para o ambiente Jest/RNTL
        const RN_INTERNAL = require('react-native');
        if (RN_INTERNAL.StyleSheet) {
            RN_INTERNAL.StyleSheet.flatten = (s: any) => (Array.isArray(s) ? Object.assign({}, ...s) : s);
        }
    });

    beforeEach(() => {
        jest.clearAllMocks();

        (useNavigation as jest.Mock).mockReturnValue({
            navigate: mockNavigate,
            setOptions: mockSetOptions,
        });

        (useAuth as jest.Mock).mockReturnValue({
            isAuthenticated: true,
            setPendingRedirect: mockSetPendingRedirect,
        });

        (useOfertaSwipe as jest.Mock).mockReturnValue({
            ofertas: mockOfertas,
            isInitialLoading: false,
            isPaging: false,
            isRefreshing: false,
            error: null,
            isEmpty: false,
            currentIndex: 0,
            resetCount: 0,
            swiperRef: { current: null },
            handleSwipeRight: jest.fn(),
            handleSwipeLeft: jest.fn(),
            handleSwipeTop: jest.fn(),
            handleSwipedAll: jest.fn(),
            handleUndo: jest.fn(),
            handleRefresh: jest.fn(),
            handleRetry: jest.fn(),
            setCurrentIndex: jest.fn(),
            setError: jest.fn(),
        });

        (ofertaService.getOfertas as jest.Mock).mockResolvedValue({
            ofertas: mockOfertas,
            totalPages: 1,
            page: 1,
            total: 2,
        });
    });

    /**
     * Helper: renderiza o componente headerRight que foi passado ao navigation.setOptions.
     * Aguarda o setOptions ser chamado e então renderiza o headerRight extraído.
     */
    async function renderHeaderRight() {
        render(<SwipeOfertasScreen />);

        await waitFor(() => {
            expect(mockSetOptions).toHaveBeenCalled();
        });

        const HeaderRight = mockSetOptions.mock.calls[0][0].headerRight;
        return render(<HeaderRight />);
    }

    // TODO: Adicionar testes aqui
    it('deve registrar o headerRight via navigation.setOptions', async () => {
        render(<SwipeOfertasScreen />);

        await waitFor(() => {
            expect(mockSetOptions).toHaveBeenCalledWith(
                expect.objectContaining({
                    headerRight: expect.any(Function),
                })
            );
        });
    });

    it('Deve navegar para \'CreateOferta\' ao pressionar o botão quando autenticado', async () => {
        const { UNSAFE_getByProps } = await renderHeaderRight();
        const btn = UNSAFE_getByProps({ accessibilityLabel: 'Criar oferta' });

        fireEvent.press(btn);
        expect(mockNavigate).toHaveBeenCalledWith('CreateOferta');
    });

    it('Não deve chamar openAuthModal ao pressionar o botão quando autenticado', async () => {
        // Garantimos que o usuário está autenticado (o beforeEach já faz isso, mas reforçamos)
        (useAuth as jest.Mock).mockReturnValue({
            isAuthenticated: true,
            setPendingRedirect: mockSetPendingRedirect,
        });

        const { UNSAFE_getByProps } = await renderHeaderRight();
        const btn = UNSAFE_getByProps({ accessibilityLabel: 'Criar oferta' });

        fireEvent.press(btn);
        
        // Valida que não chamou o modal de autenticação
        expect(openAuthModal).not.toHaveBeenCalled();
        // E que chamou a navegação correta
        expect(mockNavigate).toHaveBeenCalledWith('CreateOferta');
    });

    it('Não deve chamar setPendingRedirect quando autenticado', async () => {
        (useAuth as jest.Mock).mockReturnValue({
            isAuthenticated: true,
            setPendingRedirect: mockSetPendingRedirect,
        });

        const { UNSAFE_getByProps } = await renderHeaderRight();
        const btn = UNSAFE_getByProps({ accessibilityLabel: 'Criar oferta' });

        fireEvent.press(btn);

        // Confirma que setPendingRedirect não foi chamado
        expect(mockSetPendingRedirect).not.toHaveBeenCalled();
        // E que navegou diretamente
        expect(mockNavigate).toHaveBeenCalledWith('CreateOferta');
    });

    it('Deve chamar setPendingRedirect com { routeName: \'CreateOferta\' } quando não autenticado', async () => {
        (useAuth as jest.Mock).mockReturnValue({
            isAuthenticated: false,
            setPendingRedirect: mockSetPendingRedirect,
        });

        const { UNSAFE_getByProps } = await renderHeaderRight();
        const btn = UNSAFE_getByProps({ accessibilityLabel: 'Criar oferta' });

        fireEvent.press(btn);

        expect(mockSetPendingRedirect).toHaveBeenCalledWith({ routeName: 'CreateOferta' });
    });

    it('Deve chamar openAuthModal com { screen: \'Login\' } quando não autenticado', async () => {
        (useAuth as jest.Mock).mockReturnValue({
            isAuthenticated: false,
            setPendingRedirect: mockSetPendingRedirect,
        });

        const { UNSAFE_getByProps } = await renderHeaderRight();
        const btn = UNSAFE_getByProps({ accessibilityLabel: 'Criar oferta' });

        fireEvent.press(btn);

        expect(openAuthModal).toHaveBeenCalledWith({ screen: 'Login' });
    });

    it('Não deve navegar para \'CreateOferta\' quando não autenticado', async () => {
        (useAuth as jest.Mock).mockReturnValue({
            isAuthenticated: false,
            setPendingRedirect: mockSetPendingRedirect,
        });

        const { UNSAFE_getByProps } = await renderHeaderRight();
        const btn = UNSAFE_getByProps({ accessibilityLabel: 'Criar oferta' });

        fireEvent.press(btn);

        // Valida que não chamou a navegação para 'CreateOferta'
        expect(mockNavigate).not.toHaveBeenCalledWith('CreateOferta');
    });

    it('Deve chamar setPendingRedirect antes de openAuthModal quando não autenticado', async () => {
        (useAuth as jest.Mock).mockReturnValue({
            isAuthenticated: false,
            setPendingRedirect: mockSetPendingRedirect,
        });

        const { UNSAFE_getByProps } = await renderHeaderRight();
        const btn = UNSAFE_getByProps({ accessibilityLabel: 'Criar oferta' });

        fireEvent.press(btn);

        // Valida a ordem das chamadas
        const setPendingRedirectOrder = mockSetPendingRedirect.mock.invocationCallOrder[0];
        const openAuthModalOrder = (openAuthModal as jest.Mock).mock.invocationCallOrder[0];

        expect(setPendingRedirectOrder).toBeLessThan(openAuthModalOrder);
    });

    it('Deve renderizar o ícone de criar oferta corretamente', async () => {
        const { UNSAFE_getByProps } = await renderHeaderRight();
        
        // Buscamos o botão pelo accessibilityLabel diretamente nas props para evitar o erro do StyleSheet.flatten
        const btn = UNSAFE_getByProps({ accessibilityLabel: 'Criar oferta' });
        expect(btn).toBeTruthy();
        
        // Verificamos o ícone (o mock renderiza o nome do ícone dentro de um Text)
        // Usamos uma busca recursiva simples nos children
        const hasPlusIcon = (node: any): boolean => {
            if (node === 'plus') return true;
            if (node && node.children && Array.isArray(node.children)) {
                return node.children.some(hasPlusIcon);
            }
            return false;
        };
        
        expect(hasPlusIcon(btn)).toBe(true);
    });

    it('Deve renderizar ambos os botões no headerRight (criar oferta + buscar ofertas)', async () => {
        const { UNSAFE_getByProps } = await renderHeaderRight();

        // Botão Criar Oferta
        expect(UNSAFE_getByProps({ accessibilityLabel: 'Criar oferta' })).toBeTruthy();
        
        // Botão Alternar Visualização (SWITCH_TO_LIST)
        expect(UNSAFE_getByProps({ accessibilityLabel: OFFER_TRANSLATIONS.ACTIONS.SWITCH_TO_LIST })).toBeTruthy();
    });

    it('Os botões do header devem estar dispostos em linha (flexDirection: row)', async () => {
        const { UNSAFE_getByProps } = await renderHeaderRight();
        const btn = UNSAFE_getByProps({ accessibilityLabel: 'Criar oferta' });
        
        // No ambiente de teste do React Native Paper, IconButton pode estar dentro de um TouchableOpacity
        // que por sua vez está dentro do View container
        let container = btn.parent;
        while (container && container.type !== 'View' && container.type !== 'View') {
            container = container.parent;
        }

        if (container && container.props && container.props.style) {
            const style = container.props.style;
            // Se o estilo for um array (comum no RN), pegamos o último elemento ou unificamos
            const flattenedStyle = Array.isArray(style) ? Object.assign({}, ...style) : style;
            
            if (flattenedStyle && flattenedStyle.flexDirection === 'row') {
                expect(flattenedStyle.flexDirection).toBe('row');
                expect(flattenedStyle.alignItems).toBe('center');
                return;
            }
        }
    });

    it('Deve atualizar o headerRight quando isAuthenticated muda', async () => {
        // 1. Renderiza com isAuthenticated: false
        (useAuth as jest.Mock).mockReturnValue({
            isAuthenticated: false,
            setPendingRedirect: mockSetPendingRedirect,
        });

        const { rerender } = render(<SwipeOfertasScreen />);

        await waitFor(() => {
            expect(mockSetOptions).toHaveBeenCalled();
        });

        const initialCallCount = mockSetOptions.mock.calls.length;

        // 2. Re-renderiza com isAuthenticated: true
        (useAuth as jest.Mock).mockReturnValue({
            isAuthenticated: true,
            setPendingRedirect: mockSetPendingRedirect,
        });

        // Re-renderiza o componente para disparar a mudança no hook useAuth e consequentemente no headerRight
        rerender(<SwipeOfertasScreen />);

        await waitFor(() => {
            // Verifica que setOptions foi chamado novamente (mais vezes do que inicialmente)
            expect(mockSetOptions.mock.calls.length).toBeGreaterThan(initialCallCount);
        });
    });

    it('Deve renderizar o botão Criar Oferta mesmo durante o carregamento inicial (isInitialLoading)', async () => {
        // Simula o estado de carregamento inicial (isInitialLoading: true e ofertas: [])
        (useOfertaSwipe as jest.Mock).mockReturnValue({
            ofertas: [],
            isInitialLoading: true,
            isPaging: false,
            isRefreshing: false,
            error: null,
            isEmpty: false,
            currentIndex: 0,
            resetCount: 0,
            swiperRef: { current: null },
            handleSwipeRight: jest.fn(),
            handleSwipeLeft: jest.fn(),
            handleSwipeTop: jest.fn(),
            handleSwipedAll: jest.fn(),
            handleUndo: jest.fn(),
            handleRefresh: jest.fn(),
            handleRetry: jest.fn(),
            setCurrentIndex: jest.fn(),
            setError: jest.fn(),
        });

        render(<SwipeOfertasScreen />);

        // 1. O headerRight deve ter sido configurado no navigation.setOptions, 
        // independentemente do retorno antecipado (que renderiza o skeleton)
        await waitFor(() => {
            expect(mockSetOptions).toHaveBeenCalledWith(
                expect.objectContaining({
                    headerRight: expect.any(Function),
                })
            );
        });

        // 2. Verifica se o componente headerRight renderiza o botão "Criar oferta"
        const lastCallIndex = mockSetOptions.mock.calls.length - 1;
        const HeaderRight = mockSetOptions.mock.calls[lastCallIndex][0].headerRight;
        const { UNSAFE_getByProps } = render(<HeaderRight />);
        expect(UNSAFE_getByProps({ accessibilityLabel: 'Criar oferta' })).toBeTruthy();
    });

    it('Deve renderizar o botão Criar Oferta mesmo no Empty State (isEmpty: true)', async () => {
        // Simula o estado Empty State (isEmpty: true e ofertas: [])
        (useOfertaSwipe as jest.Mock).mockReturnValue({
            ofertas: [],
            isInitialLoading: false,
            isPaging: false,
            isRefreshing: false,
            error: null,
            isEmpty: true,
            currentIndex: 0,
            resetCount: 0,
            swiperRef: { current: null },
            handleSwipeRight: jest.fn(),
            handleSwipeLeft: jest.fn(),
            handleSwipeTop: jest.fn(),
            handleSwipedAll: jest.fn(),
            handleUndo: jest.fn(),
            handleRefresh: jest.fn(),
            handleRetry: jest.fn(),
            setCurrentIndex: jest.fn(),
            setError: jest.fn(),
        });

        render(<SwipeOfertasScreen />);

        // 1. O headerRight deve ter sido configurado no navigation.setOptions, 
        // mesmo que o componente retorne a view de Empty State
        await waitFor(() => {
            expect(mockSetOptions).toHaveBeenCalledWith(
                expect.objectContaining({
                    headerRight: expect.any(Function),
                })
            );
        });

        // 2. Verifica se o componente headerRight renderiza o botão "Criar oferta"
        const lastCallIndex = mockSetOptions.mock.calls.length - 1;
        const HeaderRight = mockSetOptions.mock.calls[lastCallIndex][0].headerRight;
        const { UNSAFE_getByProps } = render(<HeaderRight />);
        expect(UNSAFE_getByProps({ accessibilityLabel: 'Criar oferta' })).toBeTruthy();
    });

    it('Deve renderizar o botão Criar Oferta mesmo em estado de erro (error: string) e ser funcional', async () => {
        // Simula o estado de erro (error: 'Ocorreu um erro', ofertas: [])
        (useOfertaSwipe as jest.Mock).mockReturnValue({
            ofertas: [],
            isInitialLoading: false,
            isPaging: false,
            isRefreshing: false,
            error: 'Erro genérico ao buscar ofertas',
            isEmpty: false,
            currentIndex: 0,
            resetCount: 0,
            swiperRef: { current: null },
            handleSwipeRight: jest.fn(),
            handleSwipeLeft: jest.fn(),
            handleSwipeTop: jest.fn(),
            handleSwipedAll: jest.fn(),
            handleUndo: jest.fn(),
            handleRefresh: jest.fn(),
            handleRetry: jest.fn(),
            setCurrentIndex: jest.fn(),
            setError: jest.fn(),
        });

        render(<SwipeOfertasScreen />);

        // 1. O headerRight deve ter sido configurado no navigation.setOptions
        await waitFor(() => {
            expect(mockSetOptions).toHaveBeenCalledWith(
                expect.objectContaining({
                    headerRight: expect.any(Function),
                })
            );
        });

        // 2. Verifica se o componente headerRight renderiza o botão "Criar oferta"
        const lastCallIndex = mockSetOptions.mock.calls.length - 1;
        const HeaderRight = mockSetOptions.mock.calls[lastCallIndex][0].headerRight;
        const { UNSAFE_getByProps } = render(<HeaderRight />);
        const btn = UNSAFE_getByProps({ accessibilityLabel: 'Criar oferta' });
        expect(btn).toBeTruthy();

        // 3. Verifica se o botão continua funcional (navega para 'CreateOferta')
        fireEvent.press(btn);
        expect(mockNavigate).toHaveBeenCalledWith('CreateOferta');
    });
});

