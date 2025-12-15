import { db } from '$lib/server/db';
import { user, type User } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	return {
		post: await db.select({
			nazwa: user.nazwa,
			elo: user.elo
		}).from(user).orderBy(desc(user.elo))
	};
};