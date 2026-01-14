import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
    // Zwracamy obiekt użytkownika (lub null), który został ustawiony w hooks.server.ts
    return {
        user: event.locals.user
    };
};