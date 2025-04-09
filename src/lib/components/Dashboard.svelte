<script>
	import { getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	const { appState, fetchGlobalData, initializeTripMap } = getContext('appState');

	let stats = $state({
		totalDrivers: 0,
		totalVehicles: 0,
		activeTrips: 0,
		availableVehicles: 0
	});
	let recentTrips = $state([]);
	let unassignedVehicles = $state([]);
	let activeDrivers = $state([]);
	let searchQuery = $state('');
	let filteredDrivers = $state([]);
	let filteredVehicles = $state([]);

	$effect(() => {
		if (!appState.user.isLoggedIn) {
			toast.error('Please log in to view dashboard');
			goto('/login');
		} else {
			fetchGlobalData().then(updateDashboard);
		}
	});

	$effect(() => {
		if (recentTrips.length > 0 && appState.mapsReady) {
			recentTrips.forEach((trip) => {
				const mapElement = document.getElementById(`dashboard-map-${trip._id}`);
				if (mapElement && !appState.mapInstances[trip._id]) {
					initializeTripMap(trip._id, mapElement);
				}
			});
		}
	});

	$effect(() => {
		filterData();
	});

	function updateDashboard() {
		stats.totalDrivers = appState.drivers.length;
		stats.totalVehicles = appState.vehicles.length;
		stats.availableVehicles = appState.vehicles.filter((v) => !v.assignedDriver).length;
		stats.activeTrips = appState.trips.filter((t) => t.status === 'active').length;

		activeDrivers = appState.drivers
			.filter((d) => d.status === 'active' && d.assignedVehicle)
			.slice(0, 5);
		unassignedVehicles = appState.vehicles.filter((v) => !v.assignedDriver).slice(0, 5);
		recentTrips = appState.trips
			.sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
			.slice(0, 5);

		filteredDrivers = activeDrivers;
		filteredVehicles = unassignedVehicles;
	}

	function filterData() {
		if (!searchQuery) {
			filteredDrivers = activeDrivers;
			filteredVehicles = unassignedVehicles;
		} else {
			const query = searchQuery.toLowerCase();
			filteredDrivers = activeDrivers.filter(
				(d) =>
					d.driverName.toLowerCase().includes(query) ||
					d.assignedVehicle?.plateNumber?.toLowerCase().includes(query)
			);
			filteredVehicles = unassignedVehicles.filter(
				(v) =>
					v.plateNumber.toLowerCase().includes(query) ||
					v.make.toLowerCase().includes(query) ||
					v.model.toLowerCase().includes(query)
			);
		}
	}

	function navigateTo(page) {
		goto(page);
	}
</script>

<div class="container mx-auto p-6">
	<h1 class="mb-6 text-3xl font-bold text-gray-800">Dashboard</h1>

	{#if appState.user.isLoading}
		<div class="flex h-64 items-center justify-center">
			<div
				class="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"
			></div>
		</div>
	{:else}
		<!-- Search Bar -->
		<div class="mb-6">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search drivers or vehicles..."
				class="w-full rounded-lg border border-amber-400 p-2 shadow-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</div>

		<!-- Stats Overview -->
		<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
			<button
				class="cursor-pointer rounded-lg border border-amber-400 bg-white p-6 shadow-md transition-all hover:scale-105"
				onclick={() => navigateTo('/drivers')}
			>
				<h2 class="text-xl font-semibold text-blue-600">Total Drivers</h2>
				<p class="mt-2 text-3xl font-bold text-gray-700">{stats.totalDrivers}</p>
				<p class="text-sm text-gray-500">Active: {activeDrivers.length}</p>
			</button>
			<button
				class="cursor-pointer rounded-lg border border-amber-400 bg-white p-6 shadow-md transition-all hover:scale-105"
				onclick={() => navigateTo('/vehicles')}
			>
				<h2 class="text-xl font-semibold text-blue-600">Total Vehicles</h2>
				<p class="mt-2 text-3xl font-bold text-gray-700">{stats.totalVehicles}</p>
				<p class="text-sm text-gray-500">Available: {stats.availableVehicles}</p>
			</button>
			<button
				class="cursor-pointer rounded-lg border border-amber-400 bg-white p-6 shadow-md transition-all hover:scale-105"
				onclick={() => navigateTo('/trips')}
			>
				<h2 class="text-xl font-semibold text-blue-600">Active Trips</h2>
				<p class="mt-2 text-3xl font-bold text-gray-700">{stats.activeTrips}</p>
				<p class="text-sm text-gray-500">Recent: {recentTrips.length}</p>
			</button>
			{#if appState.user.role === 'Admin'}
				<div class="rounded-lg border border-amber-400 bg-white p-6 shadow-md">
					<h2 class="text-xl font-semibold text-blue-600">Quick Actions</h2>
					<div class="mt-2 space-y-2">
						<button
							onclick={() => navigateTo('/drivers/add')}
							class="w-full rounded bg-sky-400 p-2 text-white hover:bg-lime-800"
						>
							Add Driver
						</button>
						<button
							onclick={() => navigateTo('/vehicles/add')}
							class="w-full rounded bg-sky-400 p-2 text-white hover:bg-lime-800"
						>
							Add Vehicle
						</button>
					</div>
				</div>
			{/if}
		</div>

		<!-- Main Content Grid -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Unassigned Vehicles -->
			<div class="rounded-lg border border-amber-400 bg-white p-6 shadow-md">
				<h2 class="mb-4 text-xl font-semibold text-blue-600">Unassigned Vehicles</h2>
				{#if filteredVehicles.length === 0}
					<p class="text-gray-500">No unassigned vehicles</p>
				{:else}
					<div class="space-y-4">
						{#each filteredVehicles as vehicle}
							<div class="flex items-center justify-between border-b pb-2">
								<div>
									<p class="font-medium text-gray-700">{vehicle.plateNumber}</p>
									<p class="text-sm text-gray-500">
										{vehicle.make}
										{vehicle.model} ({vehicle.year})
									</p>
								</div>
								{#if appState.user.role === 'Admin'}
									<button
										onclick={() => navigateTo('/vehicles')}
										class="text-sky-400 hover:text-lime-800"
									>
										Assign
									</button>
								{/if}
							</div>
						{/each}
					</div>
					<button
						onclick={() => navigateTo('/vehicles')}
						class="mt-4 text-blue-600 hover:underline"
					>
						View All Vehicles
					</button>
				{/if}
			</div>

			<!-- Active Drivers -->
			<div class="rounded-lg border border-amber-400 bg-white p-6 shadow-md">
				<h2 class="mb-4 text-xl font-semibold text-blue-600">Active Drivers</h2>
				{#if filteredDrivers.length === 0}
					<p class="text-gray-500">No active drivers</p>
				{:else}
					<div class="space-y-4">
						{#each filteredDrivers as driver}
							<div class="flex items-center justify-between border-b pb-2">
								<div>
									<p class="font-medium text-gray-700">{driver.driverName}</p>
									<p class="text-sm text-gray-500">
										{driver.assignedVehicle?.plateNumber || 'No Vehicle'}
									</p>
								</div>
								{#if appState.user.role === 'Admin'}
									<button
										onclick={() => navigateTo(`/drivers/edit/${driver._id}`)}
										class="text-sky-400 hover:text-lime-800"
									>
										Manage
									</button>
								{/if}
							</div>
						{/each}
					</div>
					<button onclick={() => navigateTo('/drivers')} class="mt-4 text-blue-600 hover:underline">
						View All Drivers
					</button>
				{/if}
			</div>
		</div>

		<!-- Recent Trips -->
		<div class="my-6">
			<h2 class="mb-4 text-xl font-semibold text-blue-600">Recent Trips</h2>
			{#if recentTrips.length === 0}
				<p class="text-gray-500">No recent trips</p>
			{:else}
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
					{#each recentTrips as trip}
						<div class="rounded-lg border border-amber-400 bg-white p-4 shadow-md">
							<h3 class="font-medium text-blue-600">
								{trip.vehicle?.plateNumber || 'Unknown Vehicle'} -
								{trip.driver?.driverName || 'Unknown Driver'}
							</h3>
							<p class="mt-1 text-sm text-gray-700">
								<strong>Start:</strong>
								{new Date(trip.startTime).toLocaleString()}
							</p>
							<p class="text-sm text-gray-700">
								<strong>End:</strong>
								{trip.status === 'active' ? 'In Progress' : new Date(trip.endTime).toLocaleString()}
							</p>
							<p class="mt-2 text-sm text-cyan-700">
								<strong>From:</strong>
								{trip.startAddress || 'Loading address...'}
							</p>
							<p class="my-2 text-sm text-fuchsia-700">
								<strong>To:</strong>
								{trip.endAddress || 'Loading address...'}
							</p>
							<div id="dashboard-map-{trip._id}" class="trip-map mt-2 h-32 w-full rounded"></div>
							{#if appState.user.role === 'Admin'}
								<div class="mt-2 flex justify-between">
									<button
										onclick={() => navigateTo(`/trips/edit/${trip._id}`)}
										class="text-sm text-sky-400 hover:text-lime-800"
									>
										Edit
									</button>
									<button
										onclick={() => navigateTo('/trips')}
										class="text-sm text-blue-600 hover:underline"
									>
										View Details
									</button>
								</div>
							{/if}
						</div>
					{/each}
				</div>
				<div class="flex justify-center">
					<button onclick={() => navigateTo('/trips')} class="mt-4 text-blue-600 hover:underline">
						View All Trips
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.trip-map {
		height: 128px;
		border-radius: 0.5rem;
	}
</style>
