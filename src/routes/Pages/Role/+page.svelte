<script lang="ts">
    import { enhance } from '$app/forms';
    import type { PageData, ActionData } from './$types';

    export let data: PageData;
    export let form: ActionData;

    // Zmienna przechowująca ID roli, która jest aktualnie edytowana
    // Jeśli null, żadna rola nie jest w trybie edycji
    let editingRoleId: string | null = null;

    // Funkcja pomocnicza do ładnego wyświetlania JSON
    function formatJSON(jsonString: string): string {
        try {
            const parsed = JSON.parse(jsonString);
            return JSON.stringify(parsed, null, 2); // wcięcia 2 spacje
        } catch (e) {
            return jsonString; // jeśli błąd parsowania, zwróć oryginał
        }
    }

    // Obsługa przełączania trybu edycji
    function startEditing(id: string) {
        editingRoleId = id;
    }

    function cancelEditing() {
        editingRoleId = null;
    }
</script>

<div class="container">
    <header>
        <h1>Zarządzanie Uprawnieniami</h1>
        <p class="subtitle">Edytuj role, przypisuj uprawnienia i zarządzaj dostępem użytkowników.</p>
    </header>

    {#if form}
        <div class="alert" class:success={form.success} class:error={!form.success}>
            {#if form.success}
                {form.message || 'Operacja zakończona sukcesem!'}
            {:else if form.invalidRoleID}
                ID roli jest nieprawidłowe (wymagane: #nazwa#).
            {:else if form.invalidPermissions}
                Błąd formatu JSON w uprawnieniach.
            {:else if form.cannotDeleteDefaultRole}
                Nie można usunąć roli systemowej #player#.
            {:else}
                Wystąpił nieoczekiwany błąd.
            {/if}
        </div>
    {/if}

    <hr />

    <section>
        <h2>👤 Lista Użytkowników</h2>
        <div class="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>Użytkownik</th>
                        <th>Obecna Rola</th>
                        <th>Zmień Rolę</th>
                    </tr>
                </thead>
                <tbody>
                    {#each data.users as user}
                        <tr>
                            <td>
                                <div class="user-info">
                                    <span class="username">{user.nazwa || 'Bez nazwy'}</span>
                                    <span class="userid">ID: {user.id}</span>
                                </div>
                            </td>
                            <td>
                                <span class="badge" class:badge-admin={user.role !== '#player#'}>
                                    {user.role}
                                </span>
                            </td>
                            <td class="actions-cell">
                                <form method="POST" action="?/assignRoleToUser" use:enhance class="assign-form">
                                    <input type="hidden" name="userId" value={user.id} />
                                    
                                    <div class="select-wrapper">
                                        <select name="roleId" aria-label="Wybierz rolę dla {user.nazwa}">
                                            {#each data.roles as r}
                                                <option value={r.id} selected={r.id === user.role}>
                                                    {r.id}
                                                </option>
                                            {/each}
                                        </select>
                                    </div>

                                    <button type="submit" class="btn-sm">Zapisz</button>
                                </form>

                                {#if user.role !== '#player#'}
                                    <form method="POST" action="?/removeRoleFromUser" use:enhance>
                                        <input type="hidden" name="userId" value={user.id} />
                                        <button type="submit" class="btn-icon remove" title="Przywróć domyślną rolę">↺</button>
                                    </form>
                                {/if}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </section>

    <hr />

    <section>
        <div class="section-header">
            <h2>🛡️ Definicje Ról</h2>
        </div>

        <div class="roles-grid">
            <div class="role-card add-new">
                <h3>+ Nowa Rola</h3>
                <form method="POST" action="?/addRole" use:enhance>
                    <div class="form-group">
                        <label for="newRoleName">ID Roli</label>
                        <input type="text" id="newRoleName" name="roleId" placeholder="#admin#" pattern="^#[a-zA-Z0-9_]+#$" required />
                    </div>
                    <div class="form-group">
                        <label for="newRolePerms">JSON</label>
                        <textarea id="newRolePerms" name="permissions" rows="3">{'{"access": true}'}</textarea>
                    </div>
                    <button type="submit" class="btn-primary full-width">Utwórz</button>
                </form>
            </div>

            {#each data.roles as role (role.id)}
                <div class="role-card">
                    <div class="card-top">
                        <h3 class="role-title">{role.id}</h3>
                        {#if role.id !== '#player#'}
                            <form method="POST" action="?/deleteRole" use:enhance on:submit={() => confirm('Usunąć rolę?')}>
                                <input type="hidden" name="roleId" value={role.id} />
                                <button type="submit" class="btn-icon delete" aria-label="Usuń rolę">🗑️</button>
                            </form>
                        {/if}
                    </div>

                    {#if editingRoleId === role.id}
                        <form method="POST" action="?/updatePermissions" use:enhance on:submit={() => editingRoleId = null}>
                            <input type="hidden" name="roleId" value={role.id} />
                            
                            <label for="edit-perm-{role.id}" class="sr-only">Edytuj JSON</label>
                            <textarea 
                                id="edit-perm-{role.id}"
                                name="permissions" 
                                rows="6" 
                                class="code-editor"
                            >{formatJSON(role.uprawnienia)}</textarea>
                            
                            <div class="edit-actions">
                                <button type="button" class="btn-secondary" on:click={cancelEditing}>Anuluj</button>
                                <button type="submit" class="btn-success">Zapisz</button>
                            </div>
                        </form>
                    {:else}
                        <div class="json-preview">
                            <pre>{formatJSON(role.uprawnienia)}</pre>
                        </div>
                        <button class="btn-outline" on:click={() => startEditing(role.id)}>
                            ✏️ Edytuj Uprawnienia
                        </button>
                    {/if}
                </div>
            {/each}
        </div>
    </section>
</div>

<style>
    :root {
        --primary: #2563eb;
        --danger: #dc2626;
        --success: #16a34a;
        --bg-light: #f8fafc;
        --border: #e2e8f0;
    }

    .container { max-width: 1000px; margin: 0 auto; padding: 2rem; font-family: 'Segoe UI', system-ui, sans-serif; color: #1e293b; }
    
    h1 { font-size: 1.8rem; margin-bottom: 0.5rem; }
    h2 { font-size: 1.4rem; margin-bottom: 1rem; color: #334155; }
    .subtitle { color: #64748b; margin-bottom: 2rem; }

    /* Alerty */
    .alert { padding: 1rem; border-radius: 6px; margin-bottom: 2rem; font-weight: 500; }
    .alert.success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .alert.error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

    /* Tabela */
    .table-responsive { overflow-x: auto; border: 1px solid var(--border); border-radius: 8px; }
    table { width: 100%; border-collapse: collapse; background: white; }
    th { background: #f1f5f9; text-align: left; padding: 12px 16px; font-weight: 600; color: #475569; }
    td { padding: 12px 16px; border-top: 1px solid var(--border); vertical-align: middle; }
    
    .user-info { display: flex; flex-direction: column; }
    .username { font-weight: 600; font-size: 1rem; }
    .userid { font-size: 0.75rem; color: #94a3b8; font-family: monospace; }

    .badge { background: #e2e8f0; padding: 4px 8px; border-radius: 12px; font-size: 0.85rem; font-family: monospace; }
    .badge-admin { background: #dbeafe; color: #1e40af; }

    /* Formularze w tabeli */
    .assign-form { display: flex; gap: 8px; align-items: center; }
    .select-wrapper select { padding: 6px; border-radius: 4px; border: 1px solid var(--border); background: white; }

    /* Grid Ról */
    .roles-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
    
    .role-card { background: white; border: 1px solid var(--border); border-radius: 8px; padding: 1.5rem; display: flex; flex-direction: column; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .add-new { background: #f8fafc; border-style: dashed; border-width: 2px; }
    
    .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .role-title { margin: 0; font-family: monospace; font-size: 1.1rem; background: #f1f5f9; padding: 4px 8px; border-radius: 4px; }

    /* Edytor JSON */
    .json-preview pre { 
        background: #1e293b; color: #e2e8f0; padding: 1rem; border-radius: 6px; 
        overflow-x: auto; font-size: 0.85rem; margin: 0 0 1rem 0; min-height: 80px;
    }
    
    .code-editor { 
        width: 100%; font-family: monospace; padding: 0.5rem; border: 1px solid #cbd5e1; 
        border-radius: 4px; background: #fff; font-size: 0.85rem; margin-bottom: 0.5rem;
    }

    /* Przyciski */
    button { cursor: pointer; border: none; border-radius: 4px; font-weight: 500; transition: all 0.2s; }
    .btn-primary { background: var(--primary); color: white; padding: 8px 16px; }
    .btn-primary:hover { background: #1d4ed8; }
    
    .btn-sm { padding: 6px 12px; background: var(--primary); color: white; font-size: 0.85rem; }
    
    .btn-outline { background: white; border: 1px solid var(--border); color: #475569; padding: 8px; width: 100%; }
    .btn-outline:hover { background: #f8fafc; border-color: #cbd5e1; }

    .btn-success { background: var(--success); color: white; padding: 6px 12px; }
    .btn-secondary { background: #94a3b8; color: white; padding: 6px 12px; }
    
    .btn-icon { background: transparent; font-size: 1.2rem; padding: 4px; line-height: 1; }
    .btn-icon:hover { transform: scale(1.1); }
    .remove { color: #64748b; }
    .remove:hover { color: var(--danger); }
    .delete { font-size: 1rem; opacity: 0.6; }
    .delete:hover { opacity: 1; }

    .edit-actions { display: flex; gap: 8px; justify-content: flex-end; }
    .full-width { width: 100%; margin-top: 10px;}
    .form-group { margin-bottom: 10px; }
    .form-group label { display: block; font-size: 0.85rem; margin-bottom: 4px; color: #64748b; }
    .form-group input, .form-group textarea { width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 4px; }
    
    /* Screen reader only */
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); border: 0; }
</style>