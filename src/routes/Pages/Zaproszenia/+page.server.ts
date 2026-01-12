import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { eq, and, asc, ne } from 'drizzle-orm';
import { zaproszenia, turniej, user, listaUczestnikowTurniej } from '$lib/server/db/schema';
import { encodeBase32LowerCase } from '@oslojs/encoding';


function generateUserId() {
    // ID with 120 bits of entropy, or about the same as UUID v4.
    const bytes = crypto.getRandomValues(new Uint8Array(15));
    const id = encodeBase32LowerCase(bytes);
    return id;
}

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        return { 
            mojeZaproszenia: [], 
            currentUserId: null, 
            wszyscyGracze: [], 
            wszystkieTurnieje: [] 
        };
    }

    // 1. Pobieranie moich zaproszeń
    const mojeZaproszenia = await db
        .select({
            idZaproszenia: zaproszenia.primeID,
            idTurnieju: turniej.turniejID,
            nazwaTurnieju: turniej.nazwa,
            dataTurnieju: turniej.data,
            godzinaStartu: turniej.godzina,
            miejsce: listaUczestnikowTurniej.miejsce 
        })
        .from(zaproszenia)
        .innerJoin(turniej, eq(zaproszenia.turniejID, turniej.turniejID))
        .leftJoin(listaUczestnikowTurniej, and(
            eq(listaUczestnikowTurniej.turniejID, zaproszenia.turniejID),
            eq(listaUczestnikowTurniej.graczID, locals.user.id)
        ))
        .where(eq(zaproszenia.graczID, locals.user.id))
        .orderBy(asc(turniej.data));

    // 2. Pobieranie wszystkich INNYCH graczy (do wysłania zaproszenia)
    const wszyscyGracze = await db
        .select({ id: user.id, nazwa: user.nazwa })
        .from(user)
        .where(ne(user.id, locals.user.id)) // Nie zapraszamy samych siebie
        .orderBy(asc(user.nazwa));

    // 3. Pobieranie wszystkich turniejów
    const wszystkieTurnieje = await db
        .select({ id: turniej.turniejID, nazwa: turniej.nazwa })
        .from(turniej)
        .orderBy(asc(turniej.nazwa));

    return {
        mojeZaproszenia,
        currentUserId: locals.user.id,
        wszyscyGracze,
        wszystkieTurnieje
    };
};

// --- 2. ACTIONS (Odpowiedniki INSERT / DELETE / TRANSACTION) ---
export const actions = {
    // • Wysłanie zaproszenia na turniej
    wyslijZaproszenie: async ({ request }) => {
        const formData = await request.formData();
        const graczId = formData.get('graczId') as string;
        const turniejId = formData.get('turniejId') as string;

        if (!graczId || !turniejId) {
            return fail(400, { missing: true });
        }

        try {
            await db.insert(zaproszenia).values({
                primeID: generateUserId(),
                graczID: graczId,
                turniejID: turniejId,
            });
            return { success: true, message: 'Zaproszenie wysłane' };
        } catch (error) {
            console.error(error);
            return fail(500, { message: 'Błąd bazy danych' });
        }
    },

    // • Anulowanie zaproszenia (np. przez organizatora)
    anulujZaproszenie: async ({ request }) => {
        const formData = await request.formData();
        const graczId = formData.get('graczId') as string;
        const turniejId = formData.get('turniejId') as string;

        try {
            await db.delete(zaproszenia)
                .where(
                    and(
                        eq(zaproszenia.graczID, graczId),
                        eq(zaproszenia.turniejID, turniejId)
                    )
                );
            return { success: true, message: 'Zaproszenie anulowane' };
        } catch (error) {
            return fail(500, { message: 'Nie udało się anulować zaproszenia' });
        }
    },

    // • Odrzucenie zaproszenia przez gracza
    odrzucZaproszenie: async ({ request}) => {
        const formData = await request.formData();
        const turniejId = formData.get('turniejId') as string;
        // W idealnym scenariuszu ID gracza bierzemy z sesji, dla bezpieczeństwa:
        // const graczId = locals.user.id;
        
        // Tutaj biorę z formularza zgodnie z Twoim SQL (zmienna [gracz_id_odrzucajacy])
        const graczId = formData.get('graczId') as string; 

        try {
            await db.delete(zaproszenia)
                .where(
                    and(
                        eq(zaproszenia.graczID, graczId),
                        eq(zaproszenia.turniejID, turniejId)
                    )
                );
            return { success: true, message: 'Zaproszenie odrzucone' };
        } catch (error) {
            return fail(500, { message: 'Błąd podczas odrzucania' });
        }
    },

    // • Akceptacja zaproszenia (Transakcja: Dodaj do listy -> Usuń z zaproszeń)
    akceptujZaproszenie: async ({ request }) => {
        const formData = await request.formData();
        const turniejId = formData.get('turniejId') as string;
        const graczId = formData.get('graczId') as string;

        try {
            // Używamy db.transaction dla atomowości (BEGIN ... COMMIT)
            await db.transaction(async (tx) => {
                // 1. INSERT do listy uczestników
                await tx.insert(listaUczestnikowTurniej).values({
                    primeID: generateUserId(),
                    turniejID: turniejId,
                    graczID: graczId,
                    miejsce: null // Drizzle ustawi NULL domyślnie, ale można jawnie
                });

                // 2. DELETE z zaproszeń
                await tx.delete(zaproszenia)
                    .where(
                        and(
                            eq(zaproszenia.graczID, graczId),
                            eq(zaproszenia.turniejID, turniejId)
                        )
                    );
            });

            return { success: true, message: 'Dołączono do turnieju!' };
        } catch (error) {
            console.error(error);
            return fail(500, { message: 'Błąd transakcji akceptacji' });
        }
    },
    zobaczZaproszenia: async ({ request }) => {
        const formData = await request.formData();
        const viewTurniejId = formData.get('turniejId')?.toString();

        if (!viewTurniejId) return fail(400, { message: 'Brak ID turnieju' });

        try {
            const listaZaproszonych = await db
                .select({
                    idZaproszenia: zaproszenia.primeID,
                    idGracza: user.id,
                    zaproszonyGracz: user.nazwa,
                    nazwaTurnieju: turniej.nazwa
                })
                .from(zaproszenia)
                .innerJoin(user, eq(zaproszenia.graczID, user.id))
                .innerJoin(turniej, eq(zaproszenia.turniejID, turniej.turniejID))
                .where(eq(zaproszenia.turniejID, viewTurniejId))
                .orderBy(asc(user.nazwa));

            return { success: true, list: listaZaproszonych };
        } catch (error) {
            return fail(500, { message: 'Błąd podczas pobierania listy' });
        }
    }
} satisfies Actions;