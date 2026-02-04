import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../app';
import { UserOfferInteraction } from '../../models/UserOfferInteraction';
import { OfertaServico } from '../../models/OfertaServico';

describe('Interaction API', () => {
    let mongoServer: MongoMemoryServer;
    let authToken: string;
    let testOfertaId: string;
    let userId: string;

    beforeAll(async () => {
        jest.setTimeout(60000);
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri());

        const registerRes = await request(app)
            .post('/api/auth/register')
            .send({
                nome: 'Test User',
                email: 'interaction@test.com',
                password: 'password123',
                tipoPessoa: 'PF',
                cpf: '52998224725',
            })
            .expect(201);

        authToken = registerRes.body.data.token;
        userId = String(registerRes.body.data.user.id);

        const oferta = await OfertaServico.create({
            titulo: 'Oferta Teste',
            descricao: 'Descricao de teste',
            preco: 100,
            unidadePreco: 'pacote',
            categoria: 'Tecnologia',
            subcategoria: 'Software',
            prestador: {
                _id: new mongoose.Types.ObjectId(userId),
                nome: 'Test User',
                avaliacao: 5,
                tipoPessoa: 'PF',
            },
            imagens: [],
            localizacao: {
                cidade: 'Sao Paulo',
                estado: 'SP',
            },
            status: 'ativo',
        });

        testOfertaId = String(oferta._id);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        await UserOfferInteraction.deleteMany({});
    });

    describe('POST /api/v1/ofertas/:id/like', () => {
        it('deve registrar um like com sucesso', async () => {
            const response = await request(app)
                .post(`/api/v1/ofertas/${testOfertaId}/like`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.message).toBe('Oferta curtida com sucesso');
            expect(response.body.isNew).toBe(true);
        });

        it('deve ser idempotente (não criar duplicatas)', async () => {
            await request(app)
                .post(`/api/v1/ofertas/${testOfertaId}/like`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const response = await request(app)
                .post(`/api/v1/ofertas/${testOfertaId}/like`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.isNew).toBe(false);

            const count = await UserOfferInteraction.countDocuments();
            expect(count).toBe(1);
        });

        it('deve retornar 401 sem autenticação', async () => {
            await request(app)
                .post(`/api/v1/ofertas/${testOfertaId}/like`)
                .expect(401);
        });
    });

    describe('POST /api/v1/ofertas/:id/dislike', () => {
        it('deve registrar um dislike com sucesso', async () => {
            const response = await request(app)
                .post(`/api/v1/ofertas/${testOfertaId}/dislike`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.message).toBe('Oferta descartada com sucesso');
        });
    });

    describe('Filtragem de Ofertas Interagidas', () => {
        it('não deve retornar ofertas que o usuário já deu like', async () => {
            // Dar like na oferta
            await request(app)
                .post(`/api/v1/ofertas/${testOfertaId}/like`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Listar ofertas
            const response = await request(app)
                .get('/api/ofertas')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const ofertas = response.body.data.ofertas;
            const encontrada = ofertas.find((o: any) => o._id === testOfertaId);
            expect(encontrada).toBeUndefined();
        });

        it('não deve retornar ofertas que o usuário já deu dislike', async () => {
            // Dar dislike na oferta
            await request(app)
                .post(`/api/v1/ofertas/${testOfertaId}/dislike`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Listar ofertas
            const response = await request(app)
                .get('/api/ofertas')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const ofertas = response.body.data.ofertas;
            const encontrada = ofertas.find((o: any) => o._id === testOfertaId);
            expect(encontrada).toBeUndefined();
        });
    });
});
