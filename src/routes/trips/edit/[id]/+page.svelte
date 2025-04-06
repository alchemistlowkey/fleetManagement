<script>
	import { getContext } from 'svelte';
	import axios from 'axios';
	import toast from 'svelte-french-toast';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	const { userState } = getContext('userState');
	let formData = {
		vehicle: '',
		driver: '',
		startLocation: { lat: '', lng: '' },
		endLocation: { lat: '', lng: '' },
		startTime: '',
		endTime: '',
		status: 'scheduled'
	};
	let vehicles = [];
	let drivers = [];

	if (!userState.isLoggedIn || userState.role !== 'Admin') {
		toast.error('You must be an Admin to access this page');
		goto('/login');
	} else {
		fetchTripAndOptions();
	}

	async function fetchTripAndOptions() {
		userState.isLoading = true;
		try {
			const [tripResponse, vehiclesResponse, driversResponse] = await Promise.all([
				axios.get(`/api/trips/${$page.params.id}`, {
					headers: { Authorization: `Bearer ${userState.token}` }
				}),
				axios.get('/api/vehicles', { headers: { Authorization: `Bearer ${userState.token}` } }),
				axios.get('/api/drivers', { headers: { Authorization: `Bearer ${userState.token}` } })
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
					startTime: new Date(tripResponse.data.trip.startTime).toISOString().slice(0, 16),
					endTime: new Date(tripResponse.data.trip.endTime).toISOString().slice(0, 16)
				};
			}
			vehicles = vehiclesResponse.data.vehicles || [];
			drivers = driversResponse.data.drivers || [];
		} catch (error) {
			toast.error('Failed to load trip data');
		} finally {
			userState.isLoading = false;
		}
	}

	async function updateTrip(event) {
		event.preventDefault();
		userState.isLoading = true;

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
			startTime: new Date(formData.startTime).toISOString(),
			endTime: new Date(formData.endTime).toISOString(),
			status: formData.status
		};

		try {
			const { data } = await axios.put(`/api/trips/${$page.params.id}`, submissionData, {
				headers: { Authorization: `Bearer ${userState.token}`, 'Content-Type': 'application/json' }
			});
			if (data.success) {
				toast.success('Trip updated successfully');
				goto('/trips');
			} else {
				toast.error(data.message);
			}
		} catch (error) {
			toast.error(error.response?.data?.message || 'Failed to update trip');
		} finally {
			userState.isLoading = false;
		}
	}
</script>

<div class="mx-auto max-w-md py-10">
	<h1 class="mb-6 text-3xl font-bold">Edit Trip</h1>
	{#if userState.isLoading && !formData.vehicle}
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
				<label for="startLocationLat" class="block text-sm font-medium">Start Latitude</label>
				<input
					id="startLocationLat"
					bind:value={formData.startLocation.lat}
					type="number"
					step="any"
					class="w-full rounded border p-2"
					required
				/>
			</div>
			<div>
				<label for="startLocationLng" class="block text-sm font-medium">Start Longitude</label>
				<input
					id="startLocationLng"
					bind:value={formData.startLocation.lng}
					type="number"
					step="any"
					class="w-full rounded border p-2"
					required
				/>
			</div>
			<div>
				<label for="endLocationLat" class="block text-sm font-medium">End Latitude</label>
				<input
					id="endLocationLat"
					bind:value={formData.endLocation.lat}
					type="number"
					step="any"
					class="w-full rounded border p-2"
					required
				/>
			</div>
			<div>
				<label for="endLocationLng" class="block text-sm font-medium">End Longitude</label>
				<input
					id="endLocationLng"
					bind:value={formData.endLocation.lng}
					type="number"
					step="any"
					class="w-full rounded border p-2"
					required
				/>
			</div>
			<div>
				<label for="startTime" class="block text-sm font-medium">Start Time</label>
				<input
					id="startTime"
					bind:value={formData.startTime}
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
				disabled={userState.isLoading}
			>
				{#if userState.isLoading}
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
