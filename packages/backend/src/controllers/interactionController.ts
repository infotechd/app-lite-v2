import { Response, NextFunction } from 'express';
import { interactionService } from '../services/interactionService';
import { interactionParamsSchema } from '../validation/interactionValidation';
import { ZodError } from 'zod';
import { AuthRequest } from '../middleware/auth';

/**
 * Controller responsável por gerenciar as interações dos usuários com as ofertas.
 * Contém métodos para registrar curtidas (likes) e descartes (dislikes).
 */
export const interactionController = {
    /**
     * Registra uma curtida (like) em uma oferta específica.
     * 
     * O método valida o ID da oferta recebido nos parâmetros, verifica se o usuário
     * está autenticado e solicita ao serviço de interação que registre o 'like'.
     *
     * @param req - Objeto de requisição do Express contendo os parâmetros e dados do usuário autenticado.
     * @param res - Objeto de resposta do Express utilizado para enviar o status e dados de retorno.
     * @param next - Função do Express para encaminhar erros para o middleware de tratamento de erros.
     * @returns Uma Promise que resolve com o envio da resposta HTTP ao cliente.
     */
    async likeOffer(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            // Valida o parâmetro 'id' da oferta usando o schema Zod definido
            const { id } = interactionParamsSchema.parse(req.params);
            
            // Recupera o ID do usuário injetado pelo middleware de autenticação
            const userId = req.user?.id;

            // Verifica se o usuário está devidamente autenticado
            if (!userId) {
                res.status(401).json({ error: 'Usuário não autenticado' });
                return;
            }

            // Chama o serviço para registrar a interação de 'like' no banco de dados
            const result = await interactionService.recordInteraction(userId, id, 'like');
            
            // Se o serviço retornar falha, responde com erro de servidor
            if (!result.success) {
                res.status(500).json({ error: 'Não foi possível registrar a interação' });
                return;
            }

            // Retorna sucesso confirmando a curtida e informando se é uma nova interação
            res.status(200).json({
                message: 'Oferta curtida com sucesso',
                isNew: result.isNew
            });
        } catch (error) {
            // Tratamento específico para erros de validação do Zod
            if (error instanceof ZodError) {
                res.status(400).json({
                    error: 'Dados inválidos',
                    details: error.errors
                });
                return;
            }
            // Encaminha erros inesperados para o próximo middleware (global error handler)
            next(error);
        }
    },

    /**
     * Registra um descarte (dislike) em uma oferta específica.
     * 
     * O método valida o ID da oferta, verifica a autenticação do usuário e solicita
     * ao serviço de interação que registre o 'dislike', impedindo que a oferta
     * apareça novamente para este usuário em certas listagens.
     *
     * @param req - Objeto de requisição do Express contendo os parâmetros e dados do usuário autenticado.
     * @param res - Objeto de resposta do Express utilizado para enviar o status e dados de retorno.
     * @param next - Função do Express para encaminhar erros para o middleware de tratamento de erros.
     * @returns Uma Promise que resolve com o envio da resposta HTTP ao cliente.
     */
    async dislikeOffer(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            // Valida o parâmetro 'id' da oferta usando o schema Zod definido
            const { id } = interactionParamsSchema.parse(req.params);
            
            // Recupera o ID do usuário injetado pelo middleware de autenticação
            const userId = req.user?.id;

            // Verifica se o usuário está devidamente autenticado
            if (!userId) {
                res.status(401).json({ error: 'Usuário não autenticado' });
                return;
            }

            // Chama o serviço para registrar a interação de 'dislike' no banco de dados
            const result = await interactionService.recordInteraction(userId, id, 'dislike');
            
            // Se o serviço retornar falha, responde com erro de servidor
            if (!result.success) {
                res.status(500).json({ error: 'Não foi possível registrar a interação' });
                return;
            }

            // Retorna sucesso confirmando o descarte e informando se é uma nova interação
            res.status(200).json({
                message: 'Oferta descartada com sucesso',
                isNew: result.isNew
            });
        } catch (error) {
            // Tratamento específico para erros de validação do Zod
            if (error instanceof ZodError) {
                res.status(400).json({
                    error: 'Dados inválidos',
                    details: error.errors
                });
                return;
            }
            // Encaminha erros inesperados para o próximo middleware (global error handler)
            next(error);
        }
    }
};
