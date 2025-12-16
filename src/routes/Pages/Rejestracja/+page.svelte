<script lang="ts">
	import { enhance } from '$app/forms';
	import { fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { goto } from '$app/navigation'; // Import do przekierowania
	import type { ActionData } from './$types';

	export let form: ActionData;

	interface RegisterFormState {
		username?: string;
		invalidUsername?: boolean;
		usernameTaken?: boolean;
		invalidEmail?: boolean;
		invalidPassword?: boolean;
		passwordsDoNotMatch?: boolean;
		databaseError?: boolean;
		invalidInput?: boolean;
	}

	$: formState = form as unknown as RegisterFormState | null;

	let isLoading = false;

	// Funkcja zamykająca modal - w tym przypadku wraca na stronę główną
	function closeModal() {
		goto('/');
	}

	// Obsługa kliknięcia w tło
	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			closeModal();
		}
	}
</script>

<div 
    class="modal-backdrop" 
    on:click={handleBackdropClick} 
    transition:fade={{ duration: 200 }}
    role="presentation"
>
    <div 
        class="modal-content" 
        transition:scale={{ duration: 300, easing: cubicOut, start: 0.95 }}
    >
        <button class="close-btn" on:click={closeModal}>&times;</button>
        
        <h2>Utwórz konto</h2>
        <p class="subtitle">Wypełnij poniższe dane, aby rozpocząć.</p>

        <form 
            method="POST" 
            action="?/register" 
            use:enhance={() => {
                isLoading = true;
                return async ({ update }) => {
                    isLoading = false;
                    await update();
                };
            }}
        >
            <div class="input-group">
                <label for="username">Nazwa użytkownika</label>
                <input 
                    type="text" 
                    id="username" 
                    name="username" 
                    placeholder="Wpisz nazwę"
                    value={formState?.username ?? ''}
                    class:error={formState?.invalidUsername || formState?.usernameTaken}
                    required
                />
                {#if formState?.invalidUsername}
                    <span class="error-msg">Nazwa musi mieć 3-31 znaków alfanumerycznych.</span>
                {/if}
                {#if formState?.usernameTaken}
                    <span class="error-msg">Ta nazwa jest już zajęta.</span>
                {/if}
            </div>

            <div class="input-group">
                <label for="email">Adres Email</label>
                <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    placeholder="jan@przyklad.pl"
                    class:error={formState?.invalidEmail}
                    required
                />
                {#if formState?.invalidEmail}
                    <span class="error-msg">Podaj prawidłowy adres email.</span>
                {/if}
            </div>

            <div class="input-group">
                <label for="password">Hasło</label>
                <input 
                    type="password" 
                    id="password" 
                    name="password" 
                    placeholder="••••••••"
                    class:error={formState?.invalidPassword}
                    required
                />
                {#if formState?.invalidPassword}
                    <span class="error-msg">Min. 8 znaków, duża litera, mała litera i cyfra.</span>
                {/if}
            </div>

            <div class="input-group">
                <label for="confirmPassword">Potwierdź hasło</label>
                <input 
                    type="password" 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    placeholder="••••••••"
                    class:error={formState?.passwordsDoNotMatch}
                    required
                />
                {#if formState?.passwordsDoNotMatch}
                    <span class="error-msg">Hasła nie są identyczne.</span>
                {/if}
            </div>

            {#if formState?.databaseError}
                <div class="alert-error">Wystąpił błąd serwera. Spróbuj później.</div>
            {/if}

            {#if formState?.invalidInput}
                <div class="alert-error">Nieprawidłowe dane wejściowe.</div>
            {/if}

            <button type="submit" class="btn-submit" disabled={isLoading}>
                {#if isLoading}
                    <span class="loader"></span> Przetwarzanie...
                {:else}
                    Zarejestruj się
                {/if}
            </button>
        </form>
        
        <div class="footer">
            Masz już konto? <a href="/login">Zaloguj się</a>
        </div>
    </div>
</div>

<style>
    /* Zachowujemy style globalne, ale usuwamy style dla .hero i .page-container, 
       ponieważ backdrop zajmuje teraz cały ekran. */

	:global(body) {
		margin: 0;
		font-family: 'Inter', system-ui, -apple-system, sans-serif;
		background-color: #f3f4f6;
		color: #1f2937;
	}

    /* Style dla modala i formularza */
	h2 { margin-top: 0; margin-bottom: 0.5rem; color: #111827; }
	.subtitle { color: #6b7280; font-size: 0.9rem; margin-bottom: 1.5rem; }

	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
        /* Tło jest nieco mniej przezroczyste, bo pod spodem nie ma innej treści strony */
		background: rgba(0, 0, 0, 0.6); 
		backdrop-filter: blur(4px);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		padding: 1rem;
        box-sizing: border-box; /* Ważne, żeby padding nie rozpychał width 100% */
	}

	.modal-content {
		background: white;
		padding: 2rem;
		border-radius: 1rem;
		width: 100%;
		max-width: 400px;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
		position: relative;
	}

	.input-group { margin-bottom: 1rem; text-align: left; }
	label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem; }

	input {
		width: 100%;
		padding: 0.625rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.95rem;
		box-sizing: border-box;
		transition: border-color 0.2s, box-shadow 0.2s;
	}
	input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
	input.error { border-color: #ef4444; }
	input.error:focus { box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1); }

	.error-msg { color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; }
	.alert-error { background-color: #fee2e2; color: #991b1b; padding: 0.75rem; border-radius: 0.375rem; margin-bottom: 1rem; font-size: 0.875rem; text-align: center; }

	.btn-submit {
		width: 100%;
		background-color: #111827;
		color: white;
		border: none;
		padding: 0.75rem;
		border-radius: 0.375rem;
		font-weight: 600;
		cursor: pointer;
		margin-top: 0.5rem;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
	}
	.btn-submit:hover:not(:disabled) { background-color: #000; }
	.btn-submit:disabled { background-color: #6b7280; cursor: not-allowed; }

	.close-btn {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: none;
		border: none;
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
		color: #9ca3af;
	}
	.close-btn:hover { color: #111827; }

	.footer { margin-top: 1.5rem; text-align: center; font-size: 0.875rem; color: #6b7280; }
	.footer a { color: #2563eb; text-decoration: none; font-weight: 500; }
	.footer a:hover { text-decoration: underline; }

	.loader {
		border: 2px solid rgba(255,255,255,0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		width: 16px;
		height: 16px;
		animation: spin 1s linear infinite;
	}
	@keyframes spin { to { transform: rotate(360deg); } }
</style>