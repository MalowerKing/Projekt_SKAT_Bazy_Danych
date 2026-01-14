import * as auth from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db'; 
import { gra, user, miejsca, turniej, role } from '$lib/server/db/schema';
import { eq, inArray, desc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import type { PageServerLoad, Actions } from './$types';
import { form } from '$app/server';
import { isValidRoleID, isValidPermissions } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
    const sessionUser = auth.requireLogin(locals);

    try {
        const roles = await db.select().from(role);
        const users = await db.select().from(user);
        
        return {
            roles,
            users
        };
    } catch (error) {
        console.error("Błąd pobierania danych:", error);
        return { roles: [], users: [] };
    }
}

export const actions: Actions = {
    // Add role
    addRole: async (event) => {
        const formData = await event.request.formData();
        const roleId = formData.get('roleId');
        const permissions = formData.get('permissions');

        // Validate input
        if (!isValidRoleID(roleId)) {
            return fail(400, { invalidRoleID: true });
        }

        if (!isValidPermissions(permissions)) {
            return fail(400, { invalidPermissions: true });
        }

        if (typeof roleId !== 'string' || typeof permissions !== 'string') {
            return fail(400, { invalidInput: true });
        }

        // Insert new role into database
        try {
            await db.insert(role).values({
                id: roleId,
                uprawnienia: permissions
            });
        } catch (error) {
            console.error('Error inserting role:', error);
            return fail(500, { serverError: true });
        }

        return { success: true };
    },

    // Delete role
    deleteRole: async (event) => {
        const formData = await event.request.formData();
        const roleId = formData.get('roleId');

        // POPRAWKA: Sprawdzenie czy string nie jest pusty
        if (!roleId || typeof roleId !== 'string') {
            return fail(400, { invalidInput: true });
        }

        // Can't remove default role
        if (roleId === '#player#') {
            return fail(400, { cannotDeleteDefaultRole: true });
        }

        // Delete role from database
        try {
            await db.delete(role).where(eq(role.id, roleId));
            await db.update(user)
                .set({ role: '#player#' })
                .where(eq(user.role, roleId));
        } catch (error) {
            console.error('Error deleting role:', error);
            return fail(500, { serverError: true });
        }

        return { success: true };
    },

    // Update permissions
    updatePermissions: async (event) => {
        const formData = await event.request.formData();
        const roleId = formData.get('roleId');
        const permissions = formData.get('permissions');

        // Validate input
        if (typeof roleId !== 'string' || typeof permissions !== 'string') {
            return fail(400, { invalidInput: true });
        }

        if (!isValidPermissions(permissions)) {
            return fail(400, { invalidPermissions: true });
        }

        // Update role in database
        try {
            await db.update(role)
                .set({ uprawnienia: permissions })
                .where(eq(role.id, roleId));
        } catch (error) {
            console.error('Error updating permissions:', error);
            return fail(500, { serverError: true });
        }

        return { success: true };
    },

    // Add a role to user
    assignRoleToUser: async (event) => {
        const formData = await event.request.formData();
        const userId = formData.get('userId');
        const roleId = formData.get('roleId');

        if (typeof userId !== 'string' || typeof roleId !== 'string') {
            return fail(400, { invalidInput: true });
        }

        // Update user's role in database
        try {
            await db.update(user)
                .set({ role: roleId })
                .where(eq(user.id, userId));
        } catch (error) {
            console.error('Error assigning role to user:', error);
            return fail(500, { serverError: true });
        }

        return { success: true };
    },

    // Remove a role from user
    removeRoleFromUser: async (event) => {
        const formData = await event.request.formData();
        const userId = formData.get('userId');

        if (typeof userId !== 'string') {
            return fail(400, { invalidInput: true });
        }

        // Reset user's role to default in database
        try {
            await db.update(user)
                .set({ role: '#player#' })
                .where(eq(user.id, userId));
        } catch (error) {
            console.error('Error removing role from user:', error);
            return fail(500, { serverError: true });
        }

        return { success: true };
    }
}