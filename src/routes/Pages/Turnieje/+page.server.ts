import { db } from "$lib/server/db";
import { miejsca, turniej, user } from "$lib/server/db/schema";
import { alias } from "drizzle-orm/mysql-core";
import type { PageServerLoad, Actions } from "../../$types";
import { eq } from "drizzle-orm";
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
            nazwa: turniej.nazwa,
            godzina: turniej.godzina,
            adres: miejsca.adres,
            miasto: miejsca.miasto,
            zwyciezca: zwyciezca.nazwa,
            twórcaTurnieju: twórcaTurnieju.nazwa
        }).from(turniej)
        .leftJoin(twórcaTurnieju, eq(turniej.tworcaID, twórcaTurnieju.id))
        .leftJoin(zwyciezca, eq(turniej.zwyciezcaID, zwyciezca.id))
        .leftJoin(miejsca, eq(turniej.miejsceID, miejsca.miejscaID)),
        places: places
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
    }
};
