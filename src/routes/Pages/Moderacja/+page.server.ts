import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db'; 
import { user } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types'; 
import * as auth from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
    const sessionUser = auth.requireLogin(locals);

    try {
        const users = await db.select().from(user);
        
        return {
            users
        };
    } catch (error) {
        console.error("Błąd pobierania danych:", error);
        return { users: [] };
    }
}

export const actions: Actions = {
    // Bulk delete users by IDs
    deleteUsers: async (event) => {
        const formData = await event.request.formData();
        const userIds = formData.getAll('userIds');

        // Validate input: Musi być tablica, same stringi i NIE MOŻE być pusta
        if (!Array.isArray(userIds) || !userIds.every(id => typeof id === 'string') || userIds.length === 0) {
            return fail(400, { invalidInput: true });
        }

        // Delete users from database
        try {
            await db.delete(user).where(inArray(user.id, userIds as string[]));
        } catch (error) {
            console.error('Error deleting users:', error);
            return fail(500, { serverError: true });
        }

        return { success: true };
    },

    // Bulk delete users by emails
    deleteUsersByEmail: async (event) => {
        const formData = await event.request.formData();
        const emails = formData.getAll('emails');

        // Validate input
        if (!Array.isArray(emails) || !emails.every(email => typeof email === 'string') || emails.length === 0) {
            return fail(400, { invalidInput: true });
        }

        // Validate each email format
        for (const email of emails) {
            if (!auth.isValidEmail(email)) {
                return fail(400, { invalidEmail: true });
            }
        }

        // Delete users from database
        try {
            await db.delete(user).where(inArray(user.email, emails as string[]));
        } catch (error) {
            console.error('Error deleting users by email:', error);
            return fail(500, { serverError: true });
        }

        return { success: true };
    },

    // Bulk delete users by usernames
    deleteUsersByUsername: async (event) => {
        const formData = await event.request.formData();
        const usernames = formData.getAll('usernames');

        // Validate input
        if (!Array.isArray(usernames) || !usernames.every(username => typeof username === 'string') || usernames.length === 0) {
            return fail(400, { invalidInput: true });
        }

        // Validate each username format
        for (const username of usernames) {
            if (!auth.isValidUsername(username)) {
                return fail(400, { invalidUsername: true });
            }
        }

        // Delete users from database
        try {
            await db.delete(user).where(inArray(user.nazwa, usernames as string[]));
        } catch (error) {
            console.error('Error deleting users by username:', error);
            return fail(500, { serverError: true });
        }

        return { success: true };
    },

    // Adds single user
    addUser: async (event) => {
        const formData = await event.request.formData();
        const username = formData.get('username');
        const email = formData.get('email');
        const password = formData.get('password');
        const roleID = formData.get('role');

        // Validate input
        if (!auth.isValidUsername(username)) {
            return fail(400, { username, invalidUsername: true });
        }

        if (!auth.isValidPassword(password)) {
            return fail(400, { username, invalidPassword: true });
        }

        if (!auth.isValidEmail(email)) {
            return fail(400, { username, invalidEmail: true });
        }

        if (!auth.isValidRoleID(roleID)) {
            return fail(400, { username, invalidRoleID: true });
        }

        if (typeof username !== 'string' || typeof password !== 'string' || typeof email !== 'string' || typeof roleID !== 'string') {
            return fail(400, { username, invalidInput: true });
        }

        // Check if username already exists
        const existingUsername = await auth.doesUserExistByUsername(username);

        if (existingUsername) {
            return fail(400, { username, usernameTaken: true });
        }

        // Check if email already exists
        const existingEmail = await auth.doesUserExistByEmail(email);

        if (existingEmail) {
            return fail(400, { username, emailTaken: true });
        }

        // Check if role exists
        const roleExists = await auth.doesRoleExistById(roleID as string);

        if (!roleExists) {
            return fail(400, { username, invalidRole: true });
        }

        // Create new user
        const passwordHash: string = await auth.hashPassword(password);
        const userId: string = auth.generateUserId();

        try {
            await db.insert(user).values({
                id: userId,
                nazwa: username,
                email: email,
                passwordHash: passwordHash,
                role: roleID
            });
        }
        catch (error) {
            console.error('Error creating user:', error);
            return fail(500, { username, databaseError: true });
        }

        return { success: true };
    },

    // Change username by id
    changeUsername: async (event) => {
        const formData = await event.request.formData();
        const userId = formData.get('userId');
        const newUsername = formData.get('newUsername');

        // Validate input
        if (typeof userId !== 'string' || typeof newUsername !== 'string') {
            return fail(400, { invalidInput: true });
        }

        if (!auth.isValidUsername(newUsername)) {
            return fail(400, { invalidUsername: true });
        }

        // Check if username already exists
        const existingUsername = await auth.doesUserExistByUsername(newUsername);

        if (existingUsername) {
            return fail(400, { usernameTaken: true });
        }

        // Update username in database
        try {
            await db.update(user).set({ nazwa: newUsername }).where(eq(user.id, userId));
        } catch (error) {
            console.error('Error changing username:', error);
            return fail(500, { serverError: true });
        }

        return { success: true };
    },

    // Change email by id
    changeEmail: async (event) => {
        const formData = await event.request.formData();
        const userId = formData.get('userId');
        const newEmail = formData.get('newEmail');

        // Validate input
        if (typeof userId !== 'string' || typeof newEmail !== 'string') {
            return fail(400, { invalidInput: true });
        }

        if (!auth.isValidEmail(newEmail)) {
            return fail(400, { invalidEmail: true });
        }

        // Check if email already exists
        const existingEmail = await auth.doesUserExistByEmail(newEmail);

        if (existingEmail) {
            return fail(400, { emailTaken: true });
        }

        // Update email in database
        try {
            await db.update(user).set({ email: newEmail }).where(eq(user.id, userId));
        } catch (error) {
            console.error('Error changing email:', error);
            return fail(500, { serverError: true });
        }

        return { success: true };
    },

    // Change role by id
    changeRole: async (event) => {
        const formData = await event.request.formData();
        const userId = formData.get('userId');
        const newRoleID = formData.get('newRoleID');

        // Validate input
        if (typeof userId !== 'string' || typeof newRoleID !== 'string') {
            return fail(400, { invalidInput: true });
        }

        if (!auth.isValidRoleID(newRoleID)) {
            return fail(400, { invalidRoleID: true });
        }

        // Check if role exists
        const roleExists = await auth.doesRoleExistById(newRoleID as string);

        if (!roleExists) {
            return fail(400, { invalidRole: true });
        }

        // Update role in database
        try {
            await db.update(user).set({ role: newRoleID }).where(eq(user.id, userId));
        } catch (error) {
            console.error('Error changing role:', error);
            return fail(500, { serverError: true });
        }

        return { success: true };
    },

    // Change password by id
    changePassword: async (event) => {
        const formData = await event.request.formData();
        const userId = formData.get('userId');
        const newPassword = formData.get('newPassword');

        // Validate input
        if (typeof userId !== 'string' || typeof newPassword !== 'string') {
            return fail(400, { invalidInput: true });
        }

        if (!auth.isValidPassword(newPassword)) {
            return fail(400, { invalidPassword: true });
        }

        // Hash new password
        const newPasswordHash: string = await auth.hashPassword(newPassword);

        // Update password in database
        try {
            await db.update(user).set({ passwordHash: newPasswordHash }).where(eq(user.id, userId));
        } catch (error) {
            console.error('Error changing password:', error);
            return fail(500, { serverError: true });
        }

        return { success: true };
    }
}