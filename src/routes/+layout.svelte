<script lang="ts">
    import './layout.css';
    import favicon from '$lib/assets/favicon.svg';

    import Navbar from './components/Navbar.svelte';
    import type { PageData } from './$types';
    import type { Snippet } from 'svelte'; // Opcjonalne: do typowania children

    let { data, children }: { data: PageData, children: Snippet } = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

<main>
    <Navbar user={data.user}/>
    
    {@render children()}
</main>