<script>
	let { 
		title = "Wymagane logowanie", 
		description = "Aby zobaczyć tę zawartość, musisz być zalogowany w systemie." 
	} = $props();
</script>

<div class="info-container">
	<div class="info-box">
		<div class="icon-wrapper">
			<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
				<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
			</svg>
		</div>

		<h3>{title}</h3>
		<p>{description}</p>
	</div>
</div>

<style>
	/* Kontener centrujący */
	.info-container {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 2rem;
		width: 100%;
		height: 100%; /* Dopasuj do rodzica */
		min-height: 200px;
	}

	/* Pudełko z informacją */
	.info-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		background-color: #fff;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 2rem;
		max-width: 400px;
		/* Delikatny cień dla głębi */
		box-shadow: 0 1px 3px rgba(0,0,0,0.05);
	}

	.icon-wrapper {
		margin-bottom: 1rem;
		color: #9ca3af; /* Szary kolor ikony */
		background-color: #f3f4f6;
		padding: 12px;
		border-radius: 50%;
		display: inline-flex;
	}

	h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
		font-family: sans-serif;
	}

	p {
		margin: 0;
		font-size: 0.95rem;
		color: #6b7280;
		line-height: 1.5;
		font-family: sans-serif;
	}
</style>