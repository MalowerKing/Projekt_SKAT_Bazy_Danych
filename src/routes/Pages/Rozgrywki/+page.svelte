<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	export let data: PageData;

	const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    let defaultDate = now.toISOString().slice(0, 16);

	let sortKey = 'data';
	let sortDirection: 'asc' | 'desc' = 'desc';
	let selectedIds: string[] = [];

	// Helper function to get the value for sorting based on the key
	function getSortValue(game: any, key: string) {
		switch (key) {
			case 'gracz1': return game.gracz1?.nazwa;
			case 'gracz2': return game.gracz2?.nazwa;
			case 'gracz3': return game.gracz3?.nazwa;
			case 'wygrany': return game.wygrany?.nazwa;
			case 'miejsce': return game.miejsce?.nazwa;
			case 'turniej': return game.turniej?.nazwa;
			case 'isRanked': return game.isRanked;
			default: return game[key];
		}
	}

	$: sortedGames = [...data.games].sort((a, b) => {
		const valA = getSortValue(a, sortKey);
		const valB = getSortValue(b, sortKey);

		if (valA === valB) return 0;
		if (valA === null || valA === undefined) return 1;
		if (valB === null || valB === undefined) return -1;

		if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
		if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
		return 0;
	});

	function handleSort(key: string) {
		if (sortKey === key) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDirection = 'asc';
		}
	}

	function toggleAll(e: Event) {
		const isChecked = (e.target as HTMLInputElement).checked;
		if (isChecked) {
			selectedIds = data.games.map((g: any) => g.graID);
		} else {
			selectedIds = [];
		}
	}
</script>

<div class="container">
	<h1>Lista Gier</h1>

	{#if selectedIds.length > 0}
		<form 
			method="POST" 
			action="?/delete" 
			use:enhance={() => {
				return async ({ update }) => {		
					await update();
					selectedIds = [];
				};
			}}
		>
			{#each selectedIds as id}
				<input type="hidden" name="ids" value={id} />
			{/each}
			<div class="actions-bar">
				<span>Zaznaczono: {selectedIds.length}</span>
				<button type="submit" class="btn-delete">Usuń zaznaczone</button>
			</div>
		</form>
	{/if}

	<div class="table-wrapper">
		<table>
			<thead>
				<tr>
					<th style="width: 40px;">
						<input
							type="checkbox"
							on:change={toggleAll}
							checked={selectedIds.length === data.games.length && data.games.length > 0}
						/>
					</th>
					<th on:click={() => handleSort('data')}>Data {sortKey === 'data' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
					<th on:click={() => handleSort('gracz1')}>Gracz 1 {sortKey === 'gracz1' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
					<th on:click={() => handleSort('gracz2')}>Gracz 2 {sortKey === 'gracz2' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
					<th on:click={() => handleSort('gracz3')}>Gracz 3 {sortKey === 'gracz3' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
					<th on:click={() => handleSort('wygrany')}>Zwycięzca {sortKey === 'wygrany' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
					<th on:click={() => handleSort('isRanked')}>Ranked {sortKey === 'isRanked' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
					<th on:click={() => handleSort('miejsce')}>Miejsce {sortKey === 'miejsce' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
					<th on:click={() => handleSort('turniej')}>Turniej {sortKey === 'turniej' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
				</tr>
			</thead>
			<tbody>
				{#each sortedGames as game (game.graID)}
					<tr class:selected={selectedIds.includes(game.graID)}>
						<td>
							<input type="checkbox" bind:group={selectedIds} value={game.graID} />
						</td>
						<td>{new Date(game.data).toLocaleString('pl-PL')}</td>
						<td>{game.gracz1?.nazwa ?? 'Błąd ID'}</td>
						<td>{game.gracz2?.nazwa ?? 'Błąd ID'}</td>
						<td>{game.gracz3?.nazwa ?? '-'}</td>
						<td><strong>{game.wygrany?.nazwa ?? 'Nieznany'}</strong></td>
						<td>{game.isRanked ? 'Tak' : 'Nie'}</td>
						<td>{game.miejsce?.nazwa ?? '-'}</td>
						<td>{game.turniej?.nazwa ?? '-'}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<div class="add-game-section">
		<h2>Dodaj nową grę</h2>
		<form method="post" action="?/addGame" use:enhance class="game-form">
			<div class="form-grid">
                <div class="form-group">
					<label for="gracz1">Gracz 1</label>
					<input type="text" name="gracz1" id="gracz1" placeholder="Nazwa gracza 1" required>
				</div>
				
				<div class="form-group">
					<label for="gracz2">Gracz 2</label>
					<input type="text" name="gracz2" id="gracz2" placeholder="Nazwa gracza 2" required>
				</div>
				
				<div class="form-group">
					<label for="gracz3">Gracz 3 (opcjonalne)</label>
					<input type="text" name="gracz3" id="gracz3" placeholder="Nazwa gracza 3">
				</div>
				
				<div class="form-group">
					<label for="zwyciezca">Zwycięzca</label>
					<input type="text" name="zwyciezca" id="zwyciezca" placeholder="Nazwa zwycięzcy" required>
				</div>
				
				<div class="form-group">
					<label for="miejsce">Miejsce</label>
					<input type="text" name="miejsceNazwa" id="miejsce" placeholder="Nazwa miejsca">
				</div>
				
				<div class="form-group">
					<label for="turniej">Turniej</label>
					<input type="text" name="TurniejNazwa" id="turniej" placeholder="Nazwa turnieju">
				</div>

                <div class="form-group">
					<label for="data">Data rozgrywki</label>
                    <input 
                        type="date" 
                        name="data" 
                        id="data" 
                        bind:value={defaultDate} 
                        required
                    >
				</div>
            </div>

			<div class="form-footer">
				<div class="checkbox-group">
					<input type="checkbox" name="isRanked" id="isRanked">
					<label for="isRanked">Gra rankingowa (zmienia ELO)</label>
				</div>
				<button type="submit" class="btn-add">Dodaj grę</button>
			</div>
		</form>
	</div>
</div>

<style>
	.container {
		padding: 20px;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		max-width: 1200px;
		margin: 0 auto;
	}

	h1, h2 {
		color: #333;
	}

	/* --- Style Formularza Usuwania --- */
	.actions-bar {
		background-color: #ffebee;
		padding: 10px 15px;
		margin-bottom: 15px;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border: 1px solid #ffcdd2;
		color: #b71c1c;
		font-weight: 500;
	}

	.btn-delete {
		background-color: #ef5350;
		color: white;
		border: none;
		padding: 8px 16px;
		border-radius: 4px;
		cursor: pointer;
		font-weight: bold;
		transition: background 0.2s;
	}

	.btn-delete:hover {
		background-color: #d32f2f;
	}

	/* --- Style Tabeli --- */
	.table-wrapper {
		overflow-x: auto;
		box-shadow: 0 2px 8px rgba(0,0,0,0.1);
		border-radius: 8px;
		background: white;
		margin-bottom: 40px;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}

	th, td {
		padding: 12px 15px;
		text-align: left;
		border-bottom: 1px solid #eee;
	}

	th {
		background-color: #f8f9fa;
		cursor: pointer;
		user-select: none;
		font-weight: 600;
		color: #444;
	}

	th:hover {
		background-color: #e9ecef;
	}

	tr:hover {
		background-color: #f8f9fa;
	}

	tr.selected {
		background-color: #e3f2fd;
	}

	.add-game-section {
		background-color: #fff;
		padding: 25px;
		border-radius: 8px;
		box-shadow: 0 2px 12px rgba(0,0,0,0.08);
		border: 1px solid #eee;
	}

	.game-form {
		margin-top: 15px;
	}

	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px;
		margin-bottom: 20px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
	}

	.form-group label {
		margin-bottom: 6px;
		font-weight: 500;
		font-size: 0.9rem;
		color: #555;
	}

	.form-group input {
		padding: 10px;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	.form-group input:focus {
		border-color: #2196f3;
		outline: none;
		box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
	}

	.form-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 20px;
		border-top: 1px solid #eee;
	}

	.checkbox-group {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
	}
	
	.checkbox-group input {
		width: 18px;
		height: 18px;
		cursor: pointer;
	}

	.checkbox-group label {
		cursor: pointer;
		user-select: none;
		font-weight: 500;
	}

	.btn-add {
		background-color: #4caf50;
		color: white;
		border: none;
		padding: 10px 24px;
		border-radius: 4px;
		cursor: pointer;
		font-weight: bold;
		font-size: 1rem;
		transition: background 0.2s;
	}

	.btn-add:hover {
		background-color: #388e3c;
	}

	@media (max-width: 768px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
		
		.form-footer {
			flex-direction: column;
			gap: 15px;
			align-items: stretch;
		}
		
		.btn-add {
			width: 100%;
		}
	}
</style>