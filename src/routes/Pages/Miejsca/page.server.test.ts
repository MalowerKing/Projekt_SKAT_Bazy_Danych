import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';
import { db } from '$lib/server/db';

const { mockChain } = vi.hoisted(() => {
	const chain: any = {
		from: vi.fn(),
		where: vi.fn(),
		orderBy: vi.fn(),
		leftJoin: vi.fn(),
		innerJoin: vi.fn(),
		set: vi.fn(),
		values: vi.fn(),
		then: vi.fn((resolve) => resolve([])),
	};
	chain.from.mockReturnValue(chain);
	chain.where.mockReturnValue(chain);
	chain.orderBy.mockReturnValue(chain);
	chain.leftJoin.mockReturnValue(chain);
	chain.innerJoin.mockReturnValue(chain);
	chain.set.mockReturnValue(chain);
	chain.values.mockReturnValue(chain);
	return { mockChain: chain };
});

vi.mock('$lib/server/auth', () => ({
	requireLogin: vi.fn((locals) => {
		if (!locals?.user) throw { status: 302, location: '/loginrequired', isRedirect: true };
		return locals.user;
	}),
	requireAdmin: vi.fn(),
	checkRole: vi.fn()
}));

vi.mock('@sveltejs/kit', () => ({
	fail: vi.fn((status, data) => ({ status, data, type: 'failure' })),
	redirect: vi.fn((status, location) => {
		throw { status, location, isRedirect: true };
	})
}));

vi.mock('$lib/server/db', () => ({
	db: {
		insert: vi.fn(() => mockChain),
		update: vi.fn(() => mockChain),
		delete: vi.fn(() => mockChain),
		select: vi.fn(() => mockChain),
		transaction: vi.fn(async (cb) => await cb(db)),
		innerJoin: vi.fn(() => mockChain),
		leftJoin: vi.fn(() => mockChain),
		where: vi.fn(() => mockChain),
	}
}));

describe('Miejsca Page Server', () => {
	const mockUser = { id: 'user-1', username: 'admin', role: 'admin' };

	beforeEach(() => {
		vi.clearAllMocks();
		mockChain.then.mockImplementation((resolve: any) => resolve([]));
	});

	describe('load', () => {
		it('powinien pobrać listę wszystkich miejsc', async () => {
			const mockMiejsca = [{ id: 1, nazwa: 'Miejsce 1' }];
			mockChain.then.mockImplementation((resolve: any) => resolve(mockMiejsca));

			const event = { locals: { user: mockUser } };
			const result = await load(event as any);

			expect(db.select).toHaveBeenCalled();
            // POPRAWKA: load zwraca { post: ... }, a nie { miejsca: ... }
			expect(result.post).toEqual(mockMiejsca);
		});
	});

	describe('actions', () => {
		it('powinien zwrócić fail(400), gdy brakuje danych', async () => {
			const formData = new FormData();
			const event = {
				request: { formData: () => Promise.resolve(formData) },
				locals: { user: mockUser }
			};

			const result = await actions.addMiejsce(event as any);
			expect(result.status).toBe(400);
		});

		it('powinien dodać nowe miejsce przy poprawnych danych', async () => {
			const formData = new FormData();
			formData.append('nazwa', 'Nowe Miejsce');
			formData.append('adres', 'Ulica 1');
			formData.append('miasto', 'Miasto X');

			const event = {
				request: { formData: () => Promise.resolve(formData) },
				locals: { user: mockUser }
			};

			await actions.addMiejsce(event as any);
			expect(db.insert).toHaveBeenCalled();
		});

		it('powinien wykonać transakcję usuwania (update + update + delete)', async () => {
			const formData = new FormData();
			formData.append('miejsceId', '1');
			const event = { request: { formData: () => Promise.resolve(formData) } };

			await actions.deletePlace(event as any);
			expect(db.transaction).toHaveBeenCalled();
		});

		it('powinien zwrócić błąd 500, gdy transakcja się nie powiedzie', async () => {
			(db.transaction as any).mockImplementationOnce(async () => {
				throw new Error('DB Error');
			});
			const formData = new FormData();
			formData.append('miejsceId', '1');
			const event = { request: { formData: () => Promise.resolve(formData) } };

			const result = await actions.deletePlace(event as any);
			expect(result.status).toBe(500);
		});

		describe('szukajWMiejscu', () => {
			it('powinien zwrócić listę turniejów dla danego miejsca', async () => {
				const mockTurnieje = [{ id: 100, nazwa: 'Turniej A' }];
				mockChain.then.mockImplementation((resolve: any) => resolve(mockTurnieje));

				const formData = new FormData();
				formData.append('miejsce_id', '5');
				const event = { request: { formData: () => Promise.resolve(formData) } };

				const result = await actions.szukajWMiejscu(event as any);

				expect(db.select).toHaveBeenCalled();
				expect(result.success).toBe(true);
				expect(result.turnieje).toEqual(mockTurnieje);
			});
		});
	});
});