# Documentação do Fluxo de Redirecionamento de Perfil

Este documento descreve detalhadamente o fluxo de redirecionamento de perfil a partir de uma oferta de serviço, abrangendo os modos de visualização Lista e Swipe, bem como as melhorias técnicas implementadas.

---

## 1. Gatilhos de Redirecionamento (Trigger Points)

O ponto de partida depende do componente de oferta utilizado:

- **Modo Lista de Oferta (`OfferCard`):**
    - O redirecionamento é acionado ao clicar na área do prestador, localizada no rodapé do card (`prestadorArea`).
    - Esta área contém o nome do prestador e um ícone de conta.
    - **Implementação:** Utiliza o componente `OfferCard.tsx`, onde o evento `onPress` captura os dados do prestador e dispara a ação de exibição via contexto.

- **Modo Swipe de Oferta (`OfferSwipeCard`):**
    - O gatilho está dentro do componente `OfferDetails`, na seção de informações do prestador (`prestadorInfo`).
    - O clique engloba tanto o **Avatar** (foto ou iniciais) quanto o nome e a cidade do prestador.
    - **Diferencial Técnico:** É utilizado o `e.stopPropagation()` para evitar que o clique no prestador também acione o clique geral do card (que abriria os detalhes da oferta).

---

## 2. O Estágio de Pré-visualização (Preview)

Em ambos os modos, o aplicativo utiliza o `ProfilePreviewContext` para exibir um estágio intermediário antes da navegação completa:

1.  **Abertura do Modal:** Um modal de sobreposição (via `react-native-paper`) é exibido instantaneamente.
2.  **Exibição Resumida:** O componente `ProfileHeader` é renderizado dentro deste modal com a flag `isPreview={true}`.
3.  **Elementos do Preview:**
    - Avatar com suporte a `OptimizedImage` e `blurhash` (evitando espaços em branco durante o carregamento).
    - Nome verificado e Badge de Verificação.
    - Métricas principais (KPIs): Nota de avaliação, número de seguidores e pedidos realizados.
    - **Dados de Contato Condicionais:** Telefone e localização detalhada são exibidos especificamente no modo preview para facilitar o contato rápido.

---

## 3. Navegação Final para o Perfil Completo

Ao clicar no botão **"Ver Perfil Completo"**, a função `navigateToProfile` executa os seguintes passos:

1.  **Fechamento Suave do Modal:** O estado de visibilidade é alterado para falso.
2.  **Otimização de Performance:** Utiliza `requestAnimationFrame` para garantir que o modal seja fechado completamente antes de iniciar a transição de tela, evitando travamentos visuais (*jank*).
3.  **Navegação Aninhada:** Utiliza o `navigationRef` para realizar uma navegação para a aba de Perfil (`Perfil`), direcionando especificamente para a tela `ProfileHome`.
4.  **Passagem de Parâmetros:** O `userId` do prestador é passado como parâmetro na rota.
5.  **Carregamento Dinâmico:** A tela `ProfileHome` decide qual visualização exibir (`UserProfileView` para o próprio usuário ou `GuestProfileView` para terceiros).

---

## 4. Inteligência e Refinamentos Técnicos

### Identificação do Usuário (`isMe`)
- **Integração com AuthContext:** O sistema utiliza o `useAuth()` para verificar se o prestador da oferta é o próprio usuário logado.
- **Prioridade de Dados:** Se for o perfil do próprio usuário (`isMe`), o sistema prioriza dados em tempo real do contexto de autenticação em vez dos dados denormalizados da oferta.

### Gestão de Experiência do Visitante (Guest Flow)
- **Redirecionamento Pendente:** Se um usuário não autenticado tenta acessar o perfil, o sistema utiliza `setPendingRedirect({ routeName: 'ProfileHome' })`. Após o login, o usuário é levado automaticamente de volta ao perfil desejado.

### Monitoramento e Analytics
- **Captura de Eventos:** Cada interação no fluxo dispara eventos para o `AnalyticsService` (`profile_view`, `profile_edit_click`, etc.), permitindo medir o engajamento entre os diferentes modos de oferta.

---

## 5. Resumo Comparativo de Evolução

| Recurso | Primeira Análise | Refinamentos Atuais |
| :--- | :--- | :--- |
| **Dados do Avatar** | Genérico | Otimizado com `blurhash` e tratamento de erro |
| **Lógica `isMe`** | Básica | Integrada ao `AuthContext` com dados reais |
| **Navegação** | Direta | Suavizada com `requestAnimationFrame` |
| **Usuário Deslogado** | Não detalhado | Fluxo de `PendingRedirect` após login |
| **Informações no Preview**| Resumidas | Inclui Telefone, Localização e Badge |
| **Analytics** | Não mencionado | Monitoramento completo de conversão |
