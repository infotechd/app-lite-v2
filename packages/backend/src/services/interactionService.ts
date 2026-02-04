import mongoose from 'mongoose';
import { UserOfferInteraction, IUserOfferInteraction } from '../models/UserOfferInteraction';

/**
 * Interface que define o formato da resposta após uma operação de interação.
 * 
 * @interface InteractionResult
 */
export interface InteractionResult {
    /** Indica se a operação de registro da interação foi concluída com sucesso. */
    success: boolean;
    /** O documento de interação retornado do banco de dados, ou null em caso de falha. */
    interaction: IUserOfferInteraction | null;
    /** 
     * Indica se esta interação acabou de ser criada.
     * Verdadeiro se for uma nova inserção (primeira vez que o usuário interage com esta oferta),
     * Falso se for apenas uma atualização de uma interação existente.
     */
    isNew: boolean;
}

/**
 * Objeto de serviço que agrupa lógicas de negócio relacionadas às interações usuário-oferta.
 * Fornece métodos para registrar, consultar e listar interações.
 */
export const interactionService = {
    /**
     * Registra ou atualiza a interação de um usuário com uma oferta específica.
     * Utiliza a operação 'findOneAndUpdate' com a opção 'upsert' para garantir que
     * apenas um registro exista por par usuário/oferta.
     * 
     * @param {string} userId - O ID do usuário (string) que será convertido para ObjectId.
     * @param {string} ofertaId - O ID da oferta (string) que será convertido para ObjectId.
     * @param {'like' | 'dislike'} type - O tipo de interação escolhido pelo usuário.
     * @returns {Promise<InteractionResult>} Um objeto contendo o sucesso da operação, a interação e se é um novo registro.
     */
    async recordInteraction(
        userId: string,
        ofertaId: string,
        type: 'like' | 'dislike'
    ): Promise<InteractionResult> {
        // Realiza a busca e atualização atômica no MongoDB
        const result = await UserOfferInteraction.findOneAndUpdate(
            {
                // Critérios de busca: combinação única de usuário e oferta
                userId: new mongoose.Types.ObjectId(userId),
                ofertaId: new mongoose.Types.ObjectId(ofertaId)
            },
            {
                // Dados a serem atualizados
                interaction: type
            },
            {
                upsert: true,            // Se não encontrar, cria um novo documento
                new: true,               // Retorna o documento após a atualização/criação
                setDefaultsOnInsert: true // Garante a aplicação de valores default do schema em novos registros
            }
        );

        // Se por algum motivo o Mongoose não retornar o documento (ex: erro silencioso)
        if (!result) {
            return { success: false, interaction: null, isNew: false };
        }

        // Verifica se é uma nova interação comparando as datas de criação e atualização
        return {
            success: true,
            interaction: result,
            isNew: result.createdAt.getTime() === result.updatedAt.getTime()
        };
    },

    /**
     * Recupera todos os IDs de ofertas com as quais o usuário já interagiu (likes ou dislikes).
     * Útil para filtrar ofertas que já foram apresentadas ao usuário em sistemas de recomendação ou swipe.
     * 
     * @param {string} userId - O ID do usuário para consulta.
     * @returns {Promise<mongoose.Types.ObjectId[]>} Uma lista contendo apenas os ObjectIds das ofertas.
     */
    async getInteractedOfferIds(userId: string): Promise<mongoose.Types.ObjectId[]> {
        // Busca todas as interações do usuário, otimizando a consulta com projeção e lean
        const interactions = await UserOfferInteraction.find({
            userId: new mongoose.Types.ObjectId(userId)
        })
            .select('ofertaId -_id') // Seleciona apenas ofertaId e remove o campo padrão _id do resultado
            .lean();                 // Melhora performance retornando objetos JS puros em vez de documentos Mongoose

        // Extrai apenas os IDs das ofertas do array de objetos retornado
        return interactions.map((interaction) => interaction.ofertaId);
    },

    /**
     * Obtém as ofertas que receberam "like" de um usuário específico, com suporte a paginação.
     * Os resultados são ordenados do mais recente para o mais antigo.
     * 
     * @param {string} userId - O ID do usuário para consulta.
     * @param {number} [page=1] - O número da página atual (padrão é 1).
     * @param {number} [limit=20] - A quantidade de registros por página (padrão é 20).
     * @returns {Promise<any[]>} Uma lista de interações populadas com os dados completos da oferta.
     */
    async getUserLikedOffers(userId: string, page = 1, limit = 20) {
        // Cálculo matemático para determinar quantos registros pular com base na página e limite
        const skip = (page - 1) * limit;

        // Executa a consulta com filtros, ordenação, paginação e população de dados
        const interactions = await UserOfferInteraction.find({
            userId: new mongoose.Types.ObjectId(userId),
            interaction: 'like' // Filtra apenas pelas interações positivas
        })
            .sort({ createdAt: -1 }) // Ordena pelas interações mais recentes
            .skip(skip)              // Pula registros de páginas anteriores
            .limit(limit)            // Restringe o tamanho do lote de dados
            .populate('ofertaId')    // Faz o "join" com a coleção de ofertas para trazer os detalhes
            .lean();                 // Retorna objetos leves para otimizar o consumo de memória

        return interactions;
    }
};
