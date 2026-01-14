import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';
import { db } from '$lib/server/db';

const { mockChain } = vi.hoisted(() => {
	const chain: any = {
		from: vi.fn(),
		innerJoin: vi.fn(),
		leftJoin: vi.fn(),
		where: vi.fn(),
		orderBy: vi.fn(),
		values: vi.fn(),
		then: vi.fn((resolve) => resolve([])),
	};
	chain.from.mockReturnValue(chain);
	chain.innerJoin.mockReturnValue(chain);
	chain.leftJoin.mockReturnValue(chain);
	chain.where.mockReturnValue(chain);
	chain.orderBy.mockReturnValue(chain);
	chain.values.mockReturnValue(chain);
	return { mockChain: chain };
});

vi.mock('$lib/server/auth', () => ({
	requireLogin: vi.fn((locals) => {
		if (!locals?.user) throw { status: 302, location: '/loginrequired', isRedirect: true };
		return locals.user;
	})
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
		delete: vi.fn(() => mockChain),
		transaction: vi.fn(async (cb) => await cb(db))
	}
}));

describe('Page Server Load & Actions', () => {
	const mockUser = { id: 'user-1', username: 'TestUser' };

	beforeEach(() => {
		vi.clearAllMocks();
		mockChain.then.mockImplementation((resolve: any) => resolve([]));
	});

	describe('load()', () => {
		it('powinien przkierować do /loginrequired, gdy brak sesji', async () => {
			const event = { locals: { user: null } };
			try {
				await load(event as any);
				expect.fail('Powinien rzucić redirect');
			} catch (e: any) {
				expect(e.isRedirect).toBe(true);
			}
		});

		it('powinien pobrać wszystkie dane dla zalogowanego użytkownika', async () => {
			const event = { locals: { user: mockUser } };
			await load(event as any);
			expect(db.select).toHaveBeenCalled();
		});
	});

	describe('actions', () => {
		it('wyslijZaproszenie: powinien zwrócić sukces przy poprawnych danych', async () => {
			const formData = new FormData();
			formData.append('receiverId', 'user-2');
			const event = { 
				request: { formData: () => Promise.resolve(formData) },
				locals: { user: mockUser }
			};

			// Mockujemy, że odbiorca ISTNIEJE.
			// Pierwsze zapytanie select sprawdza usera -> zwracamy [{ id: 'user-2' }]
			mockChain.then.mockImplementationOnce((resolve: any) => resolve([{ id: 'user-2' }]));
			
			// Jeśli jest drugie zapytanie (np. sprawdzanie czy zaproszenie już istnieje),
			// to drugie wywołanie 'then' zwróci [] (brak duplikatu), bo beforeEach tak ustawia (lub domyślnie).

			const result = await actions.wyslijZaproszenie(event as any);
			
			expect(db.insert).toHaveBeenCalled();
			expect(result.success).toBe(true);
		});

		it('wyslijZaproszenie: powinien zwrócić fail(400) przy braku danych', async () => {
			const formData = new FormData(); 
			const event = { 
				request: { formData: () => Promise.resolve(formData) },
				locals: { user: mockUser }
			};

			const result = await actions.wyslijZaproszenie(event as any);
			expect(result.status).toBe(400);
		});

		it('akceptujZaproszenie: powinien wykonać transakcję (insert + delete)', async () => {
			const formData = new FormData();
			formData.append('zaproszenieId', '1');
			formData.append('senderId', 'user-99');
			const event = { 
				request: { formData: () => Promise.resolve(formData) },
				locals: { user: mockUser }
			};

			await actions.akceptujZaproszenie(event as any);
			expect(db.transaction).toHaveBeenCalled();
		});
	});
});