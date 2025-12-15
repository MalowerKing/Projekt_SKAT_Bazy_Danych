<script lang="ts">
    import type { PageProps } from "./$types";

    let ranking_główny: PageProps = $props();
</script>

{#each ranking_główny.data.post as {nazwa, elo}}
    <li>{nazwa} | {elo}</li>
{/each}