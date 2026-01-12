<script lang="ts">
    import { enhance } from '$app/forms';
    import type { PageData, ActionData } from './$types';

    export let data: PageData;
    export let form: ActionData;
</script>

<style>
    /* Zmienne dla spójności */
    :root {
        --primary: #2563eb;
        --primary-hover: #1d4ed8;
        --danger: #dc2626;
        --danger-hover: #b91c1c;
        --success: #16a34a;
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

    .container { max-width: 1100px; margin: 0 auto; }
    
    h1 { font-size: 2rem; margin-bottom: 1.5rem; color: #0f172a; }
    h2 { font-size: 1.25rem; margin-bottom: 1rem; }

    /* Layout */
    .grid { 
        display: grid; 
        grid-template-columns: 1fr 350px; 
        gap: 24px; 
        align-items: start; 
    }

    @media (max-width: 768px) {
        .grid { grid-template-columns: 1fr; }
    }

    .card { 
        background: var(--card-bg); 
        padding: 24px; 
        border-radius: 12px; 
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        border: 1px solid var(--border);
    }

    .full-width { grid-column: 1 / -1; }

    /* Tables */
    .table-container { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { background: #f1f5f9; padding: 12px; font-weight: 600; border-bottom: 2px solid var(--border); }
    td { padding: 12px; border-bottom: 1px solid var(--border); }
    tr:hover { background-color: #f8fafc; }

    /* Forms */
    .form-group { margin-bottom: 15px; }
    label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 5px; }
    input { 
        width: 100%; 
        padding: 10px; 
        border: 1px solid var(--border); 
        border-radius: 6px; 
        box-sizing: border-box;
        transition: border-color 0.2s;
    }
    input:focus { outline: none; border-color: var(--primary); ring: 2px solid #bfdbfe; }

    /* Buttons */
    .btn {
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }
    .btn-primary { background: var(--primary); color: white; width: 100%; justify-content: center; }
    .btn-primary:hover { background: var(--primary-hover); }
    
    .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text); }
    .btn-outline:hover { background: #f1f5f9; }

    .btn-delete { color: var(--danger); background: transparent; padding: 4px 8px; }
    .btn-delete:hover { background: #fef2f2; border-radius: 4px; }

    .btn-search { background: var(--success); color: white; font-size: 0.8rem; }
    .btn-search:hover { background: #15803d; }

    /* Messages */
    .message { 
        padding: 12px 16px; 
        border-radius: 8px; 
        margin-bottom: 20px; 
        border-left: 4px solid;
    }
    .success { background: #f0fdf4; color: #166534; border-left-color: var(--success); }
    .error { background: #fef2f2; color: #991b1b; border-left-color: var(--danger); }
    
    .actions-cell { display: flex; gap: 8px; align-items: center; }
</style>

<div class="container">
    <h1>Miejsca / Places Tester</h1>

    {#if form?.message}
        <div class="message {form?.missing || form?.error ? 'error' : 'success'}">
            <strong>{form?.error ? 'Błąd' : 'Status'}:</strong> {form.message}
        </div>
    {/if}

    {#if form?.turnieje}
        <div class="card full-width" style="margin-bottom: 24px; border-top: 4px solid var(--primary);">
            <h2>🔎 Wyniki Wyszukiwania Turniejów</h2>
            {#if form.turnieje.length === 0}
                <p style="color: #64748b;">Brak zaplanowanych turniejów w tym miejscu.</p>
            {:else}
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nazwa Turnieju</th>
                                <th>Data i Godzina</th>
                                <th>Organizator</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each form.turnieje as t}
                                <tr>
                                    <td><strong>{t.nazwaTurnieju}</strong></td>
                                    <td>{t.data} <span style="color: #64748b;">{t.godzina}</span></td>
                                    <td>{t.tworca}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}
        </div>
    {/if}

    <div class="grid">
        <div class="card">
            <h2>🏠 Zarządzaj Miejscami</h2>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Nazwa i Miasto</th>
                            <th>Adres</th>
                            <th>Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each data.post as miejsce}
                            <tr>
                                <td>
                                    <strong>{miejsce.nazwa}</strong><br />
                                    <small style="color: #64748b;">{miejsce.miasto}</small>
                                </td>
                                <td>{miejsce.adres}</td>
                                <td>
                                    <div class="actions-cell">
                                        <form method="POST" action="?/szukajWMiejscu" use:enhance>
                                            <input type="hidden" name="miejsce_id" value={miejsce.id} />
                                            <button type="submit" class="btn btn-search">
                                                🔍 Turnieje
                                            </button>
                                        </form>

                                        <form method="POST" action="?/deletePlace" use:enhance>
                                            <input type="hidden" name="miejsceId" value={miejsce.id} />
                                            <button 
                                                type="submit" 
                                                class="btn btn-delete" 
                                                on:click={(e) => !confirm('Czy na pewno chcesz usunąć to miejsce?') && e.preventDefault()}
                                            >
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

        <div class="card">
            <h2>➕ Dodaj Nowe Miejsce</h2>
            <form method="POST" action="?/addMiejsce" use:enhance>
                <div class="form-group">
                    <label for="nazwa">Nazwa Miejsca</label>
                    <input type="text" id="nazwa" name="nazwa" value={form?.nazwa ?? ''} placeholder="np. Arena Sportowa" required />
                </div>
                <div class="form-group">
                    <label for="adres">Adres</label>
                    <input type="text" id="adres" name="adres" value={form?.adres ?? ''} placeholder="ul. Sportowa 1" required />
                </div>
                <div class="form-group">
                    <label for="miasto">Miasto</label>
                    <input type="text" id="miasto" name="miasto" value={form?.miasto ?? ''} placeholder="Warszawa" required />
                </div>
                <button type="submit" class="btn btn-primary">Dodaj Miejsce</button>
            </form>
        </div>
    </div>
</div>