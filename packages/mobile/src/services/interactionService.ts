import api from './api';

/**
 * Interface que representa a resposta de uma interação com uma oferta.
 * 
 * @interface InteractionResponse
 * @property {string} message - Mensagem informativa sobre o resultado da operação.
 * @property {boolean} isNew - Indica se esta foi uma interação inédita para o usuário.
 */
export interface InteractionResponse {
    message: string;
    isNew: boolean;
}

/**
 * Objeto de serviço que agrupa as operações de interação do usuário com ofertas.
 * Realiza chamadas para a API v1 para persistir likes e dislikes.
 */
export const interactionService = {
    /**
     * Envia um "like" para uma oferta específica.
     * 
     * @async
     * @function likeOffer
     * @param {string} ofertaId - O ID da oferta que o usuário gostou.
     * @returns {Promise<InteractionResponse>} Objeto contendo a mensagem de retorno e se a interação é nova.
     */
    async likeOffer(ofertaId: string): Promise<InteractionResponse> {
        // Usa caminho relativo para respeitar o baseURL (que já inclui /api/)
        // Faz a chamada POST para o endpoint de like da oferta
        const response = await api.post<InteractionResponse>(`v1/ofertas/${ofertaId}/like`);
        
        // Retorna os dados processados da resposta da API
        return response.data;
    },

    /**
     * Envia um "dislike" para uma oferta específica.
     * 
     * @async
     * @function dislikeOffer
     * @param {string} ofertaId - O ID da oferta que o usuário não gostou.
     * @returns {Promise<InteractionResponse>} Objeto contendo a mensagem de retorno e se a interação é nova.
     */
    async dislikeOffer(ofertaId: string): Promise<InteractionResponse> {
        // Executa uma requisição POST para registrar que o usuário rejeitou a oferta
        const response = await api.post<InteractionResponse>(`v1/ofertas/${ofertaId}/dislike`);
        
        // Retorna o corpo da resposta (data) vindo do axios/api service
        return response.data;
    },
};
