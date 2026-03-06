import type { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Garante que o armazenamento MongoDB/GridFS esteja disponível antes de processar rotas que dependem dele.
 * Responde com 503 e formato ApiResponse quando o banco está ausente ou não conectado.
 * @param req Requisição Express que pode conter informações do usuário autenticado.
 * @param res Resposta Express usada para retornar erro de indisponibilidade quando necessário.
 * @param next Função que encaminha o fluxo para o próximo middleware/handler quando o armazenamento está disponível.
 * @returns void
 */
export function ensureStorageAvailable(req: Request, res: Response, next: NextFunction) {
    const db = getDatabase();
    // Se o banco não estiver conectado, registra o incidente e interrompe o fluxo com 503.
    if (!db) {
        logger.warn('Storage indisponível: tentativa de acessar rota protegida sem DB', {
            path: req.path,
            method: req.method,
            userId: (req as any)?.user?.id,
        });
        return res.status(503).json({
            success: false,
            message: 'Serviço de upload indisponível (banco de dados não conectado)'
        });
    }
    next();
}

export default ensureStorageAvailable;
