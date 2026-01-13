import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';
import { db } from '$lib/server/db';
import { fail } from '@sveltejs/kit';

// --- MOCKI ---

vi.mock('$lib/server/db', () => ({
    db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        transaction: vi.fn(),
    }
}));

vi.mock('@sveltejs/kit', () => ({
    fail: vi.fn((status, data) => ({ status, ...data }))
}));

vi.mock('crypto', () => ({
    randomUUID: () => 'mock-uuid-123'
}));

describe('Turnieje Page Server', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createEvent = (formDataObj: Record<string, string | string[]>, userId = 'user-123') => ({
        locals: { session: { userId } },
        request: {
            formData: async () => {
                const fd = new FormData();
                Object.entries(formDataObj).forEach(([k, v]) => {
                    if (Array.isArray(v)) v.forEach(val => fd.append(k, val));
                    else fd.append(k, v);
                });
                return fd;
            }
        }
    } as any);

    describe('actions', () => {
        
        describe('addTurniej', () => {
            it('powinien dodać turniej przy kompletnych danych', async () => {
                const event = createEvent({
                    nazwa: 'Mistrzostwa',
                    miejsceId: 'm1',
                    data: '2024-06-01',
                    godzina: '18:00'
                });

                const result = await actions.addTurniej(event);
                expect(db.insert).toHaveBeenCalled();
                expect(result).toEqual({ success: true });
            });

            it('powinien zwrócić fail(400) przy braku pól', async () => {
                const event = createEvent({ nazwa: 'Niepełny' });
                const result = await actions.addTurniej(event);
                expect(result.status).toBe(400);
                expect(result.message).toBe('All fields are required');
            });
        });

        describe('deleteTurniej', () => {
            it('powinien wykonać pełną transakcję usuwania (4 kroki)', async () => {
                const event = createEvent({ turniejId: 't-999' });
                const mockTx = {
                    update: vi.fn().mockReturnThis(),
                    set: vi.fn().mockReturnThis(),
                    where: vi.fn().mockReturnThis(),
                    delete: vi.fn().mockReturnThis(),
                };

                (db.transaction as any).mockImplementation(async (cb: any) => await cb(mockTx));

                await actions.deleteTurniej(event);

                expect(db.transaction).toHaveBeenCalled();
                expect(mockTx.update).toHaveBeenCalledTimes(1); // unlinked games
                expect(mockTx.delete).toHaveBeenCalledTimes(3); // zaproszenia, uczestnicy, turniej
            });
        });

        describe('dodanieGraczDoTurnieju', () => {
            it('powinien najpierw szukać ID gracza po nazwie, a potem go dodać', async () => {
                const event = createEvent({ nazwaGracz: 'Sniper', turniejId: 't1' });
                
                // Mock 1: Znaleziono użytkownika
                (db.limit as any).mockResolvedValueOnce([{ id: 'user-sniper' }]);

                const result = await actions.dodanieGraczDoTurnieju(event);

                expect(db.select).toHaveBeenCalled();
                expect(db.insert).toHaveBeenCalled();
                expect(result.success).toBe(true);
            });

            it('powinien zwrócić błąd, jeśli gracz nie istnieje', async () => {
                const event = createEvent({ nazwaGracz: 'Duch', turniejId: 't1' });
                (db.limit as any).mockResolvedValueOnce([]); // brak wyników

                const result = await actions.dodanieGraczDoTurnieju(event);
                expect(result.status).toBe(400);
                expect(result.message).toContain('Nie znaleziono gracza');
            });
        });

        describe('addPlayers (Bulk Insert)', () => {
            it('powinien dodać wielu graczy naraz', async () => {
                const event = createEvent({
                    turniej_id: 't1',
                    gracze: ['u1', 'u2', 'u3']
                });

                const result = await actions.addPlayers(event);

                expect(db.insert).toHaveBeenCalled();
                // Sprawdzamy czy values otrzymało tablicę 3 obiektów
                expect(vi.mocked(db.values)).toHaveBeenCalledWith(
                    expect.arrayContaining([
                        expect.objectContaining({ graczID: 'u1' }),
                        expect.objectContaining({ graczID: 'u2' }),
                        expect.objectContaining({ graczID: 'u3' })
                    ])
                );
                expect(result.count).toBe(3);
            });
        });

        describe('updateRank', () => {
            it('powinien zaktualizować miejsce końcowe uczestnika', async () => {
                const event = createEvent({
                    turniejId: 't1',
                    gracz_id: 'u1',
                    miejsce_koncowe: '2'
                });

                const result = await actions.updateRank(event);
                expect(db.update).toHaveBeenCalled();
                expect(db.set).toHaveBeenCalledWith({ miejsce: 2 });
                expect(result.success).toBe(true);
            });
        });
    });
});