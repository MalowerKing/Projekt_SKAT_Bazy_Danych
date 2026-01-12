<script lang="ts">
    import { enhance } from '$app/forms';
    import type { PageData, ActionData } from './$types';

    export let data: PageData;
    export let form: ActionData;

    let selectedTournamentId: string | null = null; 

    $: selectedPlayers = data.graczeTurnieje.filter(g => g.idTurniej === selectedTournamentId);     $: selectedTournamentName = data.turnieje.find(t => t.id === selectedTournamentId)?.nazwa; 
    function selectTournament(id: string) {
        selectedTournamentId = id; 
    }
</script>

<style>
    :root {
        --primary: #2563eb;
        --primary-hover: #1d4ed8;
        --danger: #dc2626;
        --danger-hover: #b91c1c;
        --success: #16a34a;
        --success-hover: #15803d;
        --bg: #f8fafc;
        --card-bg: #ffffff;
        --text: #1e293b;
        --border: #e2e8f0;
    }

    :global(body) { 
        font-family: 'Inter', system-ui, sans-serif; 
        background-color: var(--bg); 
        color: var(--text);
        line-height: 1.5;
        margin: 0;
        padding: 20px;
    }

    .container { max-width: 1200px; margin: 0 auto; }
    
    h1 { font-size: 2rem; margin-bottom: 1.5rem; color: #0f172a; text-align: center; }
    h2 { font-size: 1.25rem; margin-bottom: 1rem; color: #334155; }

    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; } 
    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }

    .card { 
        background: var(--card-bg); 
        padding: 24px; 
        border-radius: 12px; 
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        border: 1px solid var(--border);
        margin-bottom: 24px;
    }

    /* Tables */
    .table-container { overflow-x: auto; margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; text-align: left; } 
    th { background: #f1f5f9; padding: 12px; font-weight: 600; border-bottom: 2px solid var(--border); } 
    td { padding: 12px; border-bottom: 1px solid var(--border); } 
    
    tr.selected { background-color: #eff6ff; border-left: 4px solid var(--primary); }
    tr.interactive:hover { cursor: pointer; background-color: #f1f5f9; }

    /* Forms */
    .form-group { margin-bottom: 15px; }
    label { display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 5px; } 
    input, select { 
        width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 6px; box-sizing: border-box; 
    } 

    /* Buttons */
    .btn {
        padding: 10px 16px; border-radius: 6px; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s;
    } 
    .btn-primary { background: var(--primary); color: white; width: 100%; }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-save { background: var(--success); color: white; } 
    .btn-save:hover { background: var(--success-hover); }
    .btn-delete { background: var(--danger); color: white; } 
    .btn-delete:hover { background: var(--danger-hover); }

    /* Badges */
    .badge {
        padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 700;
        background: #e2e8f0; color: #475569;
    }
    .badge-rank { background: #fef3c7; color: #92400e; }

    .message { padding: 12px; border-radius: 6px; margin-bottom: 20px; text-align: center; }
    .success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; } 
    .error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; } 

    .flex-row { display: flex; gap: 10px; } 
</style>

<div class="container">
    <h1>Panel Zarządzania Turniejami</h1>

    {#if form?.message}
        <div class="message {form?.success ? 'success' : 'error'}">
            {form.message}
        </div>
    {/if}

    <div class="grid">
        <section class="card">
            <h2>📅 Wybierz Turniej</h2>
            <p class="note">Kliknij w wiersz turnieju, aby zobaczyć ranking graczy.</p> 
            
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Nazwa Turnieju</th>
                            <th>Data i Godzina</th>
                            <th>Lokalizacja</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each data.turnieje as t}
                            <tr 
                                on:click={() => selectTournament(t.id)} 
                                class="interactive"
                                class:selected={selectedTournamentId === t.id}
                            >
                                <td><strong>{t.nazwa}</strong></td>
                                <td>{t.data} | {t.godzina}</td> 
                                <td>{t.miasto} ({t.adres})</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </section>

        <section class="card">
            {#if selectedTournamentId}
                <h2>🏆 Ranking: {selectedTournamentName}</h2> 
                
                {#if selectedPlayers.length > 0}
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Pozycja</th>
                                    <th>Nazwa Gracza</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each selectedPlayers as gracz}
                                    <tr>
                                        <td><span class="badge badge-rank">{gracz.miejsce ?? 'Brak'}</span></td> 
                                        <td>{gracz.gracz_nazwa}</td> 
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {:else}
                    <p class="note">W tym turnieju nie ma jeszcze zapisanych żadnych graczy.</p> 
                {/if}
                <button class="btn" style="background: #e2e8f0; width: 100%; margin-top: 10px;" on:click={() => selectedTournamentId = null}>
                    Zamknij szczegóły
                </button>
            {:else}
                <div style="text-align: center; padding: 40px 0; color: #94a3b8;">
                    <p>Wybierz turniej z listy po lewej,<br>aby zobaczyć ranking.</p>
                </div>
            {/if}
        </section>
    </div>

    <div class="grid">
        <div class="card">
            <h2>➕ Nowy Turniej</h2>
            <form action="?/addTurniej" method="POST" use:enhance>
                <div class="form-group">
                    <label>Nazwa Turnieju</label>
                    <input type="text" name="nazwa" placeholder="Np. Puchar Jesieni" required />
                </div>
                <div class="form-group">
                    <label>Miejsce</label>
                    <select name="miejsceId" required> 
                        {#each data.places as place}
                            <option value={place.miejscaID}>{place.nazwa} ({place.miasto})</option>
                        {/each}
                    </select>
                </div>
                <div class="flex-row"> 
                    <div class="form-group" style="flex:1">
                        <label>Data</label>
                        <input type="date" name="data" required />
                    </div>
                    <div class="form-group" style="flex:1">
                        <label>Godzina</label>
                        <input type="time" name="godzina" required />
                    </div>
                </div>
                <button type="submit" class="btn btn-primary">Utwórz Turniej</button>
            </form>
        </div>

        <div class="card">
            <h2>👤 Dodaj Gracza do Turnieju</h2>
            <form action="?/dodanieGraczDoTurnieju" method="POST" use:enhance>
                <div class="form-group">
                    <label>Turniej</label>
                    <select name="turniejId" required>
                        {#each data.turnieje as t}
                            <option value={t.id}>{t.nazwa} ({t.data})</option> 
                        {/each}
                    </select>
                </div>
                <div class="form-group">
                    <label>Nazwa Gracza</label>
                    <input type="text" name="nazwaGracz" placeholder="Wyszukaj użytkownika..." required>
                </div>
                <button type="submit" class="btn btn-primary">Dodaj do listy</button>
            </form>
        </div>
    </div>

    <div class="card">
        <h2>🛠️ Zarządzaj Turniejami i Wynikami</h2>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Podstawowe dane</th>
                        <th>Lokalizacja</th>
                        <th>Zwycięzca</th>
                        <th>Akcje</th>
                    </tr>
                </thead>
                <tbody>
                    {#each data.turnieje as t}
                        {@const formId = `modify-${t.id}`} 
                        <tr>
                            <td>
                                <input form={formId} type="text" name="nazwa" value={t.nazwa} style="margin-bottom: 5px;" />
                                <div class="flex-row">
                                    <input form={formId} type="date" name="data" value={t.data} /> 
                                    <input form={formId} type="time" name="godzina" value={t.godzina} />
                                </div>
                            </td>
                            <td>
                                <select form={formId} name="miejsceId"> 
                                    {#each data.places as place}
                                        <option value={place.miejscaID} selected={place.miejscaID === t.miejsceID}>
                                            {place.nazwa}
                                        </option>
                                    {/each}
                                </select>
                            </td>
                            <td>
                                <form id="winner-{t.id}" method="POST" action="?/setWinner" use:enhance>
                                    <input type="hidden" name="id_turniej" value={t.id} /> 
                                    <select name="id_zwyciezcy" on:change={(e) => e.currentTarget.form?.requestSubmit()}>
                                        <option value="">-- Brak --</option> 
                                        {#each data.users as u}
                                            <option value={u.id} selected={u.id === t.zwyciezcaID}>{u.nazwa}</option> 
                                        {/each}
                                    </select>
                                </form>
                            </td>
                            <td>
                                <div class="flex-row">
                                    <form id={formId} method="POST" action="?/modifyTurniej" use:enhance>
                                        <input type="hidden" name="turniejId" value={t.id} /> 
                                        <button type="submit" class="btn btn-save">Zapisz</button>
                                    </form>
                                    <form method="POST" action="?/deleteTurniej" use:enhance>
                                        <input type="hidden" name="turniejId" value={t.id} /> 
                                        <button type="submit" class="btn btn-delete" on:click={(e) => !confirm('Usunąć turniej?') && e.preventDefault()}>
                                            Usuń
                                        </button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>

    <h2>🏆 Szczegółowe Wyniki Graczy</h2>
    {#each data.turnieje as t}
        {@const uczestnicy = data.graczeTurnieje.filter(g => g.idTurniej === t.id)}
        <div class="card">
            <h3>{t.nazwa} <small style="font-weight: normal; color: #64748b;">({t.data})</small></h3>
            
            {#if uczestnicy.length > 0}
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Gracz</th>
                                <th>Miejsce końcowe</th>
                                <th>Akcje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each uczestnicy as gracz}
                                <tr>
                                    <td><strong>{gracz.gracz_nazwa}</strong></td> 
                                    <td>
                                        <form method="POST" action="?/updateRank" use:enhance class="flex-row">
                                            <input type="hidden" name="turniejId" value={t.id} /> 
                                            <input type="hidden" name="gracz_id" value={gracz.gracz_id} /> 
                                            <input type="number" name="miejsce_koncowe" min="1" placeholder="Poz." style="width: 80px" required />  
                                            <button type="submit" class="btn btn-save" style="padding: 5px 12px;">OK</button>
                                        </form>
                                    </td>
                                    <td>
                                        <form method="POST" action="?/removePlayer" use:enhance>
                                            <input type="hidden" name="tunriej_id" value={t.id} /> 
                                            <input type="hidden" name="gracz_id" value={gracz.gracz_id} />
                                            <button type="submit" class="btn btn-delete" style="padding: 5px 12px;">Wycofaj</button>
                                        </form>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {:else}
                <p class="note">Brak przypisanych graczy.</p> 
            {/if}
        </div>
    {/each}
</div>