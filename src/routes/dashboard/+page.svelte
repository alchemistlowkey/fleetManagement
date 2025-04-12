<script>
	import Dashboard from '$lib/components/Dashboard.svelte';

	export let title = 'FleetSync: Manage Drivers, Vehicles & Trips';
	export let description =
		"Monitor and manage drivers, vehicles, and trips with FleetSync's intuitive dashboard. Track active trips, assign vehicles, and optimize logistics efficiently.";
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href="https://fleet-management-inky.vercel.app/dashboard" />
	<meta name="image" content="https://fleet-management-inky.vercel.app/logo.png" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content="https://fleet-management-inky.vercel.app/dashboard" />
	<meta property="og:type" content="website" />
	<meta property="og:image" content="https://fleet-management-inky.vercel.app/logo.png" />
</svelte:head>

<Dashboard />
