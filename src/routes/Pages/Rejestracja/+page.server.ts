import { hash, verify } from '@node-rs/argon2';
import { encodeBase32LowerCase } from '@oslojs/encoding';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';
import * as auth from '$lib/server/auth';

export const load: PageServerLoad = async (event) => {
    if (event.locals.user) {
        return redirect(302, '/');
    }
    return {};
};

export const actions: Actions = {
    register: async (event) => {
        const formData = await event.request.formData();
        const username = formData.get('username');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');

        // Validate input
        if (!isValidUsername(username)) {
            return fail(400, { username, invalidUsername: true });
        }

        if (!isValidPassword(password)) {
            return fail(400, { username, invalidPassword: true });
        }

        if (!isValidEmail(email)) {
            return fail(400, { username, invalidEmail: true });
        }

        if (password !== confirmPassword) {
            return fail(400, { username, passwordsDoNotMatch: true });
        }

        if (typeof username !== 'string' || typeof password !== 'string' || typeof email !== 'string') {
            return fail(400, { username, invalidInput: true });
        }

        // Check if username already exists
        const existingUser = await db.select()
            .from(table.user)
            .where(eq(table.user.nazwa, username))
            .limit(1);

        if (existingUser.length > 0) {
            return fail(400, { username, usernameTaken: true });
        }

        // Create new user
        const passwordHash: string = await hash(password);
        const userId: string = generateUserId();

        try {
            await db.insert(table.user).values({
                id: userId,
                nazwa: username,
                email: email,
                passwordHash: passwordHash
            });
        }
        catch (error) {
            console.error('Error creating user:', error);
            return fail(500, { username, databaseError: true });
        }

        // Create session
        const sessionToken = auth.generateSessionToken();
        const session = await auth.createSession(sessionToken, userId);
        auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);

        // Redirect to home page
        throw redirect(302, '/');
    }
};

// Function to validate username format
function isValidUsername(username: unknown): boolean {
    return typeof username === 'string' &&
    username.length >= 3 &&
    username.length <= 31 &&
    /^[a-zA-Z0-9]{3,31}$/.test(username);
}

// Function to check password requirements
function isValidPassword(password: unknown): boolean {
    return typeof password === 'string' && password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && password.length <= 255;
}

// Generate user ID
function generateUserId(): string {
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    return encodeBase32LowerCase(randomBytes);
}

// Validate email format
function isValidEmail(email: unknown): boolean {
    if (typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}