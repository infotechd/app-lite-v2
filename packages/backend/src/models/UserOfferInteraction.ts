import mongoose, { Document, Schema } from 'mongoose';

/**
 * Interface que representa a estrutura de uma interação de usuário com uma oferta.
 * Define os campos e tipos para o documento de interação no banco de dados MongoDB.
 * 
 * @interface IUserOfferInteraction
 * @extends {Document}
 */
export interface IUserOfferInteraction extends Document {
    /** ID do usuário que realizou a interação (referência ao modelo User) */
    userId: mongoose.Types.ObjectId;
    /** ID da oferta com a qual o usuário interagiu (referência ao modelo OfertaServico) */
    ofertaId: mongoose.Types.ObjectId;
    /** Tipo de interação realizada: 'like' para interesse ou 'dislike' para desinteresse */
    interaction: 'like' | 'dislike';
    /** Data de criação do registro (gerada automaticamente pelo Mongoose) */
    createdAt: Date;
    /** Data da última atualização do registro (gerada automaticamente pelo Mongoose) */
    updatedAt: Date;
}

/**
 * Definição do Schema do Mongoose para a coleção UserOfferInteraction.
 * Este schema armazena as reações dos usuários às ofertas de serviço.
 */
const UserOfferInteractionSchema = new Schema<IUserOfferInteraction>({
    /** 
     * Referência ao Usuário.
     * Obrigatório e indexado para otimizar buscas por interações de um usuário específico.
     */
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    /** 
     * Referência à Oferta de Serviço.
     * Obrigatório e indexado para otimizar buscas por interações em uma oferta específica.
     */
    ofertaId: {
        type: Schema.Types.ObjectId,
        ref: 'OfertaServico',
        required: true,
        index: true
    },
    /** 
     * Valor da interação.
     * Define se o usuário gostou ou não da oferta.
     */
    interaction: {
        type: String,
        enum: ['like', 'dislike'],
        required: true
    },
}, {
    /** 
     * Gerenciamento automático de timestamps.
     * Cria e mantém os campos createdAt e updatedAt.
     */
    timestamps: true
});

/**
 * Configuração de Índice Composto.
 * Garante que um mesmo usuário não possa ter mais de uma interação registrada para a mesma oferta.
 * Além disso, melhora consideravelmente a performance de consultas que utilizam ambos os campos.
 */
UserOfferInteractionSchema.index(
    { userId: 1, ofertaId: 1 },
    { unique: true }
);

/**
 * Modelo Mongoose compilado para a entidade UserOfferInteraction.
 * Utilizado para realizar operações de banco de dados (CRUD) na coleção correspondente.
 */
export const UserOfferInteraction = mongoose.model<IUserOfferInteraction>(
    'UserOfferInteraction',
    UserOfferInteractionSchema
);
