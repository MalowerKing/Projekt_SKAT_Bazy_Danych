import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';
import { db } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';

// --- MOCKI ---

vi.mock('$lib/server/db', () => ({
    db: {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
    }
}));

vi.mock('@sveltejs/kit', () => ({
    fail: vi.fn((status, data) => ({ status, ...data })),
    redirect: vi.fn((status, location) => {
        const err = new Error('Redirect');
        (err as any).status = status;
        (err as any).location = location;
        throw err;
    })
}));

vi.mock('$lib/server/auth', () => ({
    isValidUsername: vi.fn(() => true),
    isValidPassword: vi.fn(() => true),
    isValidEmail: vi.fn(() => true),
    doesUserExistByUsername: vi.fn(() => false),
    doesUserExistByEmail: vi.fn(() => false),
    hashPassword: vi.fn(() => 'hashed_password'),
    generateUserId: vi.fn(() => 'user_123'),
    generateSessionToken: vi.fn(() => 'token_abc'),
    createSession: vi.fn(() => ({ expiresAt: new Date() })),
    setSessionTokenCookie: vi.fn(),
}));

describe('Rejestracja - Page Server', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // --- TESTY LOAD ---
    describe('load', () => {
        it('powinien przekierować do strony głównej, jeśli użytkownik jest już zalogowany', async () => {
            const event = { locals: { user: { id: '1' } } };
            await expect(load(event as any)).rejects.toThrow('Redirect');
            expect(redirect).toHaveBeenCalledWith(302, '/');
        });

        it('powinien zwrócić pusty obiekt, jeśli użytkownik nie jest zalogowany', async () => {
            const event = { locals: { user: null } };
            const result = await load(event as any);
            expect(result).toEqual({});
        });
    });

    // --- TESTY ACTIONS ---
    describe('actions.register', () => {
        const createEvent = (data: Record<string, string>) => ({
            request: {
                formData: async () => {
                    const fd = new FormData();
                    Object.entries(data).forEach(([k, v]) => fd.append(k, v));
                    return fd;
                }
            }
        } as any);

        it('powinien zwrócić błąd, jeśli hasła nie są identyczne', async () => {
            const event = createEvent({
                username: 'user1',
                email: 'test@test.pl',
                password: 'Password123!',
                confirmPassword: 'DifferentPassword'
            });

            const result = await actions.register(event);
            expect(result.passwordsDoNotMatch).toBe(true);
            expect(fail).toHaveBeenCalledWith(400, expect.any(Object));
        });

        it('powinien zwrócić błąd, jeśli nazwa użytkownika jest zajęta', async () => {
            vi.mocked(auth.doesUserExistByUsername).mockResolvedValueOnce(true);
            const event = createEvent({
                username: 'zajety',
                email: 'test@test.pl',
                password: 'Pass',
                confirmPassword: 'Pass'
            });

            const result = await actions.register(event);
            expect(result.usernameTaken).toBe(true);
        });

        it('powinien poprawnie zarejestrować użytkownika i utworzyć sesję', async () => {
            const event = createEvent({
                username: 'nowy_user',
                email: 'nowy@test.pl',
                password: 'SafePassword123',
                confirmPassword: 'SafePassword123'
            });

            // Mockowanie udanego zapisu do bazy
            (db.values as any).mockResolvedValueOnce({});

            await expect(actions.register(event)).rejects.toThrow('Redirect');

            // Weryfikacja kroków
            expect(auth.hashPassword).toHaveBeenCalledWith('SafePassword123');
            expect(db.insert).toHaveBeenCalled();
            expect(auth.createSession).toHaveBeenCalled();
            expect(auth.setSessionTokenCookie).toHaveBeenCalled();
            expect(redirect).toHaveBeenCalledWith(302, '/');
        });

        it('powinien zwrócić fail(500), gdy baza danych rzuci błędem', async () => {
            const event = createEvent({
                username: 'user', email: 'e@e.pl', password: 'P', confirmPassword: 'P'
            });
            (db.values as any).mockRejectedValueOnce(new Error('DB Connection Lost'));

            const result = await actions.register(event);
            expect(result.databaseError).toBe(true);
            expect(result.status).toBe(500);
        });
    });
});