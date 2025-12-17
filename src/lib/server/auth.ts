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

	const [result] = await db
		.select({
			user: table.user,
			session: table.session,
			roleData: table.role
		})
		.from(table.session)
		.innerJoin(table.user, eq(table.session.userId, table.user.id))
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

	return {
		session,
		user: {
			...user,
			permissions
		}
	};
}

// --- SESSION HELPERS ---
// Type for session validation result
export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>;

// Invalidate session by ID
export async function invalidateSession(sessionId: string) {
	await db.delete(table.session).where(eq(table.session.id, sessionId));
}

// Set session token cookie
export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date) {
	event.cookies.set(sessionCookieName, token, { expires: expiresAt, path: '/' });
}

// Delete session token cookie
export function deleteSessionTokenCookie(event: RequestEvent) {
	event.cookies.delete(sessionCookieName, { path: '/' });
}

// --- AUTHORIZATION HELPERS ---

// Check if user has specific role
export function hasRole(user: SessionValidationResult['user'], roleId: string): boolean {
	return user?.role === roleId;
}

// Check if user has specific permission
export function hasPermission(user: SessionValidationResult['user'], permission: string): boolean {
	if (!user || !user.permissions) return false;
	return user.permissions.includes(permission);
}

// Require user to have specific role
export function requireRole(locals: App.Locals, roleId: string) {
	if (!locals.user || locals.user.role !== roleId) {
		error(403, `Odmowa dostępu. Wymagana rola: ${roleId}`);
	}
}

// Require user to have specific permission
export function requirePermission(locals: App.Locals, permission: string) {
	if (!locals.user || !hasPermission(locals.user, permission)) {
		error(403, `Odmowa dostępu. Wymagane uprawnienie: ${permission}`);
	}
}

// --- VALIDATORS ---

// Username validation
export function isValidUsername(username: unknown): boolean {
	if (typeof username !== 'string') return false;
	return username.length >= 3 && username.length <= 31 && /^[a-zA-Z0-9]{3,31}$/.test(username);
}

// Password validation
export function isValidPassword(password: unknown): boolean {
	if (typeof password !== 'string') return false;
	return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && password.length <= 255;
}

// Email validation
export function isValidEmail(email: unknown): boolean {
	if (typeof email !== 'string') return false;
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

// Role ID validation
export function isValidRoleID(roleId: unknown): boolean {
	if (typeof roleId !== 'string') {
		return false;
	}
	
	const roleIdPattern = /^#[a-zA-Z0-9_]+#$/;
	return roleIdPattern.test(roleId);
}

// Json validation for permissions
export function isValidPermissions(permissions: unknown): boolean {
	if (typeof permissions !== 'string') {
		return false;
	}
	try {
		JSON.parse(permissions);
		return true;
	} catch {
		return false;
	}
}

// Generate user ID
export function generateUserId(): string {
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    return encodeBase32LowerCase(randomBytes);
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