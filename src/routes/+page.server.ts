import * as auth from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { Actions, PageServerLoad } from './$types';
import { drizzle } from 'drizzle-orm/mysql2';
import { db } from '$lib/server/db';
import { eq, is } from 'drizzle-orm';
import { gra, miejsca, turniej, user } from '$lib/server/db/schema';
import { alias } from 'drizzle-orm/mysql-core';
import { request } from 'http';
import { fromAction } from 'svelte/attachments';
import { randomUUID } from 'crypto';

export const load: PageServerLoad = async ({ locals }) => {
    if (locals.user) {
        redirect(302, '/Pages/Rankingi');
    } else {
        redirect(302, '/Pages/Rankingi');
	}
};

export const actions: Actions = {
    logout: async (event) => {
        if (!event.locals.session) {
            return fail(401);
        }
        
        // 1. Unieważnij sesję w bazie (używając funkcji z Twojego auth.ts)
        await auth.invalidateSession(event.locals.session.id);
        
        // 2. Usuń ciasteczko
        auth.deleteSessionTokenCookie(event);
        
        // 3. Przekieruj po wylogowaniu (np. do logowania)
        throw redirect(302, '/');
    }
};