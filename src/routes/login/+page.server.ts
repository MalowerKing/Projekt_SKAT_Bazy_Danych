import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import * as auth from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from '../$types';


export const load: PageServerLoad = async (event) => {
    if (event.locals.user) {
        return redirect(302, '/');
    }
    return {};
};

export const actions: Actions = {
    // Action for user login with username or email and password
    login: async (event) => {
        const formData = await event.request.formData();
        const identifier = formData.get('identifier'); // username or email
        const password = formData.get('password');

        if (typeof identifier !== 'string' || typeof password !== 'string') {
            return fail(400, { invalidInput: true });
        }

        // Check if identifier is email
        let isEmail: boolean = false;
        if (auth.isValidEmail(identifier)) {
            isEmail = true;
        }
        else if (!auth.isValidUsername(identifier)) {
            return fail(400, { invalidInput: true });
        }

        if (!auth.isValidPassword(password)) {
            return fail(400, { invalidPassword: true });
        }

        // Fetch user from database if email is given otherwise by username
        let users: any[] = [];
        if (isEmail) {
            try {
                users = await db.select()
                    .from(table.user)
                    .where(eq(table.user.email, identifier))
                    .limit(1);

                if (users.length === 0) {
                    return fail(400, { userNotFound: true });
                }
            }
            catch (error) {
                return fail(500, { serverError: true });
            }
        }
        else {
            try {
                users = await db.select()
                    .from(table.user)
                    .where(eq(table.user.nazwa, identifier))
                    .limit(1);

                if (users.length === 0) {
                    return fail(400, { userNotFound: true });
                }
            }
            catch (error) {
                return fail(500, { serverError: true });
            }
        }
        
        const user = users[0];

        // Verify password
        const validPassword = await auth.verifyPassword(password, user.passwordHash);
        
        if (!validPassword) {
            return fail(400, { invalidCredentials: true });
        }

        // Create session and set cookie
        const sessionToken = auth.generateSessionToken();
        const session = await auth.createSession(sessionToken, user.id);
        auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);

        return redirect(302, '/');
    }
};