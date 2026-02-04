import { z } from 'zod';

/**
 * Esquema de validação para os parâmetros de interação.
 * Utiliza a biblioteca Zod para garantir que os dados recebidos estejam no formato correto.
 */
export const interactionParamsSchema = z.object({
    /**
     * Identificador único da oferta.
     * Deve ser uma string que represente um ObjectId válido do MongoDB (24 caracteres hexadecimais).
     */
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de oferta inválido') // Validação por expressão regular para ObjectId
});

/**
 * Tipo inferido a partir do esquema interactionParamsSchema.
 * Representa a estrutura de dados esperada para os parâmetros de interação.
 */
export type InteractionParams = z.infer<typeof interactionParamsSchema>;
