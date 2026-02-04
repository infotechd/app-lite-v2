import React, { memo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Card, Text, Chip, Avatar } from 'react-native-paper';
import { Image } from 'expo-image';
import { OfertaServico } from '@/types/oferta';
import { colors, spacing, radius } from '@/styles/theme';

/**
 * Obtém as dimensões da janela do dispositivo para cálculo proporcional do tamanho do cartão.
 */
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Define a largura do cartão como 90% da largura total da tela para garantir margens laterais.
 */
const CARD_WIDTH = SCREEN_WIDTH * 0.9;

/**
 * Define a altura do cartão como 70% da altura total da tela para melhor preenchimento visual.
 */
const CARD_HEIGHT = SCREEN_HEIGHT * 0.68;

/**
 * Interface que define as propriedades aceitas pelo componente OfferSwipeCard.
 * 
 * @interface OfferSwipeCardProps
 */
interface OfferSwipeCardProps {
    /** 
     * Objeto contendo todos os dados da oferta de serviço. 
     * Deve seguir a estrutura definida pelo tipo OfertaServico.
     */
    item: OfertaServico;
}

/**
 * Componente que renderiza um cartão individual para a funcionalidade de "Swipe" (deslizar) de ofertas.
 * Este componente exibe de forma atraente as informações cruciais de um serviço oferecido,
 * incluindo imagem, categoria, título, descrição, dados do prestador e valor.
 * 
 * @component
 * @param {OfferSwipeCardProps} props - Propriedades recebidas pelo componente.
 * @param {OfertaServico} props.item - Os dados da oferta que serão exibidos no cartão.
 * @returns {React.ReactElement} O elemento JSX que compõe o cartão de oferta.
 */
const OfferSwipeCard: React.FC<OfferSwipeCardProps> = ({ item }) => {
    /**
     * Define a imagem principal a ser exibida. 
     * Utiliza a primeira imagem do array de imagens ou uma URL de placeholder caso não haja imagens.
     */
    const mainImage = item.imagens?.[0] || 'https://via.placeholder.com/400x300';
    
    /**
     * Formata o valor numérico da oferta para uma string de moeda no padrão Brasileiro (R$).
     */
    const formattedPrice = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(item.preco);

    return (
        <Card style={styles.card} mode="elevated">
            {/* Container da imagem com altura fixa para evitar deslocamentos */}
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: mainImage }}
                    style={styles.image}
                    contentFit="cover"
                    transition={300}
                />
            </View>

            {/* Container de conteúdo ocupando o restante do cartão */}
            <View style={styles.contentContainer}>
                {/* Cabeçalho: Categoria e Título */}
                <View style={styles.headerSection}>
                    <Text variant="labelSmall" style={styles.categoryLabel}>
                        {item.categoria.toUpperCase()}
                    </Text>
                    <Text variant="titleLarge" style={styles.title} numberOfLines={2}>
                        {item.titulo}
                    </Text>
                </View>

                {/* Descrição com altura flexível centralizada */}
                <View style={styles.descriptionSection}>
                    <Text variant="bodyMedium" style={styles.description} numberOfLines={3}>
                        {item.descricao}
                    </Text>
                </View>

                {/* Rodapé: Info do prestador e Preço */}
                <View style={styles.footerSection}>
                    <View style={styles.prestadorInfo}>
                        <Avatar.Image
                            size={36}
                            source={{ uri: item.prestador.avatar || 'https://via.placeholder.com/40' }}
                        />
                        <View style={styles.prestadorText}>
                            <Text variant="labelMedium" style={styles.prestadorNome}>
                                {item.prestador.nome}
                            </Text>
                            <Text variant="bodySmall" style={styles.location}>
                                {item.localizacao.cidade}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.priceContainer}>
                        <Text variant="titleLarge" style={styles.price}>
                            {formattedPrice}
                        </Text>
                        <Text variant="labelSmall" style={styles.priceUnit}>
                            /{item.unidadePreco}
                        </Text>
                    </View>
                </View>
            </View>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: radius.xl,
        overflow: 'hidden',
        backgroundColor: colors.surface,
        elevation: 6,
        // Sombra para iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    imageContainer: {
        width: '100%',
        height: '50%', // Ajustado para 50% para dar mais equilíbrio
        backgroundColor: colors.backdrop,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    contentContainer: {
        flex: 1,
        padding: spacing.md,
        justifyContent: 'space-between',
    },
    headerSection: {
        marginBottom: spacing.xs,
    },
    categoryLabel: {
        color: colors.primary,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 2,
        fontSize: 10,
    },
    title: {
        color: colors.onSurface,
        fontWeight: '800',
        lineHeight: 24,
    },
    descriptionSection: {
        flex: 1,
        justifyContent: 'center',
    },
    description: {
        color: colors.onSurfaceVariant,
        lineHeight: 18,
    },
    footerSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: spacing.sm,
        borderTopWidth: 0.5,
        borderTopColor: colors.border,
    },
    prestadorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    prestadorText: {
        marginLeft: spacing.sm,
    },
    prestadorNome: {
        color: colors.onSurface,
        fontWeight: '700',
    },
    location: {
        color: colors.onSurfaceVariant,
        fontSize: 11,
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    price: {
        color: colors.primary,
        fontWeight: '800',
    },
    priceUnit: {
        color: colors.onSurfaceVariant,
        fontSize: 10,
    },
});

/**
 * Exportação otimizada do componente utilizando React.memo para evitar re-renderizações desnecessárias
 * enquanto o usuário navega entre os cartões de oferta.
 */
export default memo(OfferSwipeCard);
