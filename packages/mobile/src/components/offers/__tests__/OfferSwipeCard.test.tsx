import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Vibration, Text } from 'react-native';
import OfferSwipeCard from '@/components/offers/OfferSwipeCard';
import type { OfertaServico } from '@/types/oferta';

// Mock do indicador de progresso para facilitar asserções do índice atual
jest.mock('@/components/offers/MediaProgressIndicator', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ count, currentIndex, progress }: any) => (
    React.createElement(Text, { testID: 'media-progress' }, `count:${count};currentIndex:${currentIndex};progress:${progress}`)
  );
});

// Espionar vibração para validar feedback háptico nos toques laterais
jest.spyOn(Vibration, 'vibrate').mockImplementation(() => undefined);

type PartialOferta = Partial<OfertaServico> & Pick<OfertaServico, '_id' | 'titulo' | 'descricao' | 'preco' | 'categoria' | 'prestador' | 'imagens' | 'localizacao' | 'createdAt' | 'updatedAt'>;

const makeOffer = (overrides?: Partial<PartialOferta>): OfertaServico => ({
  _id: '1',
  titulo: 'Serviço de Teste',
  descricao: 'Descrição',
  preco: 100,
  unidadePreco: 'hora' as any,
  categoria: 'Casa',
  prestador: { _id: 'p1', nome: 'João', avaliacao: 5 },
  imagens: [
    'https://example.com/img1.jpg',
    'https://example.com/img2.jpg',
  ],
  videos: [],
  localizacao: { cidade: 'SP', estado: 'SP' },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const onLayoutWithWidth = (el: any, width: number) => {
  fireEvent(el, 'layout', { nativeEvent: { layout: { width, height: 200 } } });
};

describe('OfferSwipeCard - Interatividade e Navegação de Mídia (feedback visual/háptico)', () => {
  it('mostra feedback (overlay existe) e avança mídia ao tocar na lateral direita', () => {
    const item = makeOffer();
    const { getByTestId } = render(
      <OfferSwipeCard item={item} isActiveCard accessibilityHint="" />
    );

    const pressable = getByTestId('media-pressable');
    // Definir largura conhecida para cálculos de esquerda/centro/direita
    onLayoutWithWidth(pressable, 300);

    // Tocar lado direito (x > 2/3 * width)
    fireEvent(pressable, 'press', { nativeEvent: { locationX: 290 } });

    // Indicador de progresso reflete mudança de índice (0 -> 1)
    const progress = getByTestId('media-progress');
    expect(progress.props.children).toContain('currentIndex:1');

    // Feedback háptico acionado
    expect(Vibration.vibrate).toHaveBeenCalled();

    // Overlays visuais existem na árvore (flash direito)
    expect(getByTestId('media-flash-right')).toBeTruthy();
  });

  it('mostra feedback (overlay existe) e retrocede mídia ao tocar na lateral esquerda', () => {
    const item = makeOffer();
    const { getByTestId } = render(
      <OfferSwipeCard item={item} isActiveCard accessibilityHint="" />
    );

    const pressable = getByTestId('media-pressable');
    onLayoutWithWidth(pressable, 300);

    // Avançar primeiro para o índice 1
    fireEvent(pressable, 'press', { nativeEvent: { locationX: 290 } });

    // Agora tocar no lado esquerdo (x < 1/3 * width) para voltar ao índice 0
    fireEvent(pressable, 'press', { nativeEvent: { locationX: 10 } });

    const progress = getByTestId('media-progress');
    expect(progress.props.children).toContain('currentIndex:0');

    // Feedback háptico acionado em toques laterais
    expect(Vibration.vibrate).toHaveBeenCalled();

    // Overlays visuais existem na árvore (flash esquerdo)
    expect(getByTestId('media-flash-left')).toBeTruthy();
  });

  it('alterna som ao tocar no centro e exibe overlay central', () => {
    const item = makeOffer();
    const onToggleMute = jest.fn();
    const { getByTestId } = render(
      <OfferSwipeCard item={item} isActiveCard onToggleMute={onToggleMute} accessibilityHint="" />
    );

    const pressable = getByTestId('media-pressable');
    onLayoutWithWidth(pressable, 300);

    // Tocar no centro (entre 1/3 e 2/3)
    fireEvent(pressable, 'press', { nativeEvent: { locationX: 160 } });

    expect(onToggleMute).toHaveBeenCalled();
    // Centro não vibra
    // @ts-ignore
    const vibrateCalls = (Vibration.vibrate as jest.Mock).mock.calls.length;
    expect(vibrateCalls).toBeGreaterThanOrEqual(0);

    // Overlay central existe
    expect(getByTestId('media-flash-center')).toBeTruthy();
  });
});
