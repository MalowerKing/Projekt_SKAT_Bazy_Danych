<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();
</script>

<h1>Hi, {data.user.username}!</h1>
<form method="post" action="?/logout" use:enhance>
	<button>Sign out</button>
</form>
<h1>Dodaj nową grę</h1>
<form method="post" action="?/addGame" use:enhance>
<label for="gracz1">Gracz 1</label>
<input type="text" name="gracz1" id="gracz1">
<label for="gracz2">Gracz 2</label>
<input type="text" name="gracz2" id="gracz2">
<label for="gracz3">Gracz 3</label>
<input type="text" name="gracz3" id="gracz3">
<label for="zwyciezca">Zwycięzca</label>
<input type="text" name="zwyciezca" id="zwyciezca">
<label for="isRanked">Czy rankingowa?</label>
<input type="checkbox" name="isRanked" id="isRanked">
<input type="text" name="miejsceNazwa" id="miejsce">
<label for="TurniejNazwa">Turniej</label>
<input type="text" name="TurniejNazwa" id="turniej">
<button>Dodaj grę</button>
</form>
