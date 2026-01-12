<script lang="ts">
    import { enhance } from '$app/forms';
    import type { ActionData, PageData } from './$types';

    export let data: PageData; 
    export let form: ActionData; 
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

    .container { max-width: 1000px; margin: 0 auto; }
    
    h1 { font-size: 2rem; margin-bottom: 1.5rem; color: #0f172a; text-align: center; }
    h2 { font-size: 1.25rem; margin-bottom: 1.2rem; color: #334155; border-bottom: 1px solid var(--border); padding-bottom: 8px; }

    /* Layout Cards */
    .card { 
        background: var(--card-bg); 
        padding: 24px; 
        border-radius: 12px; 
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        border: 1px solid var(--border);
        margin-bottom: 24px;
    }

    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }

    /* Tables */
    .table-container { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { background: #f1f5f9; padding: 12px; font-weight: 600; border-bottom: 2px solid var(--border); }
    td { padding: 12px; border-bottom: 1px solid var(--border); }

    /* Forms */
    .form-group { margin-bottom: 15px; }
    label { display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 5px; }
    select { 
        width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 6px; background: white;
    }

    /* Buttons */
    .btn {
        padding: 8px 16px; border-radius: 6px; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s;
        display: inline-flex; align-items: center; gap: 6px;
    }
    .btn-primary { background: var(--primary); color: white; width: 100%; justify-content: center; }
    .btn-accept { background: var(--success); color: white; }
    .btn-reject { background: var(--danger); color: white; }
    .btn-small { padding: 4px 10px; font-size: 0.85rem; }

    /* Alerts */
    .alert { padding: 12px; border-radius: 8px; margin-bottom: 20px; text-align: center; font-weight: 500; }
    .success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

    ul.results-list { list-style: none; padding: 0; }
    ul.results-list li { 
        display: flex; justify-content: space-between; align-items: center;
        padding: 10px; border-bottom: 1px solid var(--border);
    }
</style>

<div class="container">
    <h1>Panel Zaproszeń</h1>

    {#if form?.message}
        <div class="alert {form.success ? 'success' : 'error'}">
            {form.message} 
        </div>
    {/if}

    <section class="card">
        <h2>📥 Moje otrzymane zaproszenia</h2>
        {#if data.mojeZaproszenia && data.mojeZaproszenia.length > 0}
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Turniej</th>
                            <th>Data i Godzina</th>
                            <th style="text-align: right;">Akcje</th> 
                        </tr>
                    </thead>
                    <tbody>
                        {#each data.mojeZaproszenia as zaproszenie}
                            <tr> 
                                <td><strong>{zaproszenie.nazwaTurnieju}</strong></td>
                                <td>{zaproszenie.dataTurnieju} o {zaproszenie.godzinaStartu}</td>
                                <td style="text-align: right;">
                                    <div style="display: flex; gap: 8px; justify-content: flex-end;">
                                        <form method="POST" action="?/akceptujZaproszenie" use:enhance> 
                                            <input type="hidden" name="turniejId" value={zaproszenie.idTurnieju} /> 
                                            <input type="hidden" name="graczId" value={data.currentUserId} /> 
                                            <button type="submit" class="btn btn-accept">Akceptuj</button> 
                                        </form>
                                        
                                        <form method="POST" action="?/odrzucZaproszenie" use:enhance> 
                                            <input type="hidden" name="turniejId" value={zaproszenie.idTurnieju} /> 
                                            <input type="hidden" name="graczId" value={data.currentUserId} /> 
                                            <button type="submit" class="btn btn-reject">Odrzuć</button> 
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {:else}
            <p style="color: #64748b; text-align: center; padding: 20px;">Nie masz obecnie żadnych zaproszeń.</p> 
        {/if}
    </section>

    <div class="grid">
        <section class="card">
            <h2>✉️ Wyślij nowe zaproszenie</h2>
            <form method="POST" action="?/wyslijZaproszenie" use:enhance>
                <div class="form-group">
                    <label for="gracz">Wybierz Gracza:</label>
                    <select id="gracz" name="graczId" required> 
                        <option value="" disabled selected>-- Wybierz gracza --</option> 
                        {#each data.wszyscyGracze as g}
                            <option value={g.id}>{g.nazwa}</option> 
                        {/each}
                    </select>
                </div>

                <div class="form-group">
                    <label for="turniej">Wybierz Turniej:</label>
                    <select id="turniej" name="turniejId" required> 
                        <option value="" disabled selected>-- Wybierz turniej --</option> 
                        {#each data.wszystkieTurnieje as t}
                            <option value={t.id}>{t.nazwa}</option> 
                        {/each}
                    </select>
                </div>
                
                <button type="submit" class="btn btn-primary">Wyślij zaproszenie</button> 
            </form>
        </section>

        <section class="card">
            <h2>🔍 Sprawdź zaproszenia</h2>
            <form method="POST" action="?/zobaczZaproszenia" use:enhance> 
                <div class="form-group">
                    <label for="check-turniej">Wybierz Turniej z listy:</label>
                    <select id="check-turniej" name="turniejId" required> 
                        <option value="" disabled selected>-- Wybierz turniej --</option> 
                        {#each data.wszystkieTurnieje as t}
                            <option value={t.id}>{t.nazwa}</option> 
                        {/each}
                    </select>
                </div>
                <button type="submit" class="btn btn-primary" style="background: #64748b;">Pokaż listę zaproszonych</button> 
            </form>

            {#if form?.list}
                <div style="margin-top: 20px;">
                    <h3>Zaproszeni na turniej:</h3>
                    <ul class="results-list">
                        {#each form.list as z}
                            <li>
                                <span><strong>{z.zaproszonyGracz}</strong></span> 
                                <form method="POST" action="?/anulujZaproszenie" use:enhance> 
                                    <input type="hidden" name="graczId" value={z.idGracza} /> 
                                    <input type="hidden" name="turniejId" value={z.idZaproszenia} /> 
                                    <button type="submit" class="btn btn-reject btn-small">Anuluj</button> 
                                </form>
                            </li>
                        {/each}
                    </ul>
                </div>
            {/if}
        </section>
    </div>
</div>