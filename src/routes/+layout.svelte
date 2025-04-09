<script>
	import { Toaster } from 'svelte-french-toast';
	import '../app.css';
	import 'leaflet/dist/leaflet.css';
	import UserContext from '$lib/context/UserContext.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<title>Fleet Management</title>
</svelte:head>

<Toaster />
<div class="flex min-h-screen bg-gray-100">
	<UserContext>
		<Sidebar />
		<main class="flex-1 p-6">
			{@render children()}
		</main>
	</UserContext>
</div>
