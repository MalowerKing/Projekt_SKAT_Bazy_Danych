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

		return redirect(302, '/login');
	},

	addGame: async ({request}) => {
		const formData = await request.formData();
		const gracz1 = formData.get('gracz1') as string;
		const gracz2 = formData.get('gracz2') as string;
		const gracz3 = formData.get('gracz3') as string;
		const zwyciezca = formData.get('zwyciezca') as string;
		const miejsce = formData.get('miejsceNazwa') as string;
		const turniej = formData.get('TurniejNazwa') as string;
		const isRanked = formData.get('isRanked') === 'on';

		if (!gracz1 || !gracz2 || !gracz3 || !zwyciezca || !miejsce || !turniej) {
			return fail(400, {missing: true, message: 'Nie uzupełniono wszytskich danych formularza!'});
		}

		try {
			await db.insert(gra).values({
			});
		} catch (error) {
			
		}
	}
};

function requireLogin() {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		return redirect(302, '/login');
	}

	return locals.user;
}


// Elo ranking calculation logic
function calculateEloProbability(rankFav: number, rankOpp: number): number {
	return 1 / (1 + (10 ** ((rankOpp - rankFav) / 400)));
}

function calculateEloPoints(matchOutcome: number, winProbability: number, progressFactor: number = 40): number {
	return (progressFactor * (matchOutcome - winProbability));
}

function calculateNewEloRank(player1Rank: number, player2Rank: number, player3Rank: number, winner: 1 | 2 | 3, progressFactor: number = 40): { player1NewRank: number; player2NewRank: number; player3NewRank: number } {
	if (winner == 1) {
		let vicWith2: number = calculateEloProbability(player1Rank, player2Rank);
		let vicWith3: number = calculateEloProbability(player1Rank, player3Rank);

		let eloPoints2: number = calculateEloPoints(1, vicWith2, progressFactor);
		let eloPoints3: number = calculateEloPoints(1, vicWith3, progressFactor);

		let player1NewRank: number = player1Rank + eloPoints2 + eloPoints3;
		let player2NewRank: number = player2Rank - eloPoints2;
		let player3NewRank: number = player3Rank - eloPoints3;

		return { player1NewRank, player2NewRank, player3NewRank };
	}
	else if (winner == 2) {
		let vicWith1: number = calculateEloProbability(player2Rank, player1Rank);
		let vicWith3: number = calculateEloProbability(player2Rank, player3Rank);

		let eloPoints1: number = calculateEloPoints(1, vicWith1, progressFactor);
		let eloPoints3: number = calculateEloPoints(1, vicWith3, progressFactor);

		let player2NewRank: number = player2Rank + eloPoints1 + eloPoints3;
		let player1NewRank: number = player1Rank - eloPoints1;
		let player3NewRank: number = player3Rank - eloPoints3;

		return { player1NewRank, player2NewRank, player3NewRank };
	}
	else if (winner == 3) {
		let vicWith1: number = calculateEloProbability(player3Rank, player1Rank);
		let vicWith2: number = calculateEloProbability(player3Rank, player2Rank);

		let eloPoints1: number = calculateEloPoints(1, vicWith1, progressFactor);
		let eloPoints2: number = calculateEloPoints(1, vicWith2, progressFactor);

		let player3NewRank: number = player3Rank + eloPoints1 + eloPoints2;
		let player1NewRank: number = player1Rank - eloPoints1;
		let player2NewRank: number = player2Rank - eloPoints2;

		return { player1NewRank, player2NewRank, player3NewRank };
	}
	else {
		throw new Error("Invalid winner specified");
	}
}