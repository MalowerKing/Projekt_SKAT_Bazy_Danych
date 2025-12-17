<script lang="ts">
    import type { PageData } from './$types';

    export let data: PageData;
</script>

<style>
    :global(body) { font-family: sans-serif; padding: 20px; background-color: #f4f4f4; }
    
    .container {
        max-width: 800px;
        margin: 0 auto;
        background: white;
        padding: 25px;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    h1 {
        text-align: center;
        color: #333;
        margin-bottom: 20px;
        border-bottom: 2px solid #eee;
        padding-bottom: 10px;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
    }

    th, td {
        padding: 12px 15px;
        text-align: left;
        border-bottom: 1px solid #ddd;
    }

    th {
        background-color: #f8f9fa;
        color: #555;
        font-weight: 600;
        text-transform: uppercase;
        font-size: 0.85rem;
    }

    tr:hover {
        background-color: #f9f9f9;
    }

    /* Highlight the top 3 players */
    tr:nth-child(1) td:first-child { color: gold; font-weight: bold; font-size: 1.2em; }
    tr:nth-child(2) td:first-child { color: silver; font-weight: bold; font-size: 1.1em; }
    tr:nth-child(3) td:first-child { color: #cd7f32; font-weight: bold; font-size: 1.1em; } /* Bronze */

    .empty-state {
        text-align: center;
        padding: 20px;
        color: #777;
        font-style: italic;
    }
</style>

<div class="container">
    <h1>🏆 Ranking Graczy (ELO)</h1>

    {#if data.post.length === 0}
        <div class="empty-state">
            Brak graczy w bazie danych.
        </div>
    {:else}
        <table>
            <thead>
                <tr>
                    <th style="width: 60px;">#</th> <th>Nazwa Gracza</th>
                    <th style="width: 100px; text-align: right;">ELO</th>
                </tr>
            </thead>
            <tbody>
                {#each data.post as user, i}
                    <tr>
                        <td>{i + 1}</td>
                        <td>{user.nazwa}</td>
                        <td style="text-align: right; font-family: monospace; font-size: 1.1em;">
                            {user.elo}
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}
</div>