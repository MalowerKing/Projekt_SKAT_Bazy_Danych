import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import * as auth from '$lib/server/auth';
// --- MOCKI ---

vi.mock('$lib/server/db', () => ({
    db: {
        select: vi.fn(),
        insert: vi.fn(),
        delete: vi.fn(),
        transaction: vi.fn()
    }
}));

vi.mock('$lib/server/auth', async (importOriginal) => {
    const actual = await importOriginal<typeof import('$lib/server/auth')>();
    return {
        ...actual, // To zachowuje Twoją funkcję requireLogin oraz inne (hashPassword itp.)
        // Jeśli potrzebujesz szpiegować (spy) requireLogin, możesz to nadpisać tak:
        requireLogin: vi.fn(actual.requireLogin), 
    };
});


// Mockujemy generator ID, żeby testy były przewidywalne
vi.mock('@oslojs/encoding', () => ({
    encodeBase32LowerCase: vi.fn(() => 'mocked-id-123')
}));

// Pomocnik do tworzenia mocków łańcuchowych Drizzle (fluent API)
const createChainMock = (finalValue: any) => {
    const mock: any = {
        from: vi.fn(() => mock),
        where: vi.fn(() => mock),
        orderBy: vi.fn(() => mock),
        innerJoin: vi.fn(() => mock),
        leftJoin: vi.fn(() => mock),
        values: vi.fn(() => mock),
        // Drizzle kończy łańcuch obietnicą (Promise)
        then: (onfulfilled: any) => Promise.resolve(finalValue).then(onfulfilled),
        catch: (onrejected: any) => Promise.resolve(finalValue).catch(onrejected)
    };
    return mock;
};

describe('Page Server Load & Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('load()', () => {
        it('powinien przkierować do /loginrequired, gdy brak sesji', async () => {
            const event = { locals: { user: null } };
            
            await expect(load(event as any)).rejects.toThrow('Redirect');
            expect(auth.requireLogin).toHaveBeenCalled();
        });

        it('powinien pobrać wszystkie dane dla zalogowanego użytkownika', async () => {
            const mockUser = { id: 'user-1' };
            
            // Konfigurujemy 3 różne odpowiedzi dla 3 selectów wewnątrz load()
            (db.select as any)
                .mockReturnValueOnce(createChainMock([{ idZaproszenia: 'z-1' }])) // mojeZaproszenia
                .mockReturnValueOnce(createChainMock([{ id: 'u-2', nazwa: 'Inny' }])) // wszyscyGracze
                .mockReturnValueOnce(createChainMock([{ id: 't-1', nazwa: 'Turniej' }])); // wszystkieTurnieje

            const result = await load({ locals: { user: mockUser } } as any);

            expect(result.currentUserId).toBe('user-1');
            expect(result.mojeZaproszenia).toHaveLength(1);
            expect(result.wszyscyGracze).toHaveLength(1);
            expect(db.select).toHaveBeenCalledTimes(3);
        });
    });

    describe('actions', () => {
        // Helper do tworzenia sztucznego Requestu z danymi formularza
        const createFormRequest = (data: Record<string, string>) => ({
            request: {
                formData: async () => new Map(Object.entries(data))
            }
        } as any);

        it('wyslijZaproszenie: powinien zwrócić sukces przy poprawnych danych', async () => {
            (db.insert as any).mockReturnValue(createChainMock({}));

            const result = await actions.wyslijZaproszenie(
                createFormRequest({ graczId: 'g1', turniejId: 't1' })
            );

            expect(result).toEqual({ success: true, message: 'Zaproszenie wysłane' });
            expect(db.insert).toHaveBeenCalledWith(schema.zaproszenia);
        });

        it('wyslijZaproszenie: powinien zwrócić fail(400) przy braku danych', async () => {
            const result = await actions.wyslijZaproszenie(
                createFormRequest({ graczId: '' }) // brak turniejId
            );

            // SvelteKit fail() zwraca status i dane
            expect(result.status).toBe(400);
            expect(result.data).toEqual({ missing: true });
        });

        it('akceptujZaproszenie: powinien wykonać transakcję (insert + delete)', async () => {
            // Mockujemy transakcję - przekazujemy do niej "udawany" obiekt tx
            const mockTx = {
                insert: vi.fn(() => createChainMock({})),
                delete: vi.fn(() => createChainMock({}))
            };
            
            (db.transaction as any).mockImplementation(async (cb: any) => {
                return await cb(mockTx);
            });

            const result = await actions.akceptujZaproszenie(
                createFormRequest({ graczId: 'g1', turniejId: 't1' })
            );

            expect(result).toEqual({ success: true, message: 'Dołączono do turnieju!' });
            expect(mockTx.insert).toHaveBeenCalledWith(schema.listaUczestnikowTurniej);
            expect(mockTx.delete).toHaveBeenCalledWith(schema.zaproszenia);
        });

        it('zobaczZaproszenia: powinien zwrócić listę zaproszonych', async () => {
            const mockList = [{ idZaproszenia: 'z1', zaproszonyGracz: 'Test' }];
            (db.select as any).mockReturnValue(createChainMock(mockList));

            const result = await actions.zobaczZaproszenia(
                createFormRequest({ turniejId: 't1' })
            );

            expect(result.success).toBe(true);
            // @ts-ignore
            expect(result.list).toEqual(mockList);
        });

        it('odrzucZaproszenie: powinien zwrócić błąd 500 przy rzuceniu wyjątku przez bazę', async () => {
            // Symulujemy błąd bazy
            (db.delete as any).mockImplementation(() => {
                throw new Error('Database connection lost');
            });

            const result = await actions.odrzucZaproszenie(
                createFormRequest({ graczId: 'g1', turniejId: 't1' })
            );

            expect(result.status).toBe(500);
            expect(result.data).toEqual({ message: 'Błąd podczas odrzucania' });
        });
    });
});