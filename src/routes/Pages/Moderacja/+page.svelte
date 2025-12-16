<script lang="ts">
    import { enhance } from '$app/forms';
    import type { SubmitFunction } from '@sveltejs/kit';
    import type { PageData, ActionData } from './$types';

    export let data: PageData;
    export let form: ActionData;

    // Stan zaznaczenia dla masowego usuwania po ID (tabela)
    let selectedUserIds: string[] = [];

    // Stan edycji inline
    let editingUsernameId: string | null = null;
    let editingEmailId: string | null = null;
    let editingRoleId: string | null = null;
    let editingPasswordId: string | null = null;

    // Resetowanie stanów po udanej akcji
    $: if (form?.success) {
        selectedUserIds = [];
        editingUsernameId = null;
        editingEmailId = null;
        editingRoleId = null;
        editingPasswordId = null;
    }

    /**
     * Funkcja pomocnicza do obsługi masowego wpisywania po przecinku.
     * Pobiera wartość z pola 'rawInputName', dzieli po przecinku i 
     * wstawia jako wiele wartości dla klucza 'targetFieldName'.
     */
    const prepareBulkData = (targetFieldName: string, rawInputName: string): SubmitFunction => {
        return ({ formData }) => {
            // Pobierz surowy ciąg (np. "user1, user2, user3")
            const rawString = formData.get(rawInputName) as string;
            
            // Usuń surowy wpis, żeby nie śmiecił
            formData.delete(rawInputName);

            if (rawString) {
                // Podziel po przecinku, usuń białe znaki i puste wpisy
                const items = rawString.split(',').map(s => s.trim()).filter(s => s !== '');
                
                // Dodaj każdy element osobno do FormData
                // Backend odbierze to jako tablicę dzięki formData.getAll(targetFieldName)
                items.forEach(item => {
                    formData.append(targetFieldName, item);
                });
            }

            return async ({ update }) => {
                await update();
            };
        };
    };
</script>

<div class="container">
    <header>
        <h1>Panel Administratora</h1>
    </header>

    <div class="messages">
        {#if form?.success}<div class="alert success">Operacja zakończona sukcesem!</div>{/if}
        {#if form?.invalidInput}<div class="alert error">Nieprawidłowe dane wejściowe.</div>{/if}
        {#if form?.serverError}<div class="alert error">Wystąpił błąd serwera.</div>{/if}
        {#if form?.databaseError}<div class="alert error">Błąd bazy danych.</div>{/if}
        
        {#if form?.invalidUsername}<div class="alert error">Nieprawidłowy format nazwy użytkownika.</div>{/if}
        {#if form?.invalidEmail}<div class="alert error">Nieprawidłowy format adresu email.</div>{/if}
        {#if form?.invalidPassword}<div class="alert error">Hasło nie spełnia wymagań bezpieczeństwa.</div>{/if}
        {#if form?.invalidRole || form?.invalidRoleID}<div class="alert error">Wybrana rola jest nieprawidłowa.</div>{/if}
        {#if form?.usernameTaken}<div class="alert error">Ta nazwa użytkownika jest już zajęta.</div>{/if}
        {#if form?.emailTaken}<div class="alert error">Ten adres email jest już zajęty.</div>{/if}
    </div>

    <section class="card">
        <h3>Dodaj nowego użytkownika</h3>
        <form method="POST" action="?/addUser" use:enhance class="grid-form">
            <div class="form-group">
                <label>Nazwa użytkownika
                    <input type="text" name="username" placeholder="np. JanKowalski" required value={form?.username || ''} />
                </label>
            </div>
            <div class="form-group">
                <label>Email
                    <input type="email" name="email" placeholder="jan@example.com" required />
                </label>
            </div>
            <div class="form-group">
                <label>Rola
                    <select name="role" required>
                        <option value="user">Użytkownik (user)</option>
                        <option value="admin">Administrator (admin)</option>
                    </select>
                </label>
            </div>
            <div class="form-group">
                <label>Hasło
                    <input type="password" name="password" placeholder="Hasło" required />
                </label>
            </div>
            <div class="form-group full-width">
                <button type="submit" class="btn-primary">Utwórz użytkownika</button>
            </div>
        </form>
    </section>

    <section class="card">
        <div class="table-header">
            <h3>Lista Użytkowników ({data.users.length})</h3>
            
            {#if selectedUserIds.length > 0}
                <form method="POST" action="?/deleteUsers" use:enhance>
                    {#each selectedUserIds as id}
                        <input type="hidden" name="userIds" value={id} />
                    {/each}
                    <button type="submit" class="btn-danger">Usuń zaznaczone ({selectedUserIds.length})</button>
                </form>
            {/if}
        </div>

        <div class="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th style="width: 40px;">
                            <input type="checkbox" on:change={(e) => {
                                if (e.currentTarget.checked) selectedUserIds = data.users.map(u => u.id);
                                else selectedUserIds = [];
                            }} />
                        </th>
                        <th>Nazwa (Login)</th>
                        <th>Email</th>
                        <th>Rola</th>
                        <th>Zarządzanie hasłem</th>
                    </tr>
                </thead>
                <tbody>
                    {#each data.users as user (user.id)}
                        <tr class:selected={selectedUserIds.includes(user.id)}>
                            <td>
                                <input type="checkbox" bind:group={selectedUserIds} value={user.id} />
                            </td>
                            <td>
                                {#if editingUsernameId === user.id}
                                    <form method="POST" action="?/changeUsername" use:enhance class="inline-edit">
                                        <input type="hidden" name="userId" value={user.id} />
                                        <input type="text" name="newUsername" value={user.nazwa} required autofocus />
                                        <button type="submit" title="Zapisz">💾</button>
                                        <button type="button" on:click={() => editingUsernameId = null} title="Anuluj">✕</button>
                                    </form>
                                {:else}
                                    <button class="link-button" on:click={() => editingUsernameId = user.id}>
                                        {user.nazwa} ✎
                                    </button>
                                {/if}
                            </td>
                            <td>
                                {#if editingEmailId === user.id}
                                    <form method="POST" action="?/changeEmail" use:enhance class="inline-edit">
                                        <input type="hidden" name="userId" value={user.id} />
                                        <input type="email" name="newEmail" value={user.email} required />
                                        <button type="submit" title="Zapisz">💾</button>
                                        <button type="button" on:click={() => editingEmailId = null} title="Anuluj">✕</button>
                                    </form>
                                {:else}
                                    <button class="link-button" on:click={() => editingEmailId = user.id}>
                                        {user.email} ✎
                                    </button>
                                {/if}
                            </td>
                            <td>
                                {#if editingRoleId === user.id}
                                    <form method="POST" action="?/changeRole" use:enhance class="inline-edit">
                                        <input type="hidden" name="userId" value={user.id} />
                                        <select name="newRoleID" value={user.role} required>
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                        <button type="submit" title="Zapisz">💾</button>
                                        <button type="button" on:click={() => editingRoleId = null} title="Anuluj">✕</button>
                                    </form>
                                {:else}
                                    <button class="link-button" on:click={() => editingRoleId = user.id}>
                                        <span class="badge {user.role}">{user.role}</span> ✎
                                    </button>
                                {/if}
                            </td>
                            <td>
                                {#if editingPasswordId === user.id}
                                    <form method="POST" action="?/changePassword" use:enhance class="inline-edit">
                                        <input type="hidden" name="userId" value={user.id} />
                                        <input type="password" name="newPassword" placeholder="Nowe hasło" required />
                                        <button type="submit" title="Zapisz">💾</button>
                                        <button type="button" on:click={() => editingPasswordId = null} title="Anuluj">✕</button>
                                    </form>
                                {:else}
                                    <button class="btn-sm" on:click={() => editingPasswordId = user.id}>Zmień hasło</button>
                                {/if}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
        {#if data.users.length === 0}
            <p class="empty-state">Brak użytkowników w bazie.</p>
        {/if}
    </section>

    <details class="card advanced-tools">
        <summary>Zaawansowane narzędzia (Masowe usuwanie po nazwie/email)</summary>
        <div class="tools-grid">
            
            <div class="tool-box">
                <h4>Usuń użytkowników po Emailu</h4>
                <p class="hint">Wpisz emaile oddzielone przecinkami (np. <code>a@a.com, b@b.com</code>)</p>
                
                <form 
                    method="POST" 
                    action="?/deleteUsersByEmail" 
                    use:enhance={prepareBulkData('emails', 'rawEmails')}
                >
                    <div class="input-group">
                        <textarea 
                            name="rawEmails" 
                            placeholder="adres1@test.com, adres2@test.com" 
                            rows="2"
                            required 
                        ></textarea>
                        <button type="submit" class="btn-danger">Usuń</button>
                    </div>
                </form>
            </div>

            <div class="tool-box">
                <h4>Usuń użytkowników po Nazwie</h4>
                <p class="hint">Wpisz nazwy użytkowników oddzielone przecinkami.</p>
                
                <form 
                    method="POST" 
                    action="?/deleteUsersByUsername" 
                    use:enhance={prepareBulkData('usernames', 'rawUsernames')}
                >
                    <div class="input-group">
                        <textarea 
                            name="rawUsernames" 
                            placeholder="User1, User2, User3" 
                            rows="2"
                            required 
                        ></textarea>
                        <button type="submit" class="btn-danger">Usuń</button>
                    </div>
                </form>
            </div>
        </div>
    </details>
</div>

<style>
    /* Reset i zmienne */
    :root {
        --primary: #2563eb;
        --primary-hover: #1d4ed8;
        --danger: #dc2626;
        --danger-hover: #b91c1c;
        --bg: #f8fafc;
        --card-bg: #ffffff;
        --border: #e2e8f0;
        --text: #334155;
    }

    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
        font-family: system-ui, -apple-system, sans-serif;
        color: var(--text);
        background-color: var(--bg);
        min-height: 100vh;
    }

    header { margin-bottom: 2rem; }
    h1 { margin: 0; font-size: 1.8rem; }
    h3 { margin-top: 0; }

    .card {
        background: var(--card-bg);
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        margin-bottom: 2rem;
        border: 1px solid var(--border);
    }

    /* Formularze */
    .grid-form {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        align-items: end;
    }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-group.full-width { grid-column: 1 / -1; }
    
    label { font-size: 0.9rem; font-weight: 500; }
    input, select, textarea {
        padding: 0.6rem;
        border: 1px solid var(--border);
        border-radius: 4px;
        font-size: 1rem;
        width: 100%;
        box-sizing: border-box;
        font-family: inherit;
    }
    textarea { resize: vertical; }

    button {
        padding: 0.6rem 1.2rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        transition: background 0.2s;
    }
    .btn-primary { background: var(--primary); color: white; }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-danger { background: var(--danger); color: white; }
    .btn-danger:hover { background: var(--danger-hover); }
    .btn-sm { font-size: 0.85rem; padding: 0.3rem 0.8rem; background: #eee; color: #333; }
    .btn-sm:hover { background: #ddd; }

    /* Tabela */
    .table-responsive { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid var(--border); }
    th { background: #f1f5f9; font-weight: 600; }
    tr:hover { background: #f8fafc; }
    tr.selected { background: #eff6ff; }

    .link-button {
        background: none;
        border: none;
        color: inherit;
        text-align: left;
        padding: 0;
        font: inherit;
        cursor: pointer;
        border-bottom: 1px dashed #94a3b8; 
    }
    .link-button:hover { color: var(--primary); border-color: var(--primary); }

    .inline-edit { display: flex; gap: 0.5rem; align-items: center; }
    .inline-edit input, .inline-edit select { padding: 0.4rem; font-size: 0.9rem; }
    .inline-edit button { padding: 0.4rem; font-size: 1rem; background: none; border: 1px solid var(--border); }
    .inline-edit button:hover { background: #f1f5f9; }

    .badge {
        padding: 0.2rem 0.5rem;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
        background: #e2e8f0;
    }
    .badge.admin { background: #dbeafe; color: #1e40af; }
    .badge.user { background: #f1f5f9; color: #475569; }

    .messages { margin-bottom: 1.5rem; }
    .alert { padding: 1rem; border-radius: 4px; margin-bottom: 0.5rem; }
    .alert.error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
    .alert.success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }

    .advanced-tools { background: #fff1f2; border-color: #fecaca; }
    .advanced-tools summary { font-weight: 600; color: #991b1b; cursor: pointer; }
    .tools-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 1rem; }
    .tool-box h4 { margin-top: 0; }
    .hint { font-size: 0.85rem; color: #666; margin-bottom: 0.5rem; }
    .input-group { display: flex; gap: 0.5rem; align-items: flex-start; }
    .input-group textarea { flex: 1; }
</style>