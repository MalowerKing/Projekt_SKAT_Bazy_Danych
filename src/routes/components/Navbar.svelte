<script>
	import { enhance } from '$app/forms';

	// Odbieramy dane użytkownika za pomocą $props() (Svelte 5)
	let { user = null } = $props();

	// Stan menu mobilnego za pomocą $state() (Svelte 5)
	let isOpen = $state(false);

	function toggleMenu() {
		isOpen = !isOpen;
	}

	function closeMenu() {
		isOpen = false;
	}
</script>

<nav>
	<div class="logo">
		<a href="/">SKAT POLIS</a>
	</div>

	<button
		class="hamburger"
		onclick={toggleMenu}
		aria-label="Toggle menu"
		aria-expanded={isOpen}
	>
		<span class="bar"></span>
		<span class="bar"></span>
		<span class="bar"></span>
	</button>

	<div class="nav-links {isOpen ? 'active' : ''}">
		<ul>
			<li><a href="/Pages/O mnie" onclick={closeMenu}>O mnie</a></li>
			<li><a href="/Pages/Miejsca" onclick={closeMenu}>Miejsca</a></li>
			<li><a href="/Pages/Turnieje" onclick={closeMenu}>Turnieje</a></li>
			<li><a href="/Pages/Rozgrywki" onclick={closeMenu}>Rozgrywki</a></li>
			<li><a href="/Pages/Rankingi" onclick={closeMenu}>Rankingi</a></li>
			<li><a href="/Pages/Role" onclick={closeMenu}>Role i uprawnienia</a></li>
			<li><a href="/Pages/Moderacja" onclick={closeMenu}>Moderacja</a></li>
			<li><a href="/Pages/Zaproszenia" onclick={closeMenu}>Zaproszenia</a></li>
		</ul>

		{#if user}
			<form action="/?/logout" method="POST" use:enhance>
				<button type="submit" class="btn-register" onclick={closeMenu}>
					Wyloguj się
				</button>
			</form>
		{:else}
			<a href="/login" class="btn-register" onclick={closeMenu}>
				Zaloguj się
			</a>
		{/if}
	</div>
</nav>

<style>
	/* --- General Styling --- */
	nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: #333;
		color: white;
		padding: 1rem 2rem;
		position: relative;
	}

	a {
		text-decoration: none;
		color: white;
		font-size: 1.1rem;
		transition: color 0.3s;
	}

	a:hover {
		color: #ff9900;
	}

	.logo a {
		font-size: 1.5rem;
		font-weight: bold;
	}

	/* --- Navigation Links Container (Desktop) --- */
	.nav-links {
		display: flex;          /* KLUCZOWE: Ustawia listę linków i przycisk w jednej linii */
		align-items: center;    /* Wyśrodkowanie w pionie */
		gap: 2rem;              /* Odstęp między menu a przyciskiem */
	}

	/* Naprawa dla formularza, aby nie spadał do nowej linii */
	.nav-links form {
		display: flex;
		margin: 0;
	}

	ul {
		display: flex;
		gap: 1.5rem; /* Zmniejszyłem lekko gap, bo masz dużo elementów w menu */
		list-style: none;
		margin: 0;
		padding: 0;
	}

	/* --- Stylizacja przycisku Rejestracji/Wylogowania --- */
	/* Używamy :global() aby styl działał na button wewnątrz formularza */
	:global(.btn-register) {
		background-color: #2563eb;
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 1rem;
		transition: background-color 0.2s;
		white-space: nowrap;
		
		/* Reset stylów dla <button> */
		border: none;
		cursor: pointer;
		font-family: inherit;
		display: inline-block;
		text-decoration: none;
		line-height: normal;
	}

	:global(.btn-register:hover) {
		background-color: #1d4ed8;
		color: white;
		text-decoration: none;
	}

	/* --- Mobile Hamburger Button --- */
	.hamburger {
		display: none;
		flex-direction: column;
		gap: 5px;
		background: none;
		border: none;
		cursor: pointer;
	}

	.hamburger .bar {
		width: 25px;
		height: 3px;
		background-color: white;
		border-radius: 2px;
	}

	/* --- Responsive Design (Mobile) --- */
	@media (max-width: 1100px) { /* Zwiększyłem punkt łamania, bo masz dużo linków */
		.hamburger {
			display: flex;
		}

		.nav-links {
			display: none;      /* Domyślnie ukryte na mobile */
			width: 100%;
			position: absolute;
			top: 100%;
			left: 0;
			background-color: #444;
			flex-direction: column;
			align-items: center;
			padding-bottom: 1rem;
			gap: 1rem;
			z-index: 1000;      /* Żeby menu było nad treścią strony */
		}

		.nav-links.active {
			display: flex;      /* Pokaż jako flex (kolumna) gdy aktywne */
		}

		ul {
			flex-direction: column;
			width: 100%;
			gap: 0;
		}

		li {
			text-align: center;
			padding: 1rem 0;
			border-top: 1px solid #555;
		}

		li:hover {
			background-color: #555;
		}

		/* Dostosowanie przycisku na mobile */
		:global(.btn-register) {
			width: 80%;
			text-align: center;
			margin-top: 1rem;
		}
		
		/* Formularz na mobile też musi być wycentrowany */
		.nav-links form {
			width: 100%;
			justify-content: center;
		}
	}
</style>