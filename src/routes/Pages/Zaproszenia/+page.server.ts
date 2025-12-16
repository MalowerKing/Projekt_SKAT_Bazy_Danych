import * as auth from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { Actions, PageServerLoad } from './$types';
import { drizzle } from 'drizzle-orm/mysql2';
import { db } from '$lib/server/db';
import { eq, and, asc} from 'drizzle-orm';
import { gra, listaUczestnikowTurniej, miejsca, turniej, user, zaproszenia } from '$lib/server/db/schema';
import { alias } from 'drizzle-orm/mysql-core';
import { request } from 'http';
import { fromAction } from 'svelte/attachments';
import { randomUUID } from 'crypto';

const generateId = () => randomUUID();

export const load: PageServerLoad = async ({event}) => {
    // Przykład: Pobranie ID zalogowanego gracza (zależy od Twojej auth)
    // const currentUserId = locals.user?.id; 
    
    // Dla celów demo pobieramy ID z query params, np. ?graczId=...
    const currentUserId = event.locals.id;
    

    return {
        // • Wypisanie wszystkich zaproszeń dla gracza
        mojeZaproszenia: currentUserId ? await db
            .select({
                idZaproszenia: zaproszenia.primeID,
                idTurnieju: turniej.turniejID,
                nazwaTurnieju: turniej.nazwa,
                dataTurnieju: turniej.data,
                godzinaStartu: turniej.godzina
            })
            .from(zaproszenia)
            .innerJoin(turniej, eq(zaproszenia.turniejID, turniej.turniejID))
            .where(eq(zaproszenia.graczID, currentUserId))
            .orderBy(asc(turniej.data)) 
            : [],

        // • Wypisanie wszystkich zaproszeń na konkretny turniej
        
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
                primeID: generateId(),
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
                    primeID: generateId(),
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
    zobaczZaproszenia: async ({request}) =>{
        const formData = await request.formData();

    const viewTurniejId = formData.get('turniejId')!.toString();

    viewTurniejId ? await db
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
            .orderBy(asc(user.nazwa))
            : []

    }
} satisfies Actions;