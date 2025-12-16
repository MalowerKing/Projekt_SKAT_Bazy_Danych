<script lang="ts">
	import { enhance } from '$app/forms';
	import { fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { goto } from '$app/navigation';
	import type { ActionData } from './$types';

	export let form: ActionData;

	// Definicja typów błędów dla logowania (wzorowana na RegisterFormState)
	interface LoginFormState {
		identifier?: string;       // Aby zachować wpisany login przy błędzie
		invalidInput?: boolean;
		userNotFound?: boolean;
		invalidPassword?: boolean;
		invalidCredentials?: boolean;
		serverError?: boolean;
	}

	// Reaktywne przypisanie stanu formularza z propa 'form'
	$: formState = form as unknown as LoginFormState | null;

	let isLoading = false;

	// Funkcja zamykająca - powrót na stronę główną (jak w rejestracji)
	function closeModal() {
		goto('/');
	}
</script>

<div 
	class="modal-backdrop"
	transition:fade={{ duration: 200 }}
	role="presentation"
>
	<div 
		class="modal-content" 
		transition:scale={{ duration: 300, easing: cubicOut, start: 0.95 }}
	>
		<button class="close-btn" on:click={closeModal}>&times;</button>
		
		<h2>Zaloguj się</h2>
		<p class="subtitle">Wprowadź swoje dane, aby uzyskać dostęp.</p>

		<form 
			method="POST" 
			action="?/login" 
			use:enhance={() => {
				isLoading = true;
				return async ({ update }) => {
					isLoading = false;
					await update();
				};
			}}
		>
			<div class="input-group">
				<label for="identifier">Nazwa użytkownika lub Email</label>
				<input 
					type="text" 
					id="identifier" 
					name="identifier" 
					placeholder="Wpisz login lub email"
					value={formState?.identifier ?? ''}
					class:error={formState?.userNotFound || formState?.invalidInput || formState?.invalidCredentials}
					required
				/>
				{#if formState?.userNotFound}
					<span class="error-msg">Nie znaleziono takiego użytkownika.</span>
				{/if}
			</div>

			<div class="input-group">
				<label for="password">Hasło</label>
				<input 
					type="password" 
					id="password" 
					name="password" 
					placeholder="••••••••"
					class:error={formState?.invalidPassword || formState?.invalidCredentials}
					required
				/>
				{#if formState?.invalidCredentials}
					<span class="error-msg">Nieprawidłowe hasło.</span>
				{/if}
			</div>

			{#if formState?.serverError}
				<div class="alert-error">Wystąpił błąd serwera. Spróbuj później.</div>
			{/if}

			{#if formState?.invalidInput}
				<div class="alert-error">Nieprawidłowe dane wejściowe.</div>
			{/if}

			<button type="submit" class="btn-submit" disabled={isLoading}>
				{#if isLoading}
					<span class="loader"></span> Weryfikacja...
				{:else}
					Zaloguj
				{/if}
			</button>
		</form>
		
		<div class="footer">
			Nie masz jeszcze konta?
			<a href="/register?">Zarejestruj się</a>
		</div>
	</div>
</div>

<style>
	/* Style globalne (skopiowane z register.svelte dla spójności) */
	:global(body) {
		margin: 0;
		font-family: 'Inter', system-ui, -apple-system, sans-serif;
		background-color: #f3f4f6;
		color: #1f2937;
	}

	h2 { margin-top: 0; margin-bottom: 0.5rem; color: #111827; }
	.subtitle { color: #6b7280; font-size: 0.9rem; margin-bottom: 1.5rem; }

	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		padding: 1rem;
		box-sizing: border-box;
	}

	.modal-content {
		background: white;
		padding: 2rem;
		border-radius: 1rem;
		width: 100%;
		max-width: 400px;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
		position: relative;
		text-align: left;
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
	input:focus { 
		outline: none;
		border-color: #2563eb; 
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); 
	}
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
		font-family: inherit;
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