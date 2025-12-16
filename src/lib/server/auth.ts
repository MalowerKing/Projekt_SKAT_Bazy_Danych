import type { RequestEvent } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { error } from '@sveltejs/kit';
import { encodeBase32LowerCase } from '@oslojs/encoding';
import { verify, hash } from '@node-rs/argon2';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const sessionCookieName = 'auth-session';

export function generateSessionToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(18));
	const token = encodeBase64url(bytes);
	return token;
}

export async function createSession(token: string, userId: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

	const session: table.Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + DAY_IN_MS * 30)
	};

	await db.insert(table.session).values(session);
	return session;
}

export async function validateSessionToken(token: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

	// Pobieramy sesję, użytkownika ORAZ dane roli w jednym zapytaniu
	const [result] = await db
		.select({
			user: table.user,
			session: table.session,
			roleData: table.role
		})
		.from(table.session)
		.innerJoin(table.user, eq(table.session.userId, table.user.id))
		// Left join na wypadek gdyby rola nie istniała (choć schema wymusza default), 
		// ale bezpieczniej użyć innerJoin jeśli spójność danych jest pewna.
		.innerJoin(table.role, eq(table.user.role, table.role.id))
		.where(eq(table.session.id, sessionId));

	if (!result) {
		return { session: null, user: null };
	}

	const { session, user, roleData } = result;
	const sessionExpired = Date.now() >= session.expiresAt.getTime();

	if (sessionExpired) {
		await db.delete(table.session).where(eq(table.session.id, session.id));
		return { session: null, user: null };
	}

	const renewSession = Date.now() >= session.expiresAt.getTime() - DAY_IN_MS * 15;

	if (renewSession) {
		session.expiresAt = new Date(Date.now() + DAY_IN_MS * 30);
		await db
			.update(table.session)
			.set({ expiresAt: session.expiresAt })
			.where(eq(table.session.id, session.id));
	}

	// Parsowanie uprawnień z JSON (przechowywanych w bazie jako string)
	let permissions: string[] = [];
	try {
		if (roleData && roleData.uprawnienia) {
			const parsed = JSON.parse(roleData.uprawnienia);
			if (Array.isArray(parsed)) {
				permissions = parsed;
			}
		}
	} catch (e) {
		console.error(`Błąd parsowania uprawnień dla roli ${user.role}:`, e);
		permissions = [];
	}

	// Zwracamy obiekt użytkownika rozszerzony o sparsowane uprawnienia
	return {
		session,
		user: {
			...user,
			permissions
		}
	};
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>;

export async function invalidateSession(sessionId: string) {
	await db.delete(table.session).where(eq(table.session.id, sessionId));
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date) {
	event.cookies.set(sessionCookieName, token, { expires: expiresAt, path: '/' });
}

export function deleteSessionTokenCookie(event: RequestEvent) {
	event.cookies.delete(sessionCookieName, { path: '/' });
}

// --- LOGIKA WERYFIKACJI RÓL I UPRAWNIEŃ ---

/**
 * Sprawdza, czy użytkownik posiada daną rolę (po ID, np. '#admin#').
 */
export function hasRole(user: SessionValidationResult['user'], roleId: string): boolean {
	return user?.role === roleId;
}

/**
 * Sprawdza, czy użytkownik posiada dane uprawnienie (string w tablicy JSON).
 */
export function hasPermission(user: SessionValidationResult['user'], permission: string): boolean {
	if (!user || !user.permissions) return false;
	return user.permissions.includes(permission);
}

/**
 * Blokuje żądanie (rzuca błąd 403), jeśli użytkownik nie ma wymaganej roli.
 * Do użycia w plikach +page.server.ts.
 */
export function requireRole(locals: App.Locals, roleId: string) {
	if (!locals.user || locals.user.role !== roleId) {
		error(403, `Odmowa dostępu. Wymagana rola: ${roleId}`);
	}
}

/**
 * Blokuje żądanie (rzuca błąd 403), jeśli użytkownik nie ma wymaganego uprawnienia.
 * Do użycia w plikach +page.server.ts.
 */
export function requirePermission(locals: App.Locals, permission: string) {
	if (!locals.user || !hasPermission(locals.user, permission)) {
		error(403, `Odmowa dostępu. Wymagane uprawnienie: ${permission}`);
	}
}

// --- WALIDATORY DANYCH WEJŚCIOWYCH ---

// Walidacja nazwy użytkownika
export function isValidUsername(username: unknown): boolean {
	if (typeof username !== 'string') return false;
	return username.length >= 3 && username.length <= 31 && /^[a-zA-Z0-9]{3,31}$/.test(username);
}

// Walidacja hasła
export function isValidPassword(password: unknown): boolean {
	if (typeof password !== 'string') return false;
	return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && password.length <= 255;
}

// Walidacja emaila
export function isValidEmail(email: unknown): boolean {
	if (typeof email !== 'string') return false;
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

// Walidacja ID roli (format: #[nazwa_roli]#)
export function isValidRoleID(roleId: unknown): boolean {
	if (typeof roleId !== 'string') {
		return false;
	}
	// Regex wymusza start i koniec na #, a w środku litery, cyfry lub podkreślniki
	const roleIdPattern = /^#[a-zA-Z0-9_]+#$/;
	return roleIdPattern.test(roleId);
}

// Walidacja uprawnień (musi być poprawnym JSON-em)
export function isValidPermissions(permissions: unknown): boolean {
	if (typeof permissions !== 'string') {
		return false;
	}
	try {
		const parsed = JSON.parse(permissions);
		// Dodatkowo sprawdzamy, czy to tablica (bo tak chcemy trzymać uprawnienia)
		// Jeśli chcesz pozwalać na dowolny obiekt JSON, usuń warunek Array.isArray
		return Array.isArray(parsed);
	} catch {
		return false;
	}
}

// Generate user ID
export function generateUserId(): string {
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    const uuid = encodeBase32LowerCase(randomBytes);
	// Check if user ID already exists (very unlikely, but just in case)
	if (!doesUserExistById(uuid)) {
		return uuid;
	}
	// If collision occurs, recursively generate a new ID
	return generateUserId();
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
	return await hash(password, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	return await verify(hash, password);
}

// Check if users exists by ID
export async function doesUserExistById(userId: string): Promise<boolean> {
	const users = await db.select().from(table.user).where(eq(table.user.id, userId)).limit(1);
	return users.length > 0;
}

// Check if user exists by username
export async function doesUserExistByUsername(username: string): Promise<boolean> {
	const users = await db.select().from(table.user).where(eq(table.user.nazwa, username)).limit(1);
	return users.length > 0;
}

// Check if user exists by email
export async function doesUserExistByEmail(email: string): Promise<boolean> {
	const users = await db.select().from(table.user).where(eq(table.user.email, email)).limit(1);
	return users.length > 0;
}

// Check if role exists by ID
export async function doesRoleExistById(roleId: string): Promise<boolean> {
	const roles = await db.select().from(table.role).where(eq(table.role.id, roleId)).limit(1);
	return roles.length > 0;
}