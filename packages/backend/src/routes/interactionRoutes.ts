/**
 * Configuração das rotas de interação do usuário com ofertas.
 * Este módulo define os endpoints para registrar curtidas e descartes de ofertas.
 * Todas as rotas aqui definidas são protegidas por autenticação.
 */

import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { interactionController } from '../controllers/interactionController';
import { authMiddleware } from '../middleware/auth';

/**
 * Instância do roteador Express para gerenciar as rotas de interação.
 * @type {ExpressRouter}
 */
const router: ExpressRouter = Router();

/**
 * Middleware de Autenticação Global.
 * Todas as rotas de interação exigem que o usuário esteja autenticado via token JWT.
 * O middleware valida o token e extrai as informações do usuário para a requisição.
 */
router.use(authMiddleware);

/**
 * POST /ofertas/:id/like
 * 
 * Registra um "Like" (curtida) do usuário em uma oferta específica.
 * Este endpoint é utilizado para indicar interesse em uma oportunidade.
 * 
 * @name LikeOffer
 * @path {POST} /ofertas/:id/like
 * @params {string} id - O ID único da oferta (formato ObjectId do MongoDB).
 * @auth Requer token JWT válido no cabeçalho Authorization.
 * @response {200} Sucesso no registro da interação.
 * @response {400} Erro de validação nos parâmetros.
 * @response {401} Usuário não autenticado.
 * @response {500} Erro interno ao processar a interação.
 */
router.post('/ofertas/:id/like', interactionController.likeOffer);

/**
 * POST /ofertas/:id/dislike
 * 
 * Registra um "Dislike" (descarte) do usuário em uma oferta específica.
 * Indica que o usuário não tem interesse na oferta, permitindo que o sistema
 * filtre e não apresente esta oferta novamente para ele.
 * 
 * @name DislikeOffer
 * @path {POST} /ofertas/:id/dislike
 * @params {string} id - O ID único da oferta (formato ObjectId do MongoDB).
 * @auth Requer token JWT válido no cabeçalho Authorization.
 * @response {200} Sucesso no registro da interação.
 * @response {400} Erro de validação nos parâmetros.
 * @response {401} Usuário não autenticado.
 * @response {500} Erro interno ao processar a interação.
 */
router.post('/ofertas/:id/dislike', interactionController.dislikeOffer);

/**
 * Exporta o roteador configurado para ser utilizado na aplicação principal.
 */
export default router;
