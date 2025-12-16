import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db'; 
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hash, verify } from '@node-rs/argon2'; 
import type { PageServerLoad, Actions } from './$types'; 
import * as auth from '$lib/server/auth';

export const load: PageServerLoad = async (event) => {
    if (!event.locals.user) {
        throw redirect(302, '/login');
    }

    const [dbUser] = await db
        .select({
            nazwa: user.nazwa,
            email: user.email,
            elo: user.elo,
            role: user.role
        })
        .from(user)
        .where(eq(user.id, event.locals.user.id));

    return {
        userData: dbUser
    };
};

export const actions: Actions = {
    // --- Usuwanie konta ---
    deleteAccount: async (event) => {
        if (!event.locals.user) return fail(401);
        const userId = event.locals.user.id;

        try {
            await auth.invalidateSession(event.locals.session?.id ?? '');
            auth.deleteSessionTokenCookie(event);
            await db.delete(user).where(eq(user.id, userId));
        } catch (e) {
            return fail(500, { message: "Błąd podczas usuwania konta" });
        }

        throw redirect(302, '/');
    },

    // --- Zmiana hasła ---
    changePassword: async (event) => {
        if (!event.locals.user) return fail(401);
        const formData = await event.request.formData();
        const newPassword = formData.get('newPassword');
        const confirmNewPassword = formData.get('confirmNewPassword');

        if (typeof newPassword !== 'string' || typeof confirmNewPassword !== 'string') {
            return fail(400, { message: "Nieprawidłowe dane" });
        }
        if (newPassword !== confirmNewPassword) {
            return fail(400, { message: "Hasła nie są identyczne" });
        }
        if (!auth.isValidPassword(newPassword)) {
            return fail(400, { message: "Hasło jest za słabe" });
        }

        try {
            const passwordHash = await hash(newPassword, {
                memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1
            });
            await db.update(user).set({ passwordHash }).where(eq(user.id, event.locals.user.id));
            return { success: true, message: "Hasło zostało zmienione" };
        } catch (error) {
            return fail(500, { message: "Błąd serwera" });
        }
    },

    // --- Zmiana emaila ---
    changeEmail: async (event) => {
        if (!event.locals.user) return fail(401);
        const formData = await event.request.formData();
        const newEmail = formData.get('newEmail');

        if (typeof newEmail !== 'string' || !auth.isValidEmail(newEmail)) {
            return fail(400, { message: "Nieprawidłowy adres email" });
        }

        const existingUser = await db.select().from(user).where(eq(user.email, newEmail)).limit(1);
        if (existingUser.length > 0) {
            return fail(400, { message: "Ten email jest już zajęty" });
        }

        try {
            await db.update(user).set({ email: newEmail }).where(eq(user.id, event.locals.user.id));
            return { success: true, message: "Email został zmieniony" };
        } catch (error) {
            return fail(500, { message: "Błąd serwera" });
        }
    },

    // --- Zmiana nazwy użytkownika ---
    changeUsername: async (event) => {
        if (!event.locals.user) return fail(401);
        const formData = await event.request.formData();
        const newUsername = formData.get('newUsername');

        if (typeof newUsername !== 'string' || !auth.isValidUsername(newUsername)) {
            return fail(400, { message: "Nieprawidłowa nazwa użytkownika" });
        }

        const existingUser = await db.select().from(user).where(eq(user.nazwa, newUsername)).limit(1);
        if (existingUser.length > 0) {
            return fail(400, { message: "Ta nazwa jest już zajęta" });
        }

        try {
            await db.update(user).set({ nazwa: newUsername }).where(eq(user.id, event.locals.user.id));
            return { success: true, message: "Nazwa została zmieniona" };
        } catch (error) {
            return fail(500, { message: "Błąd serwera" });
        }
    }
};