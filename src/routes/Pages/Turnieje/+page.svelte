<script lang="ts">
    import type { PageData, ActionData } from './$types';

    export let data: PageData;
    export let form: ActionData;
</script>

<style>
    /* Basic styling for testing visibility */
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; font-family: sans-serif; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .card { border: 1px solid #ccc; padding: 15px; border-radius: 8px; margin-bottom: 20px; background: #f9f9f9; }
    .error { color: red; background: #fee; padding: 10px; border-radius: 4px; }
    .success { color: green; background: #efe; padding: 10px; border-radius: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    label { display: block; margin-top: 10px; font-weight: bold; font-size: 0.9em; }
    input, select { width: 100%; padding: 8px; margin-top: 5px; box-sizing: border-box; }
    button { margin-top: 15px; padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer; }
    button:hover { background: #0056b3; }
    h2 { border-bottom: 2px solid #ddd; padding-bottom: 5px; }
    .note { font-size: 0.8em; color: #666; font-style: italic; }
</style>

<div class="container">
    <h1>Tournament Database Tester</h1>

    {#if form?.message}
        <div class="card {form?.missing ? 'error' : 'success'}">
            <h3>Response:</h3>
            <p>{form.message}</p>
        </div>
    {:else if form?.success}
        <div class="card success">
            <h3>Action Successful!</h3>
        </div>
    {/if}

    <div class="card">
        <h2>Current Data (From Load)</h2>
        
        <h3>Miejsca (Places)</h3>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Address</th>
                </tr>
            </thead>
            <tbody>
                {#each data.places as place}
                    <tr>
                        <td><small>{place.miejscaID}</small></td>
                        <td>{place.nazwa}</td>
                        <td>{place.adres}, {place.miasto}</td>
                    </tr>
                {/each}
            </tbody>
        </table>

        <h3>Turnieje (Tournaments)</h3>
        <p class="note">Note: Your current load function does not return 'turniejID', so you must manually copy IDs from your database to test update/delete actions below.</p>
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Time</th>
                    <th>Location</th>
                    <th>Winner</th>
                    <th>Creator</th>
                </tr>
            </thead>
            <tbody>
                {#each data.turnieje as t}
                    <tr>
                        <td>{t.nazwa}</td>
                        <td>{t.godzina}</td>
                        <td>{t.miasto} ({t.adres})</td>
                        <td>{t.zwyciezca || '-'}</td>
                        <td>{t.twórcaTurnieju || '-'}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>

    <div class="grid">
        
        <div class="card">
            <h2>Add Tournament</h2>
            <form action="?/addTurniej" method="POST">
                <label>Nazwa: <input type="text" name="nazwa" required /></label>
                
                <label>Miejsce: 
                    <select name="miejsceId" required>
                        {#each data.places as place}
                            <option value={place.miejscaID}>{place.nazwa} - {place.miasto}</option>
                        {/each}
                    </select>
                </label>
                
                <label>Data (YYYY-MM-DD): <input type="date" name="data" required /></label>
                <label>Godzina (HH:MM): <input type="time" name="godzina" required /></label>
                
                <button>Create Tournament</button>
            </form>
        </div>

        <div class="card">
            <h2>Modify Tournament</h2>
            <form action="?/modifyTurniej" method="POST">
                <label>Turniej ID (UUID): <input type="text" name="turniejId" required placeholder="Paste ID here" /></label>
                
                <label>New Name (Optional): <input type="text" name="nazwa" /></label>
                
                <label>New Place (Optional): 
                    <select name="miejsceId">
                        <option value="">-- No Change --</option>
                        {#each data.places as place}
                            <option value={place.miejscaID}>{place.nazwa}</option>
                        {/each}
                    </select>
                </label>
                
                <label>New Date: <input type="date" name="data" /></label>
                <label>New Time: <input type="time" name="godzina" /></label>
                
                <button>Update Tournament</button>
            </form>
        </div>

        <div class="card">
            <h2>Set Winner</h2>
            <form action="?/setWinner" method="POST">
                <label>Turniej ID: <input type="text" name="id_turniej" required /></label>
                <label>Winner User ID: <input type="text" name="id_zwyciezcy" required placeholder="User UUID" /></label>
                <button>Set Winner</button>
            </form>
        </div>

        <div class="card">
            <h2>Delete Tournament</h2>
            <form action="?/deleteTurniej" method="POST">
                <label>Turniej ID: <input type="text" name="turniejId" required /></label>
                <div style="margin-top:10px; color:red; font-size:0.8rem;">
                    Warning: This deletes games, invites, and participants too.
                </div>
                <button style="background-color: #dc3545;">Delete Tournament</button>
            </form>
        </div>

        <div class="card">
            <h2>Add Single Player</h2>
            <form action="?/dodanieGraczDoTurnieju" method="POST">
                <label>Turniej ID: <input type="text" name="turniejId" required /></label>
                <label>Player User ID: <input type="text" name="gracz_id" required /></label>
                <button>Add Player</button>
            </form>
        </div>

        <div class="card">
            <h2>Remove Player</h2>
            <form action="?/removePlayer" method="POST">
                <label>Turniej ID: <input type="text" name="tunriej_id" required /></label>
                <label>Player User ID: <input type="text" name="gracz_id" required /></label>
                <button>Remove Player</button>
            </form>
        </div>

        <div class="card">
            <h2>Update Player Rank</h2>
            <form action="?/updateRank" method="POST">
                <label>Turniej ID: <input type="text" name="turniejId" required /></label>
                <label>Player User ID: <input type="text" name="gracz_id" required /></label>
                <label>Rank (Position): <input type="number" name="miejsce_koncowe" required /></label>
                <button>Update Rank</button>
            </form>
        </div>

        <div class="card">
            <h2>Bulk Add Players</h2>
            <form action="?/addPlayers" method="POST">
                <label>Turniej ID: <input type="text" name="turniej_id" required /></label>
                
                <label>Player ID 1: <input type="text" name="gracze" placeholder="User UUID 1" /></label>
                <label>Player ID 2: <input type="text" name="gracze" placeholder="User UUID 2" /></label>
                <label>Player ID 3: <input type="text" name="gracze" placeholder="User UUID 3" /></label>
                
                <button>Add All Listed Players</button>
            </form>
        </div>

    </div>
</div>