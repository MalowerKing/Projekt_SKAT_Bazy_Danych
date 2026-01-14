import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';
import { db } from '$lib/server/db';

const { mockChain } = vi.hoisted(() => {
	const chain: any = {
		from: vi.fn(),
		where: vi.fn(),
		leftJoin: vi.fn(),
		orderBy: vi.fn(),
		values: vi.fn(),
		then: vi.fn((resolve) => resolve([])),
	};
	chain.from.mockReturnValue(chain);
	chain.where.mockReturnValue(chain);
	chain.leftJoin.mockReturnValue(chain);
	chain.orderBy.mockReturnValue(chain);
	chain.values.mockReturnValue(chain);
	return { mockChain: chain };
});

vi.mock('$lib/server/auth', async () => {
	return {
		requireLogin: vi.fn((locals) => {
			if (!locals?.user) throw { status: 302, location: '/loginrequired', isRedirect: true };
			return locals.user;
		}),
		requireAdmin: vi.fn((user) => {
			if (user?.role !== 'admin') throw { status: 403, message: 'Forbidden' };
		}),
		checkRole: vi.fn(),
		isValidUsername: vi.fn(() => true),
		isValidPassword: vi.fn(() => true),
		isValidEmail: vi.fn(() => true),
		isValidRoleID: vi.fn(() => true) // Dodano brakujący eksport
	};
});

vi.mock('@sveltejs/kit', () => ({
	fail: vi.fn((status, data) => ({ status, data, type: 'failure' })),
	redirect: vi.fn((status, location) => {
		throw { status, location, isRedirect: true };
	})
}));

vi.mock('$lib/server/db', () => ({
	db: {
		select: vi.fn(() => mockChain),
		delete: vi.fn(() => mockChain),
		insert: vi.fn(() => mockChain),
		update: vi.fn(() => mockChain),
	},
	schema: {
		users: { id: 'users' },
		roles: { id: 'roles' }
	}
}));

describe('Admin Users Management - Page Server', () => {
	const adminUser = { id: 'admin-1', username: 'Admin', role: 'admin' };

	beforeEach(() => {
		vi.clearAllMocks();
		mockChain.then.mockImplementation((resolve: any) => resolve([]));
	});

	describe('load', () => {
		it('powinien pobrać wszystkich użytkowników dla zalogowanego admina', async () => {
			const mockUsers = [{ id: 'u1', username: 'User1' }];
			mockChain.then.mockImplementation((resolve: any) => resolve(mockUsers));

			const event = { locals: { user: adminUser } };
			const result = await load(event as any);

			expect(result.users).toEqual(mockUsers);
		});
	});

	describe('actions', () => {
		it('powinien wykonać masowe usuwanie po ID', async () => {
			const formData = new FormData();
			formData.append('ids', '["id1", "id2"]');
			const event = { request: { formData: () => Promise.resolve(formData) } };

			await actions.deleteSelected(event as any);
			expect(db.delete).toHaveBeenCalled();
		});

		it('powinien zwrócić fail(400) przy błędnych danych wejściowych', async () => {
			const formData = new FormData();
			const event = { request: { formData: () => Promise.resolve(formData) } };
			
			const result = await actions.deleteSelected(event as any);
			expect(result.status).toBe(400);
		});

		it('powinien pomyślnie dodać użytkownika po pełnej walidacji', async () => {
			const formData = new FormData();
			formData.append('username', 'NewUser');
			formData.append('email', 'test@test.com');
			formData.append('password', '123456');
			formData.append('role', 'player');
			// Dodajemy roleID, jeśli jest wymagane przez validację w kontrolerze
			formData.append('roleID', 'player'); 

			// Symulacja, że użytkownik nie istnieje (pusta tablica)
			mockChain.then.mockImplementationOnce((resolve: any) => resolve([])); 

			const event = { request: { formData: () => Promise.resolve(formData) } };
			const result = await actions.addUser(event as any);

			expect(db.insert).toHaveBeenCalled();
			expect(result.success).toBe(true);
		});
	});
});