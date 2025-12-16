import { fail, type Actions } from '@sveltejs/kit';
import { db } from '$lib/server/db'; 
import { miejsca, gra, user } from '$lib/server/db/schema';
import { encodeBase32LowerCase } from '@oslojs/encoding';
import type { PageServerLoad } from '../../$types';
import { request } from 'http';

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