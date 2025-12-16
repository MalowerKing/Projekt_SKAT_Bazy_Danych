<script lang="ts">
    import { enhance } from '$app/forms';
    import type { PageData, ActionData } from './$types';

    // Odbieramy dane (data) i wynik ostatniej akcji formularza (form)
    let { data, form }: { data: PageData, form: ActionData } = $props();
</script>

<div class="profile-container">
    <h1>Twój Profil</h1>

    {#if data.userData}
        <section class="card info-card">
            <h2>Twoje Dane</h2>
            <div class="info-row">
                <span class="label">Nazwa:</span>
                <span class="value">{data.userData.nazwa}</span>
            </div>
            <div class="info-row">
                <span class="label">Email:</span>
                <span class="value">{data.userData.email}</span>
            </div>
            <div class="info-row highlight">
                <span class="label">Ranking ELO:</span>
                <span class="value">{data.userData.elo ?? 1000}</span>
            </div>
            <div class="info-row">
                <span class="label">Rola:</span>
                <span class="badge">{data.userData.role}</span>
            </div>
        </section>

        {#if form?.message}
            <div class="alert {form.success ? 'success' : 'error'}">
                {form.message}
            </div>
        {/if}

        <div class="forms-grid">
            <section class="card">
                <h3>Zmień nazwę</h3>
                <form method="POST" action="?/changeUsername" use:enhance>
                    <div class="form-group">
                        <label for="newUsername">Nowa nazwa</label>
                        <input 
                            type="text" 
                            id="newUsername" 
                            name="newUsername" 
                            placeholder="Wpisz nową nazwę" 
                            required 
                            minlength="3"
                        />
                    </div>
                    <button type="submit" class="btn-primary">Zapisz nazwę</button>
                </form>
            </section>

            <section class="card">
                <h3>Zmień email</h3>
                <form method="POST" action="?/changeEmail" use:enhance>
                    <div class="form-group">
                        <label for="newEmail">Nowy adres email</label>
                        <input 
                            type="email" 
                            id="newEmail" 
                            name="newEmail" 
                            placeholder="jan@example.com" 
                            required 
                        />
                    </div>
                    <button type="submit" class="btn-primary">Zapisz email</button>
                </form>
            </section>

            <section class="card">
                <h3>Zmień hasło</h3>
                <form method="POST" action="?/changePassword" use:enhance>
                    <div class="form-group">
                        <label for="newPassword">Nowe hasło</label>
                        <input 
                            type="password" 
                            id="newPassword" 
                            name="newPassword" 
                            placeholder="Minimum 8 znaków" 
                            required 
                            minlength="8"
                        />
                    </div>
                    <div class="form-group">
                        <label for="confirmNewPassword">Potwierdź hasło</label>
                        <input 
                            type="password" 
                            id="confirmNewPassword" 
                            name="confirmNewPassword" 
                            placeholder="Powtórz hasło" 
                            required 
                            minlength="8"
                        />
                    </div>
                    <button type="submit" class="btn-primary">Zmień hasło</button>
                </form>
            </section>

            <section class="card danger-zone">
                <h3>Usuń konto</h3>
                <p class="warning-text">Tej operacji nie można cofnąć. Wszystkie Twoje dane zostaną utracone.</p>
                <form 
                    method="POST" 
                    action="?/deleteAccount" 
                    use:enhance 
                    onsubmit={(e) => {
                        if (!confirm('Czy na pewno chcesz usunąć swoje konto? Tej operacji nie można cofnąć!')) {
                            e.preventDefault();
                        }
                    }}
                >
                    <button type="submit" class="btn-danger">Usuń konto trwale</button>
                </form>
            </section>
        </div>

    {:else}
        <p>Ładowanie danych profilu...</p>
    {/if}
</div>

<style>
    .profile-container {
        max-width: 900px;
        margin: 2rem auto;
        padding: 0 1rem;
        font-family: sans-serif;
    }

    h1 {
        text-align: center;
        margin-bottom: 2rem;
        color: #333;
    }

    h2, h3 {
        margin-top: 0;
        color: #444;
    }

    /* Karty */
    .card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        margin-bottom: 1.5rem;
    }

    .info-card {
        border-left: 4px solid #2563eb;
    }

    .danger-zone {
        border: 1px solid #fca5a5;
        background-color: #fef2f2;
    }

    .danger-zone h3 {
        color: #991b1b;
    }

    /* Grid dla formularzy */
    .forms-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.5rem;
    }

    @media (min-width: 768px) {
        .forms-grid {
            grid-template-columns: 1fr 1fr;
        }
    }

    /* Wiersze informacyjne */
    .info-row {
        display: flex;
        justify-content: space-between;
        padding: 0.75rem 0;
        border-bottom: 1px solid #f3f4f6;
    }

    .info-row:last-child {
        border-bottom: none;
    }

    .label {
        font-weight: 600;
        color: #6b7280;
    }

    .value {
        color: #111827;
    }

    .highlight .value {
        color: #2563eb;
        font-weight: bold;
    }

    .badge {
        background-color: #e5e7eb;
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
        font-size: 0.85rem;
    }

    /* Formularze */
    .form-group {
        margin-bottom: 1rem;
    }

    label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
        color: #374151;
    }

    input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 1rem;
        box-sizing: border-box;
    }

    input:focus {
        outline: none;
        border-color: #2563eb;
        ring: 2px solid #bfdbfe;
    }

    /* Przyciski */
    button {
        width: 100%;
        padding: 0.75rem;
        border: none;
        border-radius: 4px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .btn-primary {
        background-color: #2563eb;
        color: white;
    }

    .btn-primary:hover {
        background-color: #1d4ed8;
    }

    .btn-danger {
        background-color: #dc2626;
        color: white;
    }

    .btn-danger:hover {
        background-color: #b91c1c;
    }

    .warning-text {
        font-size: 0.9rem;
        color: #7f1d1d;
        margin-bottom: 1rem;
    }

    /* Powiadomienia */
    .alert {
        padding: 1rem;
        border-radius: 6px;
        margin-bottom: 1.5rem;
        text-align: center;
        font-weight: 500;
    }

    .alert.success {
        background-color: #d1fae5;
        color: #065f46;
        border: 1px solid #a7f3d0;
    }

    .alert.error {
        background-color: #fee2e2;
        color: #991b1b;
        border: 1px solid #fecaca;
    }
</style>