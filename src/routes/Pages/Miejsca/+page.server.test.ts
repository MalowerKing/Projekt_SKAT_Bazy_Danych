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
        orderBy: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        transaction: vi.fn()
    }
}));

vi.mock('@sveltejs/kit', () => ({
    fail: vi.fn((status, data) => ({ status, ...data }))
}));

// Mockowanie globalnego crypto dla funkcji generateUserId
if (!global.crypto) {
    // @ts-ignore
    global.crypto = { getRandomValues: (arr: Uint8Array) => arr.fill(0) };
}

describe('Miejsca Page Server', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // Pomocnicza funkcja do tworzenia FormData
    const createEvent = (data: Record<string, string>) => {
        const fd = new FormData();
        Object.entries(data).forEach(([k, v]) => fd.append(k, v));
        return { request: { formData: async () => fd } } as any;
    };

    describe('load', () => {
        it('powinien pobrać listę wszystkich miejsc', async () => {
            const mockPlaces = [{ id: '1', nazwa: 'Klub A', adres: 'ul. Testowa 1', miasto: 'Wrocław' }];
            (db.from as any).mockResolvedValueOnce(mockPlaces);

            const result = await load({ params: {} } as any);
            
            expect(db.select).toHaveBeenCalled();
            expect(result.post).toEqual(mockPlaces);
        });
    });

    describe('actions', () => {
        
        describe('addMiejsce', () => {
            it('powinien zwrócić fail(400), gdy brakuje danych', async () => {
                const event = createEvent({ nazwa: 'Tylko Nazwa' }); // brakuje adresu i miasta
                const result = await actions.addMiejsce(event);

                expect(fail).toHaveBeenCalledWith(400, expect.objectContaining({ missing: true }));
                expect(result.message).toBe('Wszystkie pola są wymagane');
            });

            it('powinien dodać nowe miejsce przy poprawnych danych', async () => {
                const event = createEvent({ 
                    nazwa: 'Nowe Miejsce', 
                    adres: 'Polna 5', 
                    miasto: 'Poznań' 
                });
                (db.values as any).mockResolvedValueOnce({});

                const result = await actions.addMiejsce(event);
                
                expect(db.insert).toHaveBeenCalled();
                expect(result.success).toBe(true);
            });
        });

        describe('deletePlace', () => {
            it('powinien wykonać transakcję usuwania (update + update + delete)', async () => {
                const event = createEvent({ miejsceId: 'm-123' });
                
                // Mockujemy obiekt transakcji 'tx'
                const mockTx = {
                    update: vi.fn().mockReturnThis(),
                    set: vi.fn().mockReturnThis(),
                    where: vi.fn().mockReturnThis(),
                    delete: vi.fn().mockReturnThis()
                };

                // Symulujemy wykonanie callbacku transakcji
                (db.transaction as any).mockImplementation(async (cb: any) => {
                    await cb(mockTx);
                });

                await actions.deletePlace(event);

                expect(db.transaction).toHaveBeenCalled();
                expect(mockTx.update).toHaveBeenCalledTimes(2); // raz dla gra, raz dla turniej
                expect(mockTx.delete).toHaveBeenCalledTimes(1); // raz dla miejsca
            });

            it('powinien zwrócić błąd 500, gdy transakcja się nie powiedzie', async () => {
                const event = createEvent({ miejsceId: 'm-123' });
                (db.transaction as any).mockRejectedValueOnce(new Error('DB Error'));

                const result = await actions.deletePlace(event);
                
                expect(fail).toHaveBeenCalledWith(500, expect.any(Object));
                expect(result.message).toContain("Nie udało się usunąć miejsca");
            });
        });

        describe('szukajWMiejscu', () => {
            it('powinien zwrócić listę turniejów dla danego miejsca', async () => {
                const event = createEvent({ miejsce_id: 'm-1' });
                const mockTurnieje = [{ idTurnieju: 't1', nazwaTurnieju: 'Turniej X' }];
                
                (db.orderBy as any).mockResolvedValueOnce(mockTurnieje);

                const result = await actions.szukajWMiejscu(event);

                expect(db.innerJoin).toHaveBeenCalled(); // sprawdzenie czy dołączył tabelę miejsca
                expect(result.success).toBe(true);
                expect(result.turnieje).toEqual(mockTurnieje);
            });
        });
    });
});