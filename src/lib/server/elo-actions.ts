import { db } from '$lib/server/db';
import { user, turniej, gra, listaUczestnikowTurniej } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// --- Update Single Player ELO ---

export async function updatePlayerElo(playerId: string, newElo: number) {
	await db
		.update(user)
		.set({ elo: newElo })
		.where(eq(user.id, playerId));
}

// --- Mass ELO Update (Transaction) ---

export async function updateMultiplePlayerElos(updates: { playerId: string; newElo: number }[]) {
	await db.transaction(async (tx) => {
		for (const { playerId, newElo } of updates) {
			await tx
				.update(user)
				.set({ elo: newElo })
				.where(eq(user.id, playerId));
		}
	});
}

// --- Generate Tournament Bracket ---

type BracketMatch = {
	player1Id: string;
	player2Id: string;
	player3Id: string;
	placeId: string;
	matchDate: Date;
};

export async function generateTournamentBracket(tournamentId: string, matches: BracketMatch[]) {
	await db.transaction(async (tx) => {
		const newGames = matches.map((match) => ({
			graID: randomUUID(),
			turniejID: tournamentId,
			miejsceID: match.placeId,
			data: match.matchDate,
			graczID1: match.player1Id,
			graczID2: match.player2Id,
			graczID3: match.player3Id,
			zwyciezca: null,
			isRanked: false,
		}));

		if (newGames.length > 0) {
			await tx.insert(gra).values(newGames);
		}
	});
}

// --- Set Tournament Winner ---

export async function setTournamentWinner(tournamentId: string) {
	await db.transaction(async (tx) => {
		// Find the player who took 1st place in this tournament
		const winnerRecord = await tx
			.select({ playerId: listaUczestnikowTurniej.graczID })
			.from(listaUczestnikowTurniej)
			.where(
				and(
					eq(listaUczestnikowTurniej.turniejID, tournamentId),
					eq(listaUczestnikowTurniej.miejsce, 1)
				)
			)
			.limit(1)
			.then((rows) => rows[0]);

		// Update the tournament if a winner exists
		if (winnerRecord && winnerRecord.playerId) {
			await tx
				.update(turniej)
				.set({ zwyciezcaID: winnerRecord.playerId })
				.where(eq(turniej.turniejID, tournamentId));
		}
	});
}