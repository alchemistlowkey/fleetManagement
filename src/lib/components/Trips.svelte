<script>
	import { getContext } from 'svelte';
	import axios from 'axios';
	import toast from 'svelte-french-toast';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { getGoogleMapsLoader } from '$lib/config/google-maps';

	const { appState } = getContext('appState');

	let trips = $state([]);
	let mapInstances = $state({});
	let mapsReady = $state(false);

	$effect(() => {
		if (!appState.user.isLoggedIn) {
			toast.error('Please log in to view trips');
			if (browser) goto('/login');
		} else {
			fetchTrips();
		}
	});

	$effect(() => {
		if (browser && trips.length > 0 && mapsReady) {
			initializeMaps();
		}
	});

	async function fetchTrips() {
		appState.user.isLoading = true;
		try {
			const { data } = await axios.get('/api/trips', {
				headers: { Authorization: `Bearer ${appState.user.token}` }
			});
			if (data.success) {
				trips = Array.isArray(data.trips)
					? await Promise.all(
							data.trips.map(async (trip) => {
								return {
									...trip,
									startAddress: await geocodeLatLng(trip.startLocation),
									endAddress: await geocodeLatLng(trip.endLocation)
								};
							})
						)
					: [];
			} else {
				toast.error(data.message || 'Failed to fetch trips');
				trips = [];
			}
		} catch (error) {
			console.error('Fetch trips error:', error.response?.data || error.message);
			toast.error(error.response?.data?.message || 'Failed to fetch trips');
			trips = [];
		} finally {
			appState.user.isLoading = false;
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

	async function deleteTrip(id) {
		if (!confirm('Are you sure you want to delete this trip?')) return;
		try {
			const { data } = await axios.delete(`/api/trips/${id}`, {
				headers: { Authorization: `Bearer ${appState.user.token}` }
			});
			if (data.success) {
				toast.success('Trip deleted successfully');
				trips = trips.filter((t) => t._id !== id);
				if (mapInstances[id]) mapInstances[id] = null;
			} else {
				toast.error(data.message);
				if (data.message === 'Trip not found') await fetchTrips();
			}
		} catch (error) {
			console.error('Delete trip error:', error.response?.data || error.message);
			const errorMessage = error.response?.data?.message || 'Failed to delete trip';
			toast.error(errorMessage);
			if (errorMessage === 'Trip not found') await fetchTrips();
		}
	}

	async function initializeMaps() {
		if (!browser || !Array.isArray(trips) || trips.length === 0) return;

		const loader = await getGoogleMapsLoader();
		if (!loader) return;

		try {
			const google = await loader.load();
			trips.forEach((trip) => {
				const mapId = `map-${trip._id}`;
				const mapElement = document.getElementById(mapId);
				if (!mapElement) {
					console.error(`Map element not found for trip ${trip._id}`);
					return;
				}
				const map = new google.maps.Map(mapElement, {
					center: { lat: trip.startLocation.lat, lng: trip.startLocation.lng },
					zoom: 13
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

				const request = {
					origin: { lat: trip.startLocation.lat, lng: trip.startLocation.lng },
					destination: { lat: trip.endLocation.lat, lng: trip.endLocation.lng },
					travelMode: 'DRIVING'
				};
				directionsService.route(request, (result, status) => {
					if (status === 'OK') {
						directionsRenderer.setDirections(result);
					} else {
						console.error(`Directions request failed for trip ${trip._id}:`, status);
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
				});

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

	onMount(() => {
		mapsReady = true;
	});
</script>

<div class="container mx-auto md:p-6 text-xs md:text-base">
	<h1 class="mb-6 text-3xl font-bold text-gray-800">Trips</h1>
	{#if appState.user.isLoading}
		<div class="flex justify-center">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"
			></div>
		</div>
	{:else if !Array.isArray(trips) || trips.length === 0}
		<p class="text-center text-gray-500">No trips found.</p>
	{:else}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each trips as trip (trip._id)}
				<div
					class="trip-card relative rounded-lg border border-amber-400 bg-white p-4 shadow-md hover:scale-105 hover:shadow-lg hover:transition-all"
				>
					<div class="content">
						<h2 class="text-xl font-semibold text-blue-600">
							{trip.vehicle?.plateNumber || 'Unknown Vehicle'} - {trip.driver?.driverName ||
								'Unknown Driver'}
						</h2>
						<p class="text-gray-700">
							<strong>Start:</strong>
							{new Date(trip.startTime).toLocaleString()}
						</p>
						<p class="text-gray-700">
							<strong>End:</strong>
							{new Date(trip.endTime).toLocaleString()}
						</p>
						<p class="py-2 text-cyan-700">
							<strong>From:</strong>
							{trip.startAddress || 'Loading address...'}
						</p>
						<p class="py-2 text-fuchsia-700">
							<strong>To:</strong>
							{trip.endAddress || 'Loading address...'}
						</p>
						<p class="text-gray-700"><strong>Status:</strong> {trip.status}</p>
						<p class="text-gray-700"><strong>Distance:</strong> {trip.distance || 'N/A'} km</p>
						<div id="map-{trip._id}" class="trip-map mt-2 h-48 w-full"></div>
					</div>
					{#if appState.user.role === 'Admin'}
						<div class="button-container absolute right-0 bottom-0 left-0 bg-white p-4">
							<div class="flex justify-center gap-2">
								<button
									onclick={() => {
										if (browser) goto(`/trips/edit/${trip._id}`);
									}}
									class="w-20 rounded bg-sky-400 p-2 text-white hover:bg-lime-800"
								>
									Edit
								</button>
								<button
									onclick={() => deleteTrip(trip._id)}
									class="w-20 rounded bg-rose-400 p-2 text-white hover:bg-teal-800"
								>
									Delete
								</button>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.trip-map {
		height: 200px;
	}

	.trip-card {
		position: relative;
		min-height: 400px;
		padding-bottom: 60px;
	}

	.content {
		position: relative;
	}

	.button-container {
		border-top: 1px solid #e5e7eb;
	}
</style>
