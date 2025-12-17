<script lang="ts">
    import type { PageData, ActionData } from './$types';

    export let data: PageData;
    export let form: ActionData;
</script>

<style>
    :global(body) { font-family: sans-serif; padding: 20px; background-color: #f4f4f4; }
    .container { max-width: 1000px; margin: 0 auto; }
    
    /* Layout */
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
    .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .full-width { grid-column: span 2; }

    /* Tables */
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f8f9fa; }

    /* Forms */
    label { display: block; margin-top: 10px; font-weight: bold; font-size: 0.9em; }
    input { width: 100%; padding: 8px; margin-top: 5px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; }
    button { margin-top: 15px; padding: 10px 15px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
    button:hover { background: #0056b3; }
    button.delete { background: #dc3545; }
    button.delete:hover { background: #a71d2a; }

    /* Messages */
    .message { padding: 10px; border-radius: 4px; margin-bottom: 20px; }
    .success { background-color: #d4edda; color: #155724; }
    .error { background-color: #f8d7da; color: #721c24; }
    .warning { background-color: #fff3cd; color: #856404; font-size: 0.85em; margin-top: 5px; }
</style>

<div class="container">
    <h1>Miejsca / Places Tester</h1>

    {#if form?.message}
        <div class="message {form?.missing || form?.error ? 'error' : 'success'}">
            <strong>Response:</strong> {form.message}
        </div>
    {/if}

    {#if form?.turnieje}
        <div class="card full-width" style="margin-bottom: 20px; border: 2px solid #007bff;">
            <h2>🔎 Wyniki Wyszukiwania (Search Results)</h2>
            {#if form.turnieje.length === 0}
                <p>Brak turniejów w tym miejscu.</p>
            {:else}
                <table>
                    <thead>
                        <tr>
                            <th>Turniej</th>
                            <th>Data</th>
                            <th>Twórca</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each form.turnieje as t}
                            <tr>
                                <td>{t.nazwaTurnieju}</td>
                                <td>{t.data} {t.godzina}</td>
                                <td>{t.tworca}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            {/if}
        </div>
    {/if}

    <div class="grid">
        
        <div class="card full-width">
            <h2>🏠 Current Places (From DB)</h2>
            <div class="warning">
                Note: IDs are hidden because `load` function doesn't select `miejscaID`.
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Nazwa</th>
                        <th>Adres</th>
                        <th>Miasto</th>
                    </tr>
                </thead>
                <tbody>
                    {#each data.post as place}
                        <tr>
                            <td>{place.nazwa}</td>
                            <td>{place.adres}</td>
                            <td>{place.miasto}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>

        <div class="card">
            <h2>Add Place</h2>
            <form method="POST" action="?/addMiejsce">
                <label>Nazwa
                    <input type="text" name="nazwa" value={form?.nazwa ?? ''} required />
                </label>
                <label>Adres
                    <input type="text" name="adres" value={form?.adres ?? ''} required />
                </label>
                <label>Miasto
                    <input type="text" name="miasto" value={form?.miasto ?? ''} required />
                </label>
                <button type="submit">Dodaj Miejsce</button>
            </form>
        </div>

        <div class="card">
            <h2>Delete Place</h2>
            <form method="POST" action="?/deletePlace">
                <label>ID Miejsca (UUID)
                    <input type="text" name="miejsce_id" placeholder="Paste ID here" required />
                </label>
                <div class="warning">Warning: Validates transaction (Sets Games/Tournaments to NULL first).</div>
                <button type="submit" class="delete">Usuń Miejsce</button>
            </form>
        </div>

        <div class="card full-width">
            <h2>Search Tournaments in Place</h2>
            <form method="POST" action="?/szukajWMiejscu">
                <label>ID Miejsca (UUID)
                    <input type="text" name="miejsce_id" placeholder="Paste ID here" required />
                </label>
                <button type="submit">Szukaj Turniejów</button>
            </form>
        </div>

    </div>
</div>