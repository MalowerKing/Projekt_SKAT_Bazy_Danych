import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db'; 
import { gra, user, miejsca, turniej } from '$lib/server/db/schema';
import { eq, inArray, desc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import type { PageServerLoad, Actions } from './$types';
import { randomUUID } from 'crypto';
import { form } from '$app/server';


export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		throw redirect(302, '/login');
	}


    const gracz1 = alias(user, 'gracz1');
    const gracz2 = alias(user, 'gracz2');
    const gracz3 = alias(user, 'gracz3');
    const wygrany = alias(user, 'wygrany');

    const rawGames = await db.select({
        graID: gra.graID,
        data: gra.data,
        isRanked: gra.isRanked,
        gracz1: { nazwa: gracz1.nazwa },
        gracz2: { nazwa: gracz2.nazwa },
        gracz3: { nazwa: gracz3.nazwa },
        wygrany: { nazwa: wygrany.nazwa },
        miejsce: { nazwa: miejsca.nazwa },
        turniej: { nazwa: turniej.nazwa },
    })
    .from(gra)
    .leftJoin(gracz1, eq(gra.graczID1, gracz1.id))
    .leftJoin(gracz2, eq(gra.graczID2, gracz2.id))
    .leftJoin(gracz3, eq(gra.graczID3, gracz3.id))
    .leftJoin(wygrany, eq(gra.zwyciezca, wygrany.id))
    .leftJoin(miejsca, eq(gra.miejsceID, miejsca.miejscaID))
    .leftJoin(turniej, eq(gra.turniejID, turniej.turniejID))
    .orderBy(desc(gra.data));

    const games = JSON.parse(JSON.stringify(rawGames));

    return {
        games,
		user: event.locals.user
    };
}

export const actions: Actions = {
    addGame: async ({request}) => {
		const formData = await request.formData();
		const gracz1 = formData.get('gracz1') as string;
		const gracz2 = formData.get('gracz2') as string;
		const gracz3 = formData.get('gracz3') as string;
		const zwyciezca = formData.get('zwyciezca') as string;
		const miejsce = formData.get('miejsceNazwa') as string;
		const data = formData.get('data') as string;
		const rozgrywka = formData.get('TurniejNazwa') as string;
		const isRanked = formData.get('isRanked') === 'on';

		if (!gracz1 || !gracz2 || !gracz3 || !zwyciezca || !miejsce || !rozgrywka) {
			return fail(400, {missing: true, message: 'Nie uzupełniono wszytskich danych formularza!'});
		}

		try {
			// Download IDs from names
			const gracz1Data = await db.select().from(user).where(eq(user.nazwa, gracz1)).limit(1);
			const gracz2Data = await db.select().from(user).where(eq(user.nazwa, gracz2)).limit(1);
			const gracz3Data = await db.select().from(user).where(eq(user.nazwa, gracz3)).limit(1);
			const zwyciezcaData = await db.select().from(user).where(eq(user.nazwa, zwyciezca)).limit(1);
			const miejsceData = await db.select().from(miejsca).where(eq(miejsca.nazwa, miejsce)).limit(1);
			const turniejData = await db.select().from(turniej).where(eq(turniej.nazwa, rozgrywka)).limit(1);

			// Add game to database
			await db.insert(gra).values({
				graID: randomUUID(),
				graczID1: gracz1Data[0].id,
				graczID2: gracz2Data[0].id,
				graczID3: gracz3Data[0].id,
				zwyciezca: zwyciezcaData[0].id,
				miejsceID: miejsceData[0].miejscaID,
				turniejID: turniejData[0].turniejID,
				isRanked: isRanked,
				data: new Date(data)
			});

			// Compute new ranks if ranked game
			if (isRanked) {
				// Download current ranks
				const gracz1Rank = gracz1Data[0].elo;
				const gracz2Rank = gracz2Data[0].elo;
				const gracz3Rank = gracz3Data[0].elo;

				if (gracz1Rank === null || gracz2Rank === null || gracz3Rank === null) {
					return fail(500, { databaseError: true, message: 'Jeden z graczy nie posiada rankingu ELO.' });
				}

				// Calculate new ranks
				const newRanks = calculateNewEloRank(
					gracz1Rank, 
					gracz2Rank, 
					gracz3Rank,
					zwyciezca === gracz1 ? 1 : (zwyciezca === gracz2 ? 2 : 3)
				);

				// Update ranks in database
				await db.update(user).set({ elo: newRanks.player1NewRank }).where(eq(user.id, gracz1Data[0].id));
				await db.update(user).set({ elo: newRanks.player2NewRank }).where(eq(user.id, gracz2Data[0].id));
				await db.update(user).set({ elo: newRanks.player3NewRank }).where(eq(user.id, gracz3Data[0].id));
			}

			
		} catch (error) {
			return fail(500, { databaseError: true, message: 'Wystąpił błąd podczas dodawania gry do bazy danych.' });
		}
	},

    delete: async ({ request }) => {
        const formData = await request.formData();
        
        const idsToDelete = formData.getAll('ids').map(id => id.toString());

        if (idsToDelete.length === 0) {
            return fail(400, { message: 'Nie zaznaczono żadnych gier do usunięcia.' });
        }

        try {
            console.log('Usuwanie gier o ID:', idsToDelete);

            await db.delete(gra)
                .where(inArray(gra.graID, idsToDelete));

            return { success: true };
        } catch (error) {
            console.error('Błąd usuwania gier:', error);
            return fail(500, { message: 'Nie udało się usunąć wybranych gier.' });
        }
    }
} satisfies Actions;

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