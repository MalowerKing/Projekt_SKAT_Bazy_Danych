<script lang="ts">
  import { enhance } from '$app/forms';
    import type { PageProps } from "./$types";

  // 'form' comes from the return value of the action in +page.server.ts
    

    let {data, form}: PageProps = $props();
  
  let isLoading = false;
</script>

<form action="?/addMiejsce" method="post" use:enhance>
    <label for="nazwa">Nazwa:</label>
    <input type="text" name="nazwa" id="nazwa" value={form?.nazwa ?? ""}>
    <label for="adres">Adres</label>
    <input type="text" name="adres" id="adres" value={form?.adres ?? ""}>
    <label for="miasto">Miasto</label>
    <input type="text" name="miasto" id="miasto" value={form?.miasto ?? ""}>
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <button formaction="?/addMiejsce">Zapisz</button>
</form>

{#each data.post as {nazwa, adres, miasto}}
    <li>{nazwa} | {adres} | {miasto}</li>
{/each}