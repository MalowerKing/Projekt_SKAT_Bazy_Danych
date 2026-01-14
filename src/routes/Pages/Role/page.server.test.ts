import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';
import { db } from '$lib/server/db';

const { mockChain } = vi.hoisted(() => {
	const chain: any = {
		from: vi.fn(),
		where: vi.fn(),
		leftJoin: vi.fn(),
		values: vi.fn(),
		then: vi.fn((resolve) => resolve([])),
	};
	chain.from.mockReturnValue(chain);
	chain.where.mockReturnValue(chain);
	chain.leftJoin.mockReturnValue(chain);
	chain.values.mockReturnValue(chain);
	return { mockChain: chain };
});

vi.mock('$lib/server/auth', () => ({
	requireLogin: vi.fn((locals) => {
		if (!locals?.user) throw { status: 302, location: '/loginrequired', isRedirect: true };
		return locals.user;
	}),
	requireAdmin: vi.fn((user) => {
		if (user?.role !== 'admin') throw { status: 403, message: 'Forbidden' };
	}),
	checkRole: vi.fn(),
	isValidRoleID: vi.fn(() => true),
	isValidPermissions: vi.fn(() => true)
}));

vi.mock('@sveltejs/kit', () => ({
	fail: vi.fn((status, data) => ({ status, data, failure: true })),
	redirect: vi.fn((status, location) => {
		throw { status, location, isRedirect: true };
	})
}));

vi.mock('$lib/server/db', () => ({
	db: {
		select: vi.fn(() => mockChain),
		insert: vi.fn(() => mockChain),
		update: vi.fn(() => mockChain),
		delete: vi.fn(() => mockChain),
		transaction: vi.fn(async (cb) => await cb(db))
	},
	schema: {
		roles: { name: 'roles' }
	}
}));

describe('Role Management Server Logic', () => {
	const adminUser = { id: 'admin', role: 'admin' };

	beforeEach(() => {
		vi.clearAllMocks();
		mockChain.then.mockImplementation((resolve: any) => resolve([]));
	});

	describe('load()', () => {
		it('powinien przekierować do /loginrequired, gdy brak użytkownika w sesji', async () => {
			const event = { locals: { user: null } };
			try {
				await load(event as any);
				expect.fail('Powinno nastąpić przekierowanie');
			} catch (e: any) {
				expect(e.isRedirect).toBe(true);
				expect(e.status).toBe(302);
			}
		});

		it('powinien zwrócić role i użytkowników dla zalogowanego admina', async () => {
			const event = { locals: { user: adminUser } };
			await load(event as any);
			expect(db.select).toHaveBeenCalled();
		});
	});

	describe('actions', () => {
		it('powinien zwrócić fail(400) dla niepoprawnego ID roli', async () => {
			const formData = new FormData();
			formData.append('id', ''); 
			const event = { request: { formData: () => Promise.resolve(formData) } };

			const result = await actions.deleteRole(event as any);
			expect(result.status).toBe(400);
		});

		it('powinien dodać rolę, gdy walidacja przejdzie pomyślnie', async () => {
			const formData = new FormData();
			// Dodajemy 'id' oraz 'roleName', 'permissions' (jeśli są sprawdzane)
			formData.append('id', 'new-role');
			formData.append('roleName', 'NowaRola');
			formData.append('permissions', '[]');
			
			const event = { request: { formData: () => Promise.resolve(formData) } };

			// Symulacja: rola o takim ID nie istnieje (pusta tablica)
			mockChain.then.mockImplementationOnce((resolve: any) => resolve([]));

			const result = await actions.addRole(event as any);
			expect(db.insert).toHaveBeenCalled();
			expect(result.success).toBe(true);
		});
		
		it('nie powinien pozwolić na usunięcie roli #player#', async () => {
			const formData = new FormData();
			formData.append('id', 'player'); 
			const event = { request: { formData: () => Promise.resolve(formData) } };

			const result = await actions.deleteRole(event as any);
			expect(result.status).toBe(400);
		});
	});
});