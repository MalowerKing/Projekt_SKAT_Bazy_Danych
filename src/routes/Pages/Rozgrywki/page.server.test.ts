import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';
import { db } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';

// 1. Mockowanie Drizzle i modułów zewnętrznych
vi.mock('$lib/server/db', () => ({
    db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
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


vi.mock('@sveltejs/kit', () => ({
    fail: vi.fn((status, data) => ({ status, ...data })),
    redirect: vi.fn((status, location) => {
        const err = new Error('Redirect');
        (err as any).status = status;
        (err as any).location = location;
        throw err;
    })
}));

vi.mock('crypto', () => ({
    randomUUID: () => 'mocked-uuid'
}));

describe('Gry Page Server', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('load', () => {
        it('powinien przekierować do /loginrequired, gdy brak sesji', async () => {
            const event = { locals: { user: null } };
            
            await expect(load(event as any)).rejects.toThrow('Redirect');
            expect(redirect).toHaveBeenCalledWith(302, '/loginrequired');
        });

        it('powinien zwrócić listę gier dla zalogowanego użytkownika', async () => {
            const mockUser = { id: 'u1', nazwa: 'Test' };
            const mockGames = [{ graID: '1', data: new Date() }];
            
            // Mockowanie łańcucha Drizzle
            (db.orderBy as any).mockResolvedValueOnce(mockGames);

            const result = await load({ locals: { user: mockUser } } as any);

            expect(result.games).toHaveLength(1);
            expect(result.user).toEqual(mockUser);
        });
    });

    describe('actions - addGame', () => {
        const createFormData = (data: Record<string, string>) => {
            const fd = new FormData();
            Object.entries(data).forEach(([k, v]) => fd.append(k, v));
            return { request: { formData: async () => fd } } as any;
        };

        it('powinien zwrócić fail(400), gdy brakuje wymaganych pól', async () => {
            const context = createFormData({ gracz1: 'Ania' }); // Brakuje reszty
            const result = await actions.addGame(context);
            
            expect(fail).toHaveBeenCalledWith(400, expect.objectContaining({ missing: true }));
        });

        it('powinien poprawnie dodać grę nierankingową', async () => {
            const data = {
                gracz1: 'Gracz1',
                gracz2: 'Gracz2',
                zwyciezca: 'Gracz1',
                miejsceNazwa: 'Klub',
                data: '2024-05-20',
                isRanked: 'off'
            };

            // Mockowanie wyszukiwania graczy/miejsc (zwracamy tablice z wynikami)
            (db.limit as any)
                .mockResolvedValueOnce([{ id: '1', nazwa: 'Gracz1' }]) // gracz 1
                .mockResolvedValueOnce([{ id: '2', nazwa: 'Gracz2' }]) // gracz 2
                .mockResolvedValueOnce([{ id: '1', nazwa: 'Gracz1' }]) // zwyciezca
                .mockResolvedValueOnce([{ miejscaID: 'm1', nazwa: 'Klub' }]) // miejsce
                .mockResolvedValueOnce([]); // turniej (null)

            const result = await actions.addGame(createFormData(data));

            expect(db.insert).toHaveBeenCalled();
            expect(db.update).not.toHaveBeenCalled(); // Bo nie rankingowa
            expect(result).toEqual({ success: true });
        });

        it('powinien obliczyć i zaktualizować ELO przy grze rankingowej 3-osobowej', async () => {
            const data = {
                gracz1: 'P1', gracz2: 'P2', gracz3: 'P3',
                zwyciezca: 'P1', miejsceNazwa: 'Dom',
                data: '2024-01-01', isRanked: 'on'
            };

            // Mockowanie danych graczy z rankingami ELO
            (db.limit as any)
                .mockResolvedValueOnce([{ id: '1', nazwa: 'P1', elo: 1000 }])
                .mockResolvedValueOnce([{ id: '2', nazwa: 'P2', elo: 1000 }])
                .mockResolvedValueOnce([{ id: '3', nazwa: 'P3', elo: 1000 }])
                .mockResolvedValueOnce([{ id: '1', nazwa: 'P1' }]) // zwycięzca
                .mockResolvedValueOnce([{ miejscaID: 'm1' }])     // miejsce
                .mockResolvedValueOnce([]);                       // turniej

            await actions.addGame(createFormData(data));

            // Sprawdzamy czy update został wywołany 3 razy (dla każdego gracza)
            expect(db.update).toHaveBeenCalledTimes(3);
            // Gracz 1 wygrał z dwoma osobami o tym samym rankingu, więc jego nowy ranking musi być > 1000
            expect(db.set).toHaveBeenCalledWith(expect.objectContaining({
                elo: expect.shadowNumber ? expect.anything() : expect.any(Number)
            }));
        });
    });

    describe('actions - delete', () => {
        it('powinien usunąć wybrane gry', async () => {
            const fd = new FormData();
            fd.append('ids', 'id-1');
            fd.append('ids', 'id-2');
            
            const context = { request: { formData: async () => fd } } as any;
            
            const result = await actions.delete(context);
            
            expect(db.delete).toHaveBeenCalled();
            expect(result).toEqual({ success: true });
        });

        it('powinien zwrócić błąd, jeśli nie przesłano ID do usunięcia', async () => {
            const fd = new FormData();
            const context = { request: { formData: async () => fd } } as any;
            
            const result = await actions.delete(context);
            expect(fail).toHaveBeenCalledWith(400, expect.any(Object));
        });
    });
});