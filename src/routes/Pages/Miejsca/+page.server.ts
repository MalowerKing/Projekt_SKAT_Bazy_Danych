import { fail, type Actions } from '@sveltejs/kit';
import { db } from '$lib/server/db'; 
import { miejsca, gra, user, turniej } from '$lib/server/db/schema';
import { encodeBase32LowerCase } from '@oslojs/encoding';
import type { PageServerLoad } from '../../$types';
import { request } from 'http';
import { eq, desc } from 'drizzle-orm';

export const actions: Actions = {
  // The 'default' action handles the form submission
  addMiejsce: async ({ request }) => {
    // 1. Get Form Data
    const formData = await request.formData();
    const nazwa = formData.get('nazwa');
    const adres = formData.get('adres');
    const miasto = formData.get('miasto');

    const miejsceId = generateUserId();

    // 2. Simple Validation
    if (!nazwa || !adres || !miasto) {
      // Return data back to form so user doesn't lose input
      return fail(400, { 
        nazwa, 
        adres, 
        miasto,
        missing: true,
        message: 'Wszystkie pola są wymagane'
      });
    }

    // 3. (Optional) Database Insert Example
    await db.insert(miejsca).values({ miejscaID: miejsceId.toString(), nazwa: nazwa.toString(), adres: adres.toString(), miasto: miasto.toString() });

    console.log('Form received:', { miejsceId, nazwa, adres, miasto });

    // 4. Return Success
    return { success: true, message: 'Form submitted successfully!' };
  },
  deletePlace: async ({ request }) => {
    const formData = await request.formData();
    const miejsceId = formData.get('miejsce_id')!.toString();


    try {
      // 2. Rozpoczęcie Transakcji
      await db.transaction(async (tx) => {
        
        // KROK A: UPDATE Gra SET MiejsceID = NULL
        // Używamy 'tx', a nie 'db', aby być wewnątrz transakcji
        await tx
          .update(gra)
          .set({ miejsceID: null })
          .where(eq(gra.miejsceID, miejsceId));

        // KROK B: UPDATE Turniej SET MiejsceID = NULL
        await tx
          .update(turniej)
          .set({ miejsceID: null })
          .where(eq(turniej.miejsceID, miejsceId));

        // KROK C: DELETE FROM Miejsca
        await tx
          .delete(miejsca)
          .where(eq(miejsca.miejscaID, miejsceId));
      });

    } catch (error) {
      console.error("Błąd transakcji usuwania miejsca:", error);
      return fail(500, { message: "Nie udało się usunąć miejsca. Zmiany cofnięte." });
    }
  },
  szukajWMiejscu: async ({ request }) => {
    const data = await request.formData();
    const miejsceId = data.get('miejsce_id')!.toString();

    try {
      const turnieje = await db
        .select({
          idTurnieju: turniej.turniejID,
          nazwaTurnieju: turniej.nazwa,
          data: turniej.data,
          godzina: turniej.godzina,
          tworca: user.nazwa,
          miejsce: miejsca.nazwa
        })
        .from(turniej)
        .leftJoin(user, eq(turniej.tworcaID, user.id))
        .innerJoin(miejsca, eq(turniej.miejsceID, miejsca.miejscaID))
        .where(eq(turniej.miejsceID, miejsceId))
        .orderBy(desc(turniej.data), desc(turniej.godzina));

      return { success: true, turnieje };
    } catch (error) {
      console.error(error);
      return fail(500, { error: 'Błąd bazy danych' });
    }
  }
};

export const load: PageServerLoad = async ({ params }) => {
    return {
            post: await db.select({
                nazwa: miejsca.nazwa,
                adres: miejsca.adres,
                miasto: miejsca.miasto
            }).from(miejsca)
        };
};

function generateUserId() {
    // ID with 120 bits of entropy, or about the same as UUID v4.
    const bytes = crypto.getRandomValues(new Uint8Array(15));
    const id = encodeBase32LowerCase(bytes);
    return id;
}