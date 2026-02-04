/**
 * Ponto de entrada principal do servidor backend.
 * Este arquivo é responsável por inicializar a conexão com o banco de dados,
 * configurar o servidor HTTP e lidar com o encerramento gracioso da aplicação.
 */

import config from './config';
import http from 'http';
import app from './app';
import connectDB from './config/database';
import { logger, loggerUtils } from './utils/logger';

// Definição da porta e host a partir das configurações centralizadas
const PORT = config.PORT;
const HOST = (config as any).HOST || '0.0.0.0';

/**
 * Inicializa os serviços necessários e coloca o servidor em modo de escuta.
 * 
 * @async
 * @function start
 * @throws {Error} Lança um erro caso falhe na conexão com o DB ou na inicialização do servidor.
 * @returns {Promise<void>}
 */
async function start() {
    try {
        // Conecta ao MongoDB (ou pula se SKIP_DB=true nas variáveis de ambiente)
        await connectDB();

        // Cria o servidor HTTP utilizando a instância do app Express
        const server = http.createServer(app);

        // Inicia a escuta por conexões na porta e host configurados
        server.listen(PORT, HOST, () => {
            logger.info(`Super App backend iniciado em http://${HOST}:${PORT}`);
        });

        /**
         * Tratamento de erros específicos do servidor HTTP.
         */
        server.on('error', (err: NodeJS.ErrnoException) => {
            if (err.code === 'EADDRINUSE') {
                logger.error(`Porta ${PORT} já está em uso.`);
            } else {
                logger.error('Erro no servidor HTTP', { message: err.message, stack: err.stack });
            }
            // Encerra o processo com erro caso o servidor não consiga iniciar
            process.exit(1);
        });

        /**
         * Função para realizar o encerramento gracioso (graceful shutdown).
         * @param signal - O sinal de sistema recebido (ex: SIGINT, SIGTERM).
         */
        const shutdown = (signal: string) => {
            return () => {
                logger.info(`Recebido ${signal}. Encerrando servidor...`);
                server.close(() => {
                    logger.info('Servidor encerrado.');
                    process.exit(0);
                });
                // Força o encerramento após 10 segundos se as conexões não fecharem
                setTimeout(() => process.exit(1), 10000).unref();
            };
        };

        // Escuta por sinais de interrupção e término do sistema operacional
        process.on('SIGINT', shutdown('SIGINT'));
        process.on('SIGTERM', shutdown('SIGTERM'));

        /**
         * Captura promessas rejeitadas que não foram tratadas com catch.
         */
        process.on('unhandledRejection', (reason: any) => {
            const err = reason instanceof Error ? reason : new Error(String(reason));
            loggerUtils.logError(err, { scope: 'unhandledRejection' });
        });

        /**
         * Captura exceções inesperadas que não foram tratadas em blocos try-catch.
         */
        process.on('uncaughtException', (error: any) => {
            const err = error instanceof Error ? error : new Error(String(error));
            loggerUtils.logError(err, { scope: 'uncaughtException' });
            process.exit(1);
        });
    } catch (error: any) {
        // Loga falhas críticas durante a fase de inicialização
        logger.error('Falha ao iniciar o servidor', { message: error?.message, stack: error?.stack });
        process.exit(1);
    }
}

// Executa a função de inicialização
void start();
