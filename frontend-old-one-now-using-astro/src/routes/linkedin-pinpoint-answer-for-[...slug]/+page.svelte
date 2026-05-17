<script lang="ts">
	import { onMount } from 'svelte';

	let { data }: { data: { targetUrl: string } } = $props();

	onMount(() => {
		// Use replace to avoid keeping this page in browser history
		window.location.replace(data.targetUrl);
	});
</script>

<svelte:head>
	<title>Redirecting to Archive...</title>
	<meta name="robots" content="noindex, follow" />
</svelte:head>

<div style="text-align: center; padding: 4rem 1rem;">
	<h1>Redirecting...</h1>
	<p style="color: #666;">Taking you to the puzzle archive. <a href="{data.targetUrl}">Click here</a> if you're not redirected automatically.</p>
</div>
