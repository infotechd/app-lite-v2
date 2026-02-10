import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import OfferSwipeCard from '@/components/offers/OfferSwipeCard';
import { OfertaServico } from '@/types/oferta';

// Mocks
jest.mock('react-native-paper', () => {
  const React = require('react');
  const { View, Text: RNText } = require('react-native');
  const Text = ({ children, ...props }: any) => React.createElement(RNText, props, children);
  const AvatarImage = (props: any) => React.createElement(View, { ...props, testID: 'avatar-image' });
  const AvatarText = (props: any) => React.createElement(View, { ...props, testID: 'avatar-text' });
  return {
    Card: ({ children, ...props }: any) => React.createElement(View, props, children),
    Text,
    Avatar: { Image: AvatarImage, Text: AvatarText },
  };
});

jest.mock('expo-image', () => {
  const React = require('react');
  return {
    Image: (props: any) => React.createElement('MockImage', { ...props, testID: 'mock-image' }),
  };
});

jest.mock('expo-video', () => {
  const React = require('react');
  const useVideoPlayer = jest.fn((url: string) => ({
    play: jest.fn(),
    pause: jest.fn(),
    loop: false,
    muted: false,
    url,
  }));
  const VideoView = (props: any) => React.createElement('MockVideoView', { ...props, testID: 'mock-video-view' });
  return { useVideoPlayer, VideoView };
});

jest.mock('@/components/offers/MediaProgressIndicator', () => {
  const React = require('react');
  return (props: any) => React.createElement('MockMediaProgress', { ...props, testID: 'mock-media-progress' });
});

jest.mock('@/utils/mediaUrl', () => ({
  toAbsoluteMediaUrls: jest.fn((urls?: string[]) => (urls ? urls.map((u) => `abs-${u}`) : [])),
}));

const mockItem: OfertaServico = {
  _id: 'off1',
  titulo: 'Oferta Teste',
  descricao: 'Descrição Teste',
  preco: 100,
  unidadePreco: 'unidade',
  categoria: 'Teste',
  prestador: {
    nome: 'Prestador Teste',
    avatar: 'avatar.jpg',
  },
  localizacao: {
    cidade: 'Cidade Teste',
  },
  imagens: ['img1.jpg', 'img2.jpg'],
  videos: ['vid1.mp4'],
} as any;

const getPressable = (root: TestRenderer.ReactTestInstance) =>
  root.find((n) => n.props && n.props.accessibilityRole === 'image');

const getImage = (root: TestRenderer.ReactTestInstance) =>
  root.findAllByProps({ testID: 'mock-image' })[0] as any;

const getVideo = (root: TestRenderer.ReactTestInstance) =>
  root.findAllByProps({ testID: 'mock-video-view' })[0] as any;

const getProgress = (root: TestRenderer.ReactTestInstance) =>
  root.findAllByProps({ testID: 'mock-media-progress' })[0] as any;

describe('OfferSwipeCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar a primeira mídia inicialmente (imagem)', () => {
    const tr = TestRenderer.create(<OfferSwipeCard item={mockItem} isActiveCard={true} />);
    const root = tr.root;
    const image = getImage(root);
    expect(image.props.source.uri).toBe('abs-img1.jpg');
    const progress = getProgress(root);
    expect(progress.props.count).toBe(3);
    expect(progress.props.currentIndex).toBe(0);
  });

  it('deve navegar entre as mídias ao tocar nas laterais', () => {
    const tr = TestRenderer.create(<OfferSwipeCard item={mockItem} isActiveCard={true} />);
    const root = tr.root;
    const pressable = getPressable(root);

    act(() => {
      pressable.props.onLayout({ nativeEvent: { layout: { width: 300 } } });
    });

    // Próxima mídia (direita) -> img2
    act(() => {
      pressable.props.onPress({ nativeEvent: { locationX: 250 } });
    });
    let image = getImage(root);
    expect(image.props.source.uri).toBe('abs-img2.jpg');
    let progress = getProgress(root);
    expect(progress.props.currentIndex).toBe(1);

    // Próxima (direita) -> vídeo
    act(() => {
      pressable.props.onPress({ nativeEvent: { locationX: 250 } });
    });
    const video = getVideo(root);
    expect(video).toBeTruthy();
    progress = getProgress(root);
    expect(progress.props.currentIndex).toBe(2);

    // Voltar (esquerda) -> img2
    act(() => {
      pressable.props.onPress({ nativeEvent: { locationX: 50 } });
    });
    image = getImage(root);
    expect(image.props.source.uri).toBe('abs-img2.jpg');
    progress = getProgress(root);
    expect(progress.props.currentIndex).toBe(1);
  });

  it('deve resetar o índice quando isActiveCard mudar para false', () => {
    const tr = TestRenderer.create(<OfferSwipeCard item={mockItem} isActiveCard={true} />);
    const root = tr.root;
    const pressable = getPressable(root);

    act(() => {
      pressable.props.onLayout({ nativeEvent: { layout: { width: 300 } } });
      pressable.props.onPress({ nativeEvent: { locationX: 250 } }); // vai para índice 1
    });

    let progress = getProgress(root);
    expect(progress.props.currentIndex).toBe(1);

    act(() => {
      tr.update(<OfferSwipeCard item={mockItem} isActiveCard={false} />);
    });

    progress = getProgress(root);
    expect(progress.props.currentIndex).toBe(0);
  });

  it('deve resetar o índice quando o ID da oferta mudar', () => {
    const tr = TestRenderer.create(<OfferSwipeCard item={mockItem} isActiveCard={true} />);
    const root = tr.root;
    const pressable = getPressable(root);

    act(() => {
      pressable.props.onLayout({ nativeEvent: { layout: { width: 300 } } });
      pressable.props.onPress({ nativeEvent: { locationX: 250 } }); // vai para índice 1
    });

    let progress = getProgress(root);
    expect(progress.props.currentIndex).toBe(1);

    const newItem = { ...mockItem, _id: 'off2' } as any;
    act(() => {
      tr.update(<OfferSwipeCard item={newItem} isActiveCard={true} />);
    });

    progress = getProgress(root);
    expect(progress.props.currentIndex).toBe(0);
  });

  it('deve exibir o indicador de progresso com a contagem correta', () => {
    const tr = TestRenderer.create(<OfferSwipeCard item={mockItem} isActiveCard={true} />);
    const root = tr.root;
    const progress = getProgress(root);
    expect(progress.props.count).toBe(3); // 2 imagens + 1 vídeo
  });

  it('deve renderizar fallback se não houver mídias', () => {
    const itemSemMidia = { ...mockItem, imagens: [], videos: [] } as any;
    const tr = TestRenderer.create(<OfferSwipeCard item={itemSemMidia} isActiveCard={true} />);
    const root = tr.root;
    const image = getImage(root);
    expect(String(image.props.source.uri)).toContain('via.placeholder.com');
  });

  it('deve reproduzir/pausar vídeo conforme isActiveCard', () => {
    const { useVideoPlayer } = require('expo-video');
    const mockUseVideoPlayer = useVideoPlayer as jest.Mock;

    const tr = TestRenderer.create(<OfferSwipeCard item={mockItem} isActiveCard={true} />);
    const root = tr.root;
    const pressable = getPressable(root);

    act(() => {
      pressable.props.onLayout({ nativeEvent: { layout: { width: 300 } } });
      // Ir para vídeo (duas vezes à direita)
      pressable.props.onPress({ nativeEvent: { locationX: 250 } });
      pressable.props.onPress({ nativeEvent: { locationX: 250 } });
    });

    const playerInstance = mockUseVideoPlayer.mock.results.at(-1).value;
    expect(playerInstance.play).toHaveBeenCalled();

    act(() => {
      tr.update(<OfferSwipeCard item={mockItem} isActiveCard={false} />);
    });

    expect(playerInstance.pause).toHaveBeenCalled();
  });
});
