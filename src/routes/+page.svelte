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
<label for=""></label>
<input type="text" name="gracz1" id="gracz1">
<label for=""></label>
<input type="text" name="gracz2" id="gracz2">
<label for=""></label>
<input type="text" name="gracz3" id="gracz3">
<label for=""></label>
<input type="text" name="zwycięzca" id="zwycięzca">
<label for=""></label>
<input type="checkbox" name="isRanked" id="isRanked">
<input type="text" name="miejsceNazwa" id="miejsce">
<label for=""></label>
<input type="text" name="TurniejNazwa" id="turniej">
</form>
