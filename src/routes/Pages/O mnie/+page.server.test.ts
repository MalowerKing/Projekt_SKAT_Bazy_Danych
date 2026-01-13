import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';
import { db } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';
import { hash } from '@node-rs/argon2';

// --- MOCKI ---

vi.mock('$lib/server/db', () => ({
    db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
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

vi.mock('@node-rs/argon2', () => ({
    hash: vi.fn().mockResolvedValue('hashed_password'),
    verify: vi.fn()
}));

vi.mock('$lib/server/auth', () => ({
    invalidateSession: vi.fn(),
    deleteSessionTokenCookie: vi.fn(),
    isValidPassword: vi.fn(() => true),
    isValidEmail: vi.fn(() => true),
    isValidUsername: vi.fn(() => true),
}));

describe('Ustawienia Profilu - Page Server', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // --- TESTY LOAD ---
    describe('load', () => {
        it('powinien przekierować do /login, jeśli użytkownik nie jest zalogowany', async () => {
            const event = { locals: { user: null } };
            await expect(load(event as any)).rejects.toThrow('Redirect');
        });

        it('powinien zwrócić dane użytkownika z bazy', async () => {
            const mockUser = { id: 'u1' };
            const dbData = [{ nazwa: 'Test', email: 't@t.pl', elo: 1000, role: 'user' }];
            (db.where as any).mockResolvedValueOnce(dbData);

            const result = await load({ locals: { user: mockUser } } as any);
            expect(result.userData).toEqual(dbData[0]);
        });
    });

    // --- TESTY ACTIONS ---
    describe('actions', () => {
        const createEvent = (formDataObj: Record<string, string>, user: any = { id: 'u1' }) => ({
            locals: { user, session: { id: 's1' } },
            request: {
                formData: async () => {
                    const fd = new FormData();
                    Object.entries(formDataObj).forEach(([k, v]) => fd.append(k, v));
                    return fd;
                }
            }
        } as any);

        describe('deleteAccount', () => {
            it('powinien unieważnić sesję i usunąć użytkownika', async () => {
                const event = createEvent({});
                await expect(actions.deleteAccount(event)).rejects.toThrow('Redirect');

                expect(auth.invalidateSession).toHaveBeenCalledWith('s1');
                expect(db.delete).toHaveBeenCalled();
                expect(redirect).toHaveBeenCalledWith(302, '/');
            });
        });

        describe('changePassword', () => {
            it('powinien zwrócić błąd, gdy hasła się różnią', async () => {
                const event = createEvent({ 
                    newPassword: 'Haslo123!', 
                    confirmNewPassword: 'InneHaslo' 
                });
                const result = await actions.changePassword(event);
                expect(result).toEqual(expect.objectContaining({ message: "Hasła nie są identyczne" }));
            });

            it('powinien zaktualizować hasło w bazie po pomyślnej walidacji', async () => {
                const event = createEvent({ 
                    newPassword: 'StrongPassword123!', 
                    confirmNewPassword: 'StrongPassword123!' 
                });
                
                const result = await actions.changePassword(event);

                expect(hash).toHaveBeenCalled();
                expect(db.update).toHaveBeenCalled();
                expect(result).toEqual({ success: true, message: "Hasło zostało zmienione" });
            });
        });

        describe('changeEmail', () => {
            it('powinien zwrócić błąd, jeśli email jest już zajęty', async () => {
                const event = createEvent({ newEmail: 'zajety@test.pl' });
                // Mockujemy, że select znalazł istniejącego użytkownika
                (db.limit as any).mockResolvedValueOnce([{ id: 'u2' }]);

                const result = await actions.changeEmail(event);
                expect(result.status).toBe(400);
                expect(result.message).toBe("Ten email jest już zajęty");
            });

            it('powinien zmienić email, jeśli jest wolny', async () => {
                const event = createEvent({ newEmail: 'wolny@test.pl' });
                (db.limit as any).mockResolvedValueOnce([]); // brak użytkownika

                const result = await actions.changeEmail(event);
                expect(db.update).toHaveBeenCalled();
                expect(result.success).toBe(true);
            });
        });

        describe('changeUsername', () => {
            it('powinien zwrócić błąd przy nieprawidłowej nazwie', async () => {
                vi.mocked(auth.isValidUsername).mockReturnValueOnce(false);
                const event = createEvent({ newUsername: 'bad' });
                
                const result = await actions.changeUsername(event);
                expect(result.message).toBe("Nieprawidłowa nazwa użytkownika");
            });

            it('powinien zaktualizować nazwę użytkownika', async () => {
                (db.limit as any).mockResolvedValueOnce([]);
                const event = createEvent({ newUsername: 'NowyGracz' });

                const result = await actions.changeUsername(event);
                expect(db.set).toHaveBeenCalledWith({ nazwa: 'NowyGracz' });
                expect(result.success).toBe(true);
            });
        });
    });
});