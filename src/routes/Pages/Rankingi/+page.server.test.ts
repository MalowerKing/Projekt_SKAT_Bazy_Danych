import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from './+page.server';
// Importujemy bazę i schemat, aby móc je zmockować i porównać
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';

// 1. Całkowite zmockowanie modułu bazy danych
vi.mock('$lib/server/db', () => ({
    db: {
        select: vi.fn()
    }
}));

describe('Load function unit test', () => {
    
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('powinien pobrać użytkowników posortowanych według elo malejąco', async () => {
        // Przygotowanie danych testowych
        const mockData = [
            { nazwa: 'Mistrz', elo: 2500 },
            { nazwa: 'Nowicjusz', elo: 1000 }
        ];

        // 2. Symulacja łańcucha metod Drizzle: .select().from().orderBy()
        // orderBy zwraca ostateczny wynik (Promise), więc to on używa mockResolvedValue
        const orderByMock = vi.fn().mockResolvedValue(mockData);
        const fromMock = vi.fn().mockReturnValue({ orderBy: orderByMock });
        (db.select as any).mockReturnValue({ from: fromMock });

        // 3. Wywołanie funkcji load
        const result = await load({ params: {} } as any);

        // 4. Asercje (Sprawdzanie wyników)
        expect(result).toEqual({ post: mockData });
        
        // Sprawdzenie czy wywołano select z odpowiednimi polami
        expect(db.select).toHaveBeenCalledWith({
            nazwa: user.nazwa,
            elo: user.elo
        });

        // Sprawdzenie czy pobrano dane z tabeli user
        expect(fromMock).toHaveBeenCalledWith(user);
    });

    it('powinien zwrócić pustą tablicę, gdy w bazie nie ma rekordów', async () => {
        const orderByMock = vi.fn().mockResolvedValue([]);
        const fromMock = vi.fn().mockReturnValue({ orderBy: orderByMock });
        (db.select as any).mockReturnValue({ from: fromMock });

        const result = await load({ params: {} } as any);

        expect(result.post).toEqual([]);
        expect(result.post).toHaveLength(0);
    });
});