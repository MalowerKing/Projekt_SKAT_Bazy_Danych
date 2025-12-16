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

const gracz = user;

export const load: PageServerLoad = async () => {
	const user = requireLogin();

	const gracz1 = alias(gracz, "gracz1");
    const gracz2 = alias(gracz, "gracz2");
	const gracz3 = alias(gracz, "gracz3");

	const zwyciezca = alias(gracz, "zwyciezca");

	return { user, gra: await db.select({
		gracz1: gracz1.nazwa,
		gracz2: gracz2.nazwa,
		gracz3: gracz3.nazwa,

		zwyciezca: zwyciezca.nazwa,

		miejsce: miejsca.nazwa,

		turniej: turniej.nazwa,

		data: gra.data,
		isRanked: gra.isRanked
	}).from(gra)
	.leftJoin(gracz1, eq(gra.graczID1, gracz1.id))
	.leftJoin(gracz2, eq(gra.graczID2, gracz2.id))
	.leftJoin(gracz3, eq(gra.graczID3, gracz3.id))
	.leftJoin(zwyciezca, eq(gra.zwyciezca, zwyciezca.id))
	.leftJoin(miejsca, eq(gra.miejsceID, miejsca.miejscaID))
	.leftJoin(turniej, eq(gra.turniejID, turniej.turniejID))
};
};

export const actions: Actions = {
	logout: async (event) => {
		if (!event.locals.session) {
			return fail(401);
		}
		await auth.invalidateSession(event.locals.session.id);
		auth.deleteSessionTokenCookie(event);

		return redirect(302, '/logout');
	}
};

function requireLogin() {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		return redirect(302, '/login');
	}

	return locals.user;
}
