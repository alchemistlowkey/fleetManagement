<script>
	import { getContext } from 'svelte';
	import axios from 'axios';
	import toast from 'svelte-french-toast';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { getGoogleMapsLoader } from '$lib/config/google-maps';

	const { userState } = getContext('userState');

	let stats = $state({
		totalDrivers: 0,
		totalVehicles: 0,
		activeTrips: 0,
		availableVehicles: 0
	});
	let recentTrips = $state([]);
	let unassignedVehicles = $state([]);
	let activeDrivers = $state([]);
	let mapInstances = $state({});
	let mapsReady = $state(false);
	let searchQuery = $state('');
	let filteredDrivers = $state([]);
	let filteredVehicles = $state([]);

	$effect(() => {
		if (!userState.isLoggedIn) {
			toast.error('Please log in to view dashboard');
			goto('/login');
		} else {
			fetchDashboardData();
		}
	});

	$effect(() => {
		if (browser && recentTrips.length > 0 && mapsReady) {
			initializeTripMaps();
		}
	});

	$effect(() => {
		filterData();
	});

	async function fetchDashboardData() {
		userState.isLoading = true;
		try {
			const [driversRes, vehiclesRes, tripsRes] = await Promise.all([
				axios.get('/api/drivers', { headers: { Authorization: `Bearer ${userState.token}` } }),
				axios.get('/api/vehicles', { headers: { Authorization: `Bearer ${userState.token}` } }),
				axios.get('/api/trips', { headers: { Authorization: `Bearer ${userState.token}` } })
			]);

			if (driversRes.data.success) {
				stats.totalDrivers = driversRes.data.drivers.length;
				activeDrivers = driversRes.data.drivers
					.filter((d) => d.status === 'active' && d.assignedVehicle)
					.slice(0, 5);
				filteredDrivers = driversRes.data.drivers;
			}

			if (vehiclesRes.data.success) {
				stats.totalVehicles = vehiclesRes.data.vehicles.length;
				stats.availableVehicles = vehiclesRes.data.vehicles.filter((v) => !v.assignedDriver).length;
				unassignedVehicles = vehiclesRes.data.vehicles.filter((v) => !v.assignedDriver).slice(0, 5);
				filteredVehicles = vehiclesRes.data.vehicles;
			}

			if (tripsRes.data.success) {
				stats.activeTrips = tripsRes.data.trips.filter((t) => t.status === 'active').length;
				const sortedTrips = tripsRes.data.trips.sort(
					(a, b) => new Date(b.startTime) - new Date(a.startTime)
				);
				recentTrips = await Promise.all(
					sortedTrips.slice(0, 5).map(async (trip) => ({
						...trip,
						startAddress: await geocodeLatLng(trip.startLocation),
						endAddress: await geocodeLatLng(trip.endLocation)
					}))
				);
			}
		} catch (error) {
			toast.error('Failed to load dashboard data');
			console.error(error);
		} finally {
			userState.isLoading = false;
		}
	}

	async function geocodeLatLng(location) {
		if (!browser || !location?.lat || !location?.lng) return 'Unknown Location';
		try {
			const loader = await getGoogleMapsLoader();
			const google = await loader.load();
			const geocoder = new google.maps.Geocoder();
			return new Promise((resolve) => {
				geocoder.geocode(
					{ location: { lat: location.lat, lng: location.lng } },
					(results, status) => {
						if (status === 'OK' && results[0]) {
							resolve(results[0].formatted_address);
						} else {
							resolve('Unknown Location');
						}
					}
				);
			});
		} catch (error) {
			console.error('Geocoding error:', error);
			return 'Unknown Location';
		}
	}

	async function initializeTripMaps() {
		if (!browser || !Array.isArray(recentTrips) || recentTrips.length === 0) return;
		const loader = await getGoogleMapsLoader();
		if (!loader) return;
		try {
			const google = await loader.load();
			recentTrips.forEach((trip) => {
				const mapId = `dashboard-map-${trip._id}`;
				const mapElement = document.getElementById(mapId);
				if (!mapElement) return;
				const map = new google.maps.Map(mapElement, {
					center: { lat: trip.startLocation.lat, lng: trip.startLocation.lng },
					zoom: 13,
					disableDefaultUI: true
				});
				const startMarker = new google.maps.Marker({
					position: { lat: trip.startLocation.lat, lng: trip.startLocation.lng },
					map,
					title: trip.startAddress || 'Start',
					icon: { url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' }
				});
				const endMarker = new google.maps.Marker({
					position: { lat: trip.endLocation.lat, lng: trip.endLocation.lng },
					map,
					title: trip.endAddress || 'End',
					icon: { url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }
				});
				const directionsService = new google.maps.DirectionsService();
				const directionsRenderer = new google.maps.DirectionsRenderer();
				directionsRenderer.setMap(map);
				directionsService.route(
					{
						origin: { lat: trip.startLocation.lat, lng: trip.startLocation.lng },
						destination: { lat: trip.endLocation.lat, lng: trip.endLocation.lng },
						travelMode: 'DRIVING'
					},
					(result, status) => {
						if (status === 'OK') {
							directionsRenderer.setDirections(result);
						} else {
							new google.maps.Polyline({
								path: [
									{ lat: trip.startLocation.lat, lng: trip.startLocation.lng },
									{ lat: trip.endLocation.lat, lng: trip.endLocation.lng }
								],
								geodesic: true,
								strokeColor: '#0000FF',
								strokeOpacity: 1.0,
								strokeWeight: 2
							}).setMap(map);
						}
					}
				);
				const bounds = new google.maps.LatLngBounds();
				bounds.extend({ lat: trip.startLocation.lat, lng: trip.startLocation.lng });
				bounds.extend({ lat: trip.endLocation.lat, lng: trip.endLocation.lng });
				map.fitBounds(bounds);
				mapInstances[trip._id] = map;
			});
		} catch (error) {
			console.error('Failed to initialize Google Maps:', error);
			toast.error('Failed to load maps');
		}
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

	onMount(() => {
		mapsReady = true;
	});
</script>

<div class="container mx-auto p-6">
	<h1 class="mb-6 text-3xl font-bold text-gray-800">Dashboard</h1>

	{#if userState.isLoading}
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
			{#if userState.role === 'Admin'}
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
								{#if userState.role === 'Admin'}
									<button
										onclick={() => navigateTo(`/vehicles`)}
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
								{#if userState.role === 'Admin'}
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
							{#if userState.role === 'Admin'}
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
