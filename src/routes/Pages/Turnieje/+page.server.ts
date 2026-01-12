import { db } from "$lib/server/db";
import { miejsca, turniej, user, gra, zaproszenia, listaUczestnikowTurniej } from "$lib/server/db/schema";
import { alias } from "drizzle-orm/mysql-core";
import type { PageServerLoad, Actions } from "../../$types";
import { eq, and } from "drizzle-orm";
import { request } from "http";
import { fail } from "@sveltejs/kit";
import { randomUUID } from "crypto";


const twórcaTurnieju = alias(user, "twórcaTurnieju");
const zwyciezca = alias(user, "zwycięzcaTurnieju");

let currentUser = "";

export const load: PageServerLoad = async (event) => {
    const places = await db.select().from(miejsca);
    currentUser = event.locals.session!.userId;

    return {
        turnieje: await db.select({
            id: turniej.turniejID,
            nazwa: turniej.nazwa,
            godzina: turniej.godzina,
            data: turniej.data,
            adres: miejsca.adres,
            miasto: miejsca.miasto,
            miejsceID: turniej.miejsceID,
            zwyciezca: zwyciezca.nazwa,
            twórcaTurnieju: twórcaTurnieju.nazwa,
            zwyciezcaID: turniej.zwyciezcaID
        }).from(turniej)
        .leftJoin(twórcaTurnieju, eq(turniej.tworcaID, twórcaTurnieju.id))
        .leftJoin(zwyciezca, eq(turniej.zwyciezcaID, zwyciezca.id))
        .leftJoin(miejsca, eq(turniej.miejsceID, miejsca.miejscaID)),
        places: places,
        graczeTurnieje: await db.select({
          idTurniej: listaUczestnikowTurniej.turniejID,
          gracz_id: listaUczestnikowTurniej.graczID,
          gracz_nazwa: user.nazwa,
          miejsce: listaUczestnikowTurniej.miejsce
        }).from(listaUczestnikowTurniej).leftJoin(user, eq(listaUczestnikowTurniej.graczID, user.id))
    }
}

export const actions: Actions = {
    addTurniej: async ({request}) => {
        const data = await request.formData();
        
        const nazwa = data.get('nazwa') as string;
        const miejsceId = data.get('miejsceId') as string;
        const dateStr = data.get('data') as string; // YYYY-MM-DD
        const timeStr = data.get('godzina') as string; // HH:MM

        if (!nazwa || !miejsceId || !dateStr || !timeStr) {
            return fail(400, { missing: true, message: 'All fields are required' });
        }
        
        const turniejDate = new Date(dateStr);

        // const miejscaId = await db.select({
        //     miejsceId: miejsca.miejscaID
        // }).from(miejsca).where(eq(miejsca.nazwa, miejsceName)).limit(1)

        try {
      await db.insert(turniej).values({
        turniejID: randomUUID(), // Generate ID
        nazwa: nazwa,
        miejsceID:  miejsceId,
        data: turniejDate,
        godzina: timeStr, 
        // Assuming you have the user ID in locals (from auth middleware)
        // If not, you might need a hidden input or hardcode for testing
        tworcaID: currentUser || 'demo-user-id', 
        zwyciezcaID: null // No winner yet
      });
    } catch (err) {
      console.error(err);
      return fail(500, { message: 'Database error' });
    }
        return {success: true}
    },
    modifyTurniej: async ({request}) => {
        const form = await request.formData();

        const nazwa = form.get('nazwa')?.toString();
        const miejsceId = form.get('miejsceId')?.toString();
        const data = form.get('data')?.toString() as string;
        const godzina = form.get('godzina')?.toString();

        const turniejId = form.get('turniejId')!.toString();

        const valuesToUpdate: Partial<typeof turniej.$inferInsert> = {};

        // Logic: Only add to object if value exists AND is not an empty string
        if (nazwa && nazwa.trim() !== '') {
            valuesToUpdate.nazwa = nazwa;
        }

        // For numbers, we also need to parse them
        if (miejsceId && miejsceId.trim() !== '') {
            valuesToUpdate.miejsceID = miejsceId;
        }

        if (data && data.trim() !== '') {
            valuesToUpdate.data = new Date(data); // Ensure this matches your DB date format
        }


        if (godzina && godzina.trim() !== '') {
            valuesToUpdate.godzina = godzina;
        }

        if (Object.keys(valuesToUpdate).length === 0) {
            return fail(400, { missing: true, message: "No changes provided" });
        }

        try {
        await db
            .update(turniej)
            .set(valuesToUpdate)
            .where(eq(turniej.turniejID, turniejId));
        } catch (error) {
            console.error(error);
            return fail(500, { message: "Database error" });
        }
        },

    setWinner: async ({request}) => {
        const formData = await request.formData();
        const winnerId = formData.get('id_zwyciezcy')!.toString();
        const turniejId = formData.get('id_turniej')!.toString();

        try {
         // 3. The Query
         await db
           .update(turniej)
           .set({ 
               zwyciezcaID: winnerId 
           })
           .where(eq(turniej.turniejID, turniejId));

           return { success: true };

        } catch (error) {
          console.error("Update failed:", error);
          return fail(500, { message: "Could not save winner." });
        }
    },
    deleteTurniej: async ({ request }) => {
    const formData = await request.formData();

    // 1. Parse and Validate ID
    const turniejId = formData.get('turniejId')!.toString();

    try {
      // 2. Start the Transaction
      // 'tx' is the transaction scope. You MUST use 'tx' inside, not 'db'.
      await db.transaction(async (tx) => {
        
        // Step A: Unlink Games (UPDATE Gra SET TurniejID = NULL)
        await tx
          .update(gra)
          .set({ turniejID: null })
          .where(eq(gra.turniejID, turniejId));

        // Step B: Delete Invitations (DELETE FROM Zaproszenia)
        await tx
          .delete(zaproszenia)
          .where(eq(zaproszenia.turniejID, turniejId));

        // Step C: Delete Participants (DELETE FROM `Lista Uczestników Turniejów`)
        await tx
          .delete(listaUczestnikowTurniej)
          .where(eq(listaUczestnikowTurniej.turniejID, turniejId));

        // Step D: Finally, delete the Tournament (DELETE FROM Turniej)
        await tx
          .delete(turniej)
          .where(eq(turniej.turniejID, turniejId));
      });

    } catch (error) {
      console.error("Transaction failed:", error);
      // If any step above fails, Drizzle automatically executes ROLLBACK.
      // No data will be deleted/changed.
      return fail(500, { message: "Could not delete tournament. Action rolled back." });
    }

    // 3. Redirect after success (since the current page no longer exists)
    //throw redirect(303, '/turnieje'); 
  },
  dodanieGraczDoTurnieju: async ({ request }) => {
    const formData = await request.formData();
    
    // Pobieramy dane z formularza po atrybucie 'name'
    const graczNazwa = formData.get('nazwaGracz')?.toString();
    const turniejId = formData.get('turniejId')?.toString();

    // Prosta walidacja, aby uniknąć błędu 'Cannot read properties of null'
    if (!graczNazwa || !turniejId) {
        return fail(400, { message: "Brakujące dane: nazwa gracza lub ID turnieju." });
    }

    try {
        // 1. Szukamy ID gracza w tabeli 'user' na podstawie nazwy
        const foundUser = await db.select({ id: user.id })
            .from(user)
            .where(eq(user.nazwa, graczNazwa))
            .limit(1);

        if (foundUser.length === 0) {
            return fail(400, { message: `Nie znaleziono gracza o nazwie: ${graczNazwa}` });
        }

        const graczId = foundUser[0].id;

        // 2. Wstawiamy gracza do listy uczestników turnieju
        await db.insert(listaUczestnikowTurniej).values({
            primeID: randomUUID(),
            turniejID: turniejId,
            graczID: graczId
        });

        return { success: true, message: `Dodano gracza ${graczNazwa} do turnieju.` };

    } catch (error: any) {
        console.error("Błąd dodawania uczestnika:", error);
        
        // Obsługa błędu unikalności (jeśli gracz już jest w tym turnieju)
        if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
            return fail(400, { message: "Ten gracz jest już zapisany do tego turnieju." });
        }

        return fail(500, { message: "Wystąpił błąd bazy danych." });
    }
},
removePlayer: async ({ request, params }) => {
    const formData = await request.formData();
    
    // 1. Pobranie danych
    const graczId = formData.get('gracz_id')!.toString();
    const turniejId = formData.get('tunriej_id')!.toString(); // ID turnieju z URL
    
    try {
      // 3. Wykonanie zapytania DELETE z operatorem AND
      await db
        .delete(listaUczestnikowTurniej)
        .where(
          and(
            eq(listaUczestnikowTurniej.turniejID, turniejId),
            eq(listaUczestnikowTurniej.graczID, graczId)
          )
        );

      return { success: true };

    } catch (error) {
      console.error("Błąd usuwania gracza:", error);
      return fail(500, { message: "Nie udało się usunąć gracza z turnieju." });
    }
  }, 
  updateRank: async ({ request, params }) => {
    const formData = await request.formData();
    
    // 1. Pobranie i parsowanie danych
    const turniejId = formData.get('turniejId')!.toString();
    const graczId = formData.get('gracz_id')!.toString();
    const rawMiejsce = formData.get('miejsce_koncowe')?.toString();

    const miejsce = rawMiejsce ? parseInt(rawMiejsce) : NaN;

    try {
      // 3. Wykonanie UPDATE z warunkiem AND
      await db
        .update(listaUczestnikowTurniej)
        .set({
          miejsce: miejsce // Ustawiamy nową wartość
        })
        .where(
          and(
            eq(listaUczestnikowTurniej.turniejID, turniejId),
            eq(listaUczestnikowTurniej.graczID, graczId)
          )
        );

      return { success: true };

    } catch (error) {
      console.error("Błąd aktualizacji miejsca:", error);
      return fail(500, { message: "Nie udało się zapisać miejsca." });
    }
  },
  addPlayers: async ({ request }) => {
    const formData = await request.formData();
    
    const turniejId = formData.get('turniej_id') as string;
    // getAll pobiera wszystkie wartości o tej samej nazwie (np. z checkboxów)
    const wybranigracze = formData.getAll('gracze') as string[];

    if (!turniejId) {
      return fail(400, { missing: true, message: 'Brak ID turnieju' });
    }

    if (wybranigracze.length === 0) {
      return fail(400, { missing: true, message: 'Nie wybrano żadnych graczy' });
    }

    try {
      // Przygotowanie tablicy obiektów do wstawienia
      const noweWiersze = wybranigracze.map((graczId) => ({
        primeID: crypto.randomUUID(), // Generujemy ID, bo to varchar PK
        turniejID: turniejId,
        graczID: graczId,
        miejsce: null
      }));

      // Wykonanie jednego zapytania INSERT ... VALUES (...), (...), (...)
      await db.insert(listaUczestnikowTurniej).values(noweWiersze);

      return { success: true, count: wybranigracze.length };
    } catch (error) {
      console.error('Błąd dodawania graczy:', error);
      return fail(500, { error: 'Błąd bazy danych podczas dodawania graczy.' });
    }
  }
};
