import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';
import { db } from '$lib/server/db';
import { role, user } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';

// --- MOCKI ---

vi.mock('$lib/server/db', () => ({
    db: {
        select: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
    }
}));

vi.mock('$lib/server/auth', () => ({
    isValidRoleID: vi.fn(),
    isValidPermissions: vi.fn()
}));

// Mock redirect z SvelteKit
vi.mock('@sveltejs/kit', async () => {
    const actual = await vi.importActual('@sveltejs/kit');
    return {
        ...actual,
        redirect: vi.fn((status, location) => {
            throw { status, location }; // SvelteKit rzuca obiekt błędu przy redirect
        })
    };
});

// Pomocnik do symulowania łańcucha Drizzle (np. update().set().where())
const createChainMock = (resolvedValue: any = {}) => {
    const mock: any = {
        from: vi.fn(() => mock),
        where: vi.fn(() => mock),
        set: vi.fn(() => mock),
        values: vi.fn(() => mock),
        then: (onfulfilled: any) => Promise.resolve(resolvedValue).then(onfulfilled),
    };
    return mock;
};

describe('Role Management Server Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('load()', () => {
        it('powinien przekierować do /login, gdy brak użytkownika w sesji', async () => {
            const event = { locals: { user: null } };

            try {
                await load(event as any);
            } catch (err: any) {
                expect(redirect).toHaveBeenCalledWith(302, '/login');
                expect(err.location).toBe('/login');
            }
        });

        it('powinien zwrócić role i użytkowników dla zalogowanego admina', async () => {
            const event = { locals: { user: { id: '1' } } };
            const mockRoles = [{ id: 'admin' }];
            const mockUsers = [{ id: 'u1', nazwa: 'Jan' }];

            (db.select as any)
                .mockReturnValueOnce(createChainMock(mockRoles))
                .mockReturnValueOnce(createChainMock(mockUsers));

            const result = await load(event as any);

            expect(result).toEqual({ roles: mockRoles, users: mockUsers });
            expect(db.select).toHaveBeenCalledTimes(2);
        });
    });

    describe('actions', () => {
        const createFormRequest = (data: Record<string, string>) => ({
            request: {
                formData: async () => new Map(Object.entries(data))
            }
        } as any);

        describe('addRole', () => {
            it('powinien zwrócić fail(400) dla niepoprawnego ID roli', async () => {
                vi.mocked(auth.isValidRoleID).mockReturnValue(false);
                
                const result = await actions.addRole(createFormRequest({ roleId: '!!!', permissions: '777' }));
                
                expect(result.status).toBe(400);
                expect(result.data).toHaveProperty('invalidRoleID');
            });

            it('powinien dodać rolę, gdy walidacja przejdzie pomyślnie', async () => {
                vi.mocked(auth.isValidRoleID).mockReturnValue(true);
                vi.mocked(auth.isValidPermissions).mockReturnValue(true);
                (db.insert as any).mockReturnValue(createChainMock());

                const result = await actions.addRole(createFormRequest({ roleId: 'moderator', permissions: 'rw' }));

                expect(result).toEqual({ success: true });
                expect(db.insert).toHaveBeenCalledWith(role);
            });
        });

        describe('deleteRole', () => {
            it('nie powinien pozwolić na usunięcie roli #player#', async () => {
                const result = await actions.deleteRole(createFormRequest({ roleId: '#player#' }));
                
                expect(result.status).toBe(400);
                expect(result.data).toHaveProperty('cannotDeleteDefaultRole');
            });

            it('powinien usunąć rolę i zaktualizować użytkowników (reset do #player#)', async () => {
                const deleteMock = createChainMock();
                const updateMock = createChainMock();

                (db.delete as any).mockReturnValue(deleteMock);
                (db.update as any).mockReturnValue(updateMock);

                const result = await actions.deleteRole(createFormRequest({ roleId: 'old-role' }));

                expect(result).toEqual({ success: true });
                expect(db.delete).toHaveBeenCalledWith(role);
                expect(db.update).toHaveBeenCalledWith(user);
            });
        });

        describe('assignRoleToUser', () => {
            it('powinien poprawnie przypisać rolę użytkownikowi', async () => {
                const updateMock = createChainMock();
                (db.update as any).mockReturnValue(updateMock);

                const result = await actions.assignRoleToUser(
                    createFormRequest({ userId: 'u1', roleId: 'admin' })
                );

                expect(result).toEqual({ success: true });
                // Sprawdzamy czy update celuje w tabelę user
                expect(db.update).toHaveBeenCalledWith(user);
            });
        });
    });
});