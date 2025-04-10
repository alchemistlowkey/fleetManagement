<script>
	import { getContext } from 'svelte';
	import axios from 'axios';
	import toast from 'svelte-french-toast';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { getGoogleMapsLoader } from '$lib/config/google-maps';

	const { appState } = getContext('appState');

	let formData = $state({
		vehicle: '',
		driver: '',
		startLocation: { lat: '', lng: '' },
		endLocation: { lat: '', lng: '' },
		distance: '',
		startTime: '',
		endTime: '',
		status: 'scheduled'
	});
	let vehicles = $state([]);
	let drivers = $state([]);
	let map = null;
	let startMarker = null;
	let endMarker = null;
	let directionsService = null;
	let directionsRenderer = null;
	let mapInitialized = $state(false);

	const now = new Date();
	const todayMin = $state(new Date(now.setSeconds(0, 0)).toISOString().slice(0, 16));

	$effect(() => {
		if (!appState.user.isLoggedIn || appState.user.role !== 'Admin') {
			toast.error('You must be an Admin to access this page');
			if (browser) goto('/login');
		} else {
			fetchTripAndOptions();
		}
	});

	// Ensure endTime is not before startTime
	$effect(() => {
		if (formData.startTime && formData.endTime && formData.endTime < formData.startTime) {
			formData.endTime = formData.startTime; // Reset endTime if it's before startTime
		}
	});

	async function fetchTripAndOptions() {
		appState.user.isLoading = true;
		try {
			const [tripResponse, vehiclesResponse, driversResponse] = await Promise.all([
				axios.get(`/api/trips/${$page.params.id}`, {
					headers: { Authorization: `Bearer ${appState.user.token}` }
				}),
				axios.get('/api/vehicles', { headers: { Authorization: `Bearer ${appState.user.token}` } }),
				axios.get('/api/drivers', { headers: { Authorization: `Bearer ${appState.user.token}` } })
			]);

			if (tripResponse.data.success) {
				formData = {
					...tripResponse.data.trip,
					startLocation: {
						lat: tripResponse.data.trip.startLocation.lat,
						lng: tripResponse.data.trip.startLocation.lng
					},
					endLocation: {
						lat: tripResponse.data.trip.endLocation.lat,
						lng: tripResponse.data.trip.endLocation.lng
					},
					distance: tripResponse.data.trip.distance || '',
					startTime: new Date(tripResponse.data.trip.startTime).toISOString().slice(0, 16),
					endTime: new Date(tripResponse.data.trip.endTime).toISOString().slice(0, 16)
				};
			} else {
				toast.error(tripResponse.data.message || 'Failed to load trip');
			}
			vehicles = vehiclesResponse.data.vehicles || [];
			drivers = driversResponse.data.drivers || [];
		} catch (error) {
			console.error('Fetch error:', error.response?.data || error.message);
			toast.error('Failed to load trip data');
		} finally {
			appState.user.isLoading = false;
		}
	}

	async function updateTrip(event) {
		event.preventDefault();
		appState.user.isLoading = true;

		const submissionData = {
			vehicle: formData.vehicle,
			driver: formData.driver,
			startLocation: {
				lat: parseFloat(formData.startLocation.lat),
				lng: parseFloat(formData.startLocation.lng)
			},
			endLocation: {
				lat: parseFloat(formData.endLocation.lat),
				lng: parseFloat(formData.endLocation.lng)
			},
			distance: parseFloat(formData.distance) || 0,
			startTime: new Date(formData.startTime).toISOString(),
			endTime: new Date(formData.endTime).toISOString(),
			status: formData.status
		};

		try {
			const { data } = await axios.put(`/api/trips/${$page.params.id}`, submissionData, {
				headers: {
					Authorization: `Bearer ${appState.user.token}`,
					'Content-Type': 'application/json'
				}
			});
			if (data.success) {
				toast.success('Trip updated successfully');
				if (browser) goto('/trips');
			} else {
				toast.error(data.message || 'Failed to update trip');
			}
		} catch (error) {
			console.error('Update trip error:', error.response?.data || error.message);
			toast.error(error.response?.data?.message || 'Failed to update trip');
		} finally {
			appState.user.isLoading = false;
		}
	}

	function calculateAndDisplayRoute() {
		if (!formData.startLocation.lat || !formData.endLocation.lat || !directionsService) return;

		const request = {
			origin: {
				lat: parseFloat(formData.startLocation.lat),
				lng: parseFloat(formData.startLocation.lng)
			},
			destination: {
				lat: parseFloat(formData.endLocation.lat),
				lng: parseFloat(formData.endLocation.lng)
			},
			travelMode: 'DRIVING'
		};

		directionsService.route(request, (result, status) => {
			if (status === 'OK') {
				directionsRenderer.setDirections(result);
				const distanceInMeters = result.routes[0].legs[0].distance.value;
				formData.distance = (distanceInMeters / 1000).toFixed(2);
			} else {
				console.error('Directions request failed:', status);
				toast.error('Failed to calculate route');
			}
		});
	}

	async function initializeMap() {
		if (!browser || mapInitialized) return;

		const loader = await getGoogleMapsLoader();
		if (!loader) return;

		try {
			const google = await loader.load();
			const mapOptions = {
				center: formData.startLocation.lat
					? {
							lat: parseFloat(formData.startLocation.lat),
							lng: parseFloat(formData.startLocation.lng)
						}
					: { lat: 51.505, lng: -0.09 },
				zoom: 13
			};
			const mapElement = document.getElementById('location-map');
			if (!mapElement) {
				console.error('Map element not found');
				return;
			}
			map = new google.maps.Map(mapElement, mapOptions);
			directionsService = new google.maps.DirectionsService();
			directionsRenderer = new google.maps.DirectionsRenderer();
			directionsRenderer.setMap(map);

			let settingStart = true;
			map.addListener('click', (e) => {
				const lat = e.latLng.lat();
				const lng = e.latLng.lng();
				if (settingStart) {
					formData.startLocation = { lat, lng };
					if (startMarker) startMarker.setMap(null);
					startMarker = new google.maps.Marker({
						position: { lat, lng },
						map,
						title: 'Start',
						icon: { url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' }
					});
				} else {
					formData.endLocation = { lat, lng };
					if (endMarker) endMarker.setMap(null);
					endMarker = new google.maps.Marker({
						position: { lat, lng },
						map,
						title: 'End',
						icon: { url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }
					});
					calculateAndDisplayRoute();
				}
				settingStart = !settingStart;
			});

			if (formData.startLocation.lat && formData.startLocation.lng) {
				startMarker = new google.maps.Marker({
					position: {
						lat: parseFloat(formData.startLocation.lat),
						lng: parseFloat(formData.startLocation.lng)
					},
					map,
					title: 'Start',
					icon: { url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' }
				});
			}
			if (formData.endLocation.lat && formData.endLocation.lng) {
				endMarker = new google.maps.Marker({
					position: {
						lat: parseFloat(formData.endLocation.lat),
						lng: parseFloat(formData.endLocation.lng)
					},
					map,
					title: 'End',
					icon: { url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }
				});
				calculateAndDisplayRoute();
			}

			const startInput = document.getElementById('start-search');
			const startAutocomplete = new google.maps.places.Autocomplete(startInput);
			startAutocomplete.bindTo('bounds', map);
			startAutocomplete.addListener('place_changed', () => {
				const place = startAutocomplete.getPlace();
				if (!place.geometry) {
					toast.error('Start location not found');
					return;
				}
				const lat = place.geometry.location.lat();
				const lng = place.geometry.location.lng();
				formData.startLocation = { lat, lng };
				if (startMarker) startMarker.setMap(null);
				startMarker = new google.maps.Marker({
					position: { lat, lng },
					map,
					title: 'Start',
					icon: { url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' }
				});
				map.setCenter({ lat, lng });
				if (formData.endLocation.lat) calculateAndDisplayRoute();
			});

			const endInput = document.getElementById('end-search');
			const endAutocomplete = new google.maps.places.Autocomplete(endInput);
			endAutocomplete.bindTo('bounds', map);
			endAutocomplete.addListener('place_changed', () => {
				const place = endAutocomplete.getPlace();
				if (!place.geometry) {
					toast.error('End location not found');
					return;
				}
				const lat = place.geometry.location.lat();
				const lng = place.geometry.location.lng();
				formData.endLocation = { lat, lng };
				if (endMarker) endMarker.setMap(null);
				endMarker = new google.maps.Marker({
					position: { lat, lng },
					map,
					title: 'End',
					icon: { url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }
				});
				map.setCenter({ lat, lng });
				if (formData.startLocation.lat) calculateAndDisplayRoute();
			});

			mapInitialized = true;
		} catch (error) {
			console.error('Failed to load Google Maps:', error);
			toast.error('Failed to load map');
		}
	}

	onMount(() => {
		if (browser && !appState.user.isLoading) {
			initializeMap();
		}
	});

	$effect(() => {
		if (!appState.user.isLoading && formData.vehicle && browser && !mapInitialized) {
			initializeMap();
		}
	});
</script>

<div class="mx-auto max-w-md text-xs md:p-6 md:text-base">
	<h1 class="mb-6 text-3xl font-bold">Edit Trip</h1>
	{#if appState.user.isLoading && !formData.vehicle}
		<div class="flex justify-center">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"
			></div>
		</div>
	{:else}
		<form onsubmit={updateTrip} class="max-w-md space-y-4">
			<div>
				<label for="vehicle" class="block text-sm font-medium">Vehicle</label>
				<select
					id="vehicle"
					bind:value={formData.vehicle}
					class="w-full rounded border p-2"
					required
				>
					<option value="">Select a vehicle</option>
					{#each vehicles as vehicle}
						<option value={vehicle._id}
							>{vehicle.plateNumber} ({vehicle.make} {vehicle.model})</option
						>
					{/each}
				</select>
			</div>
			<div>
				<label for="driver" class="block text-sm font-medium">Driver</label>
				<select id="driver" bind:value={formData.driver} class="w-full rounded border p-2" required>
					<option value="">Select a driver</option>
					{#each drivers as driver}
						<option value={driver._id}>{driver.driverName} ({driver.driverEmail})</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="start-search" class="block text-sm font-medium">Start Location</label>
				<input
					id="start-search"
					type="text"
					placeholder="Search for start location"
					class="w-full rounded border p-2"
				/>
			</div>
			<div>
				<label for="end-search" class="block text-sm font-medium">End Location</label>
				<input
					id="end-search"
					type="text"
					placeholder="Search for end location"
					class="w-full rounded border p-2"
				/>
			</div>
			<div>
				<label for="location-map" class="block text-sm font-medium">Route Map</label>
				<div id="location-map" class="h-64 w-full"></div>
				<p class="text-sm text-gray-500">
					Click map or use search to set Start (first) and End (second). Route and distance
					auto-calculate.
				</p>
			</div>
			<div>
				<label for="distance" class="block text-sm font-medium">Distance (km)</label>
				<input
					id="distance"
					bind:value={formData.distance}
					type="number"
					step="any"
					class="w-full rounded border p-2"
					readonly
				/>
			</div>
			<div>
				<label for="startTime" class="block text-sm font-medium">Start Time</label>
				<input
					id="startTime"
					bind:value={formData.startTime}
					min={todayMin}
					type="datetime-local"
					class="w-full rounded border p-2"
					required
				/>
			</div>
			<div>
				<label for="endTime" class="block text-sm font-medium">End Time</label>
				<input
					id="endTime"
					bind:value={formData.endTime}
					min={formData.startTime || todayMin}
					type="datetime-local"
					class="w-full rounded border p-2"
					required
				/>
			</div>
			<div>
				<label for="status" class="block text-sm font-medium">Status</label>
				<select id="status" bind:value={formData.status} class="w-full rounded border p-2">
					<option value="scheduled">Scheduled</option>
					<option value="inProgress">In Progress</option>
					<option value="completed">Completed</option>
					<option value="cancelled">Cancelled</option>
				</select>
			</div>
			<button
				type="submit"
				class="w-full rounded bg-black p-2 text-white hover:bg-lime-700 disabled:opacity-50"
				disabled={appState.user.isLoading ||
					!formData.startLocation.lat ||
					!formData.endLocation.lat}
			>
				{#if appState.user.isLoading}
					<div class="flex items-center justify-center">
						<div
							class="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-orange-500"
						></div>
					</div>
				{:else}
					Update Trip
				{/if}
			</button>
		</form>
	{/if}
</div>

<style>
	#location-map {
		height: 300px;
	}
</style>
