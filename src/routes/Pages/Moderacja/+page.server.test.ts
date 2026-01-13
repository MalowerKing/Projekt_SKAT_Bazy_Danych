import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';
import { db } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';

// --- MOCKI ---

vi.mock('$lib/server/db', () => ({
    db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
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
    isValidEmail: vi.fn(() => true),
    isValidUsername: vi.fn(() => true),
    isValidPassword: vi.fn(() => true),
    isValidRoleID: vi.fn(() => true),
    doesUserExistByUsername: vi.fn(() => false),
    doesUserExistByEmail: vi.fn(() => false),
    doesRoleExistById: vi.fn(() => true),
    hashPassword: vi.fn(() => 'hashed_pass'),
    generateUserId: vi.fn(() => 'new-uid'),
}));

describe('Admin Users Management - Page Server', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createEvent = (formDataObj: Record<string, string | string[]>, user: any = { id: 'admin' }) => ({
        locals: { user },
        request: {
            formData: async () => {
                const fd = new FormData();
                Object.entries(formDataObj).forEach(([k, v]) => {
                    if (Array.isArray(v)) {
                        v.forEach(val => fd.append(k, val));
                    } else {
                        fd.append(k, v);
                    }
                });
                return fd;
            }
        }
    } as any);

    // --- TESTY LOAD ---
    describe('load', () => {
        it('powinien pobrać wszystkich użytkowników dla zalogowanego admina', async () => {
            const mockUsers = [{ id: '1', nazwa: 'User1' }, { id: '2', nazwa: 'User2' }];
            (db.from as any).mockResolvedValueOnce(mockUsers);

            const result = await load({ locals: { user: { id: 'admin' } } } as any);
            expect(result.users).toEqual(mockUsers);
        });
    });

    // --- TESTY ACTIONS ---
    describe('actions', () => {
        
        describe('deleteUsers', () => {
            it('powinien wykonać masowe usuwanie po ID', async () => {
                const event = createEvent({ userIds: ['1', '2', '3'] });
                
                const result = await actions.deleteUsers(event);
                
                expect(db.delete).toHaveBeenCalled();
                expect(result).toEqual({ success: true });
            });

            it('powinien zwrócić fail(400) przy błędnych danych wejściowych', async () => {
                const event = {
                    request: { formData: async () => ({ getAll: () => 'nie-tablica' }) }
                } as any;
                
                const result = await actions.deleteUsers(event);
                expect(result.status).toBe(400);
            });
        });

        describe('addUser', () => {
            it('powinien pomyślnie dodać użytkownika po pełnej walidacji', async () => {
                const event = createEvent({
                    username: 'nowy_user',
                    email: 'test@test.pl',
                    password: 'Haslo123!',
                    role: 'user_role'
                });

                const result = await actions.addUser(event);

                expect(auth.hashPassword).toHaveBeenCalledWith('Haslo123!');
                expect(db.insert).toHaveBeenCalled();
                expect(result).toEqual({ success: true });
            });

            it('powinien zwrócić błąd, jeśli nazwa użytkownika jest zajęta', async () => {
                vi.mocked(auth.doesUserExistByUsername).mockResolvedValueOnce(true);
                const event = createEvent({
                    username: 'zajety',
                    email: 'ok@test.pl',
                    password: 'Pass',
                    role: 'role'
                });

                const result = await actions.addUser(event);
                expect(result.usernameTaken).toBe(true);
                expect(db.insert).not.toHaveBeenCalled();
            });

            it('powinien zwrócić błąd, jeśli rola nie istnieje', async () => {
                vi.mocked(auth.doesRoleExistById).mockResolvedValueOnce(false);
                const event = createEvent({
                    username: 'user',
                    email: 'email@test.pl',
                    password: 'Pass',
                    role: 'nieistnieje'
                });

                const result = await actions.addUser(event);
                expect(result.invalidRole).toBe(true);
            });
        });

        describe('changeUsername', () => {
            it('powinien zaktualizować nazwę, jeśli nowa nazwa jest wolna', async () => {
                const event = createEvent({ userId: 'u1', newUsername: 'NowyNick' });
                
                const result = await actions.changeUsername(event);

                expect(db.update).toHaveBeenCalled();
                expect(result.success).toBe(true);
            });

            it('powinien zablokować zmianę, jeśli nowa nazwa jest już w bazie', async () => {
                vi.mocked(auth.doesUserExistByUsername).mockResolvedValueOnce(true);
                const event = createEvent({ userId: 'u1', newUsername: 'Zajete' });

                const result = await actions.changeUsername(event);
                expect(result.usernameTaken).toBe(true);
                expect(db.update).not.toHaveBeenCalled();
            });
        });

        describe('deleteUsersByEmail', () => {
            it('powinien walidować każdy email przed usunięciem', async () => {
                vi.mocked(auth.isValidEmail).mockReturnValueOnce(true).mockReturnValueOnce(false);
                const event = createEvent({ emails: ['dobry@em.pl', 'zly-email'] });

                const result = await actions.deleteUsersByEmail(event);
                expect(result.invalidEmail).toBe(true);
                expect(db.delete).not.toHaveBeenCalled();
            });
        });
    });
});