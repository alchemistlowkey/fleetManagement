<script>
	import { getContext } from 'svelte';
	import axios from 'axios';
	import toast from 'svelte-french-toast';
	import { goto } from '$app/navigation';
	import { assets } from '$lib/assets/assets';

	const { userState } = getContext('userState');
	let trips = [];

	if (!userState.isLoggedIn) {
		toast.error('Please log in to view trips');
		goto('/login');
	} else {
		fetchTrips();
	}

	async function fetchTrips() {
		userState.isLoading = true;
		try {
			const { data } = await axios.get('/api/trips', {
				headers: { Authorization: `Bearer ${userState.token}` }
			});
			if (data.success) {
				trips = data.trips;
			} else {
				toast.error(data.message);
			}
		} catch (error) {
			toast.error(error.response?.data?.message || 'Failed to fetch trips');
		} finally {
			userState.isLoading = false;
		}
	}
</script>

<div class="container mx-auto p-6">
	<h1 class="mb-6 text-3xl font-bold text-gray-800">Trips</h1>
	{#if userState.isLoading}
		<div class="flex justify-center">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"
			></div>
		</div>
	{:else if trips.length === 0}
		<p class="text-center text-gray-500">No trips found.</p>
	{:else}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each trips as trip (trip._id)}
				<div class="rounded-lg bg-white p-4 shadow-md transition-shadow hover:shadow-lg">
					<h2 class="text-xl font-semibold text-blue-600">
						{trip.vehicle.plateNumber} - {trip.driver.driverName}
					</h2>
					<p class="text-gray-700">
						<strong>Start:</strong>
						{new Date(trip.startTime).toLocaleString()}
					</p>
					<p class="text-gray-700">
						<strong>End:</strong>
						{new Date(trip.endTime).toLocaleString()}
					</p>
					<p class="text-gray-700">
						<strong>From:</strong> ({trip.startLocation.lat}, {trip.startLocation.lng})
					</p>
					<p class="text-gray-700">
						<strong>To:</strong> ({trip.endLocation.lat}, {trip.endLocation.lng})
					</p>
					<p class="text-gray-700"><strong>Status:</strong> {trip.status}</p>
					<p class="text-gray-700"><strong>Distance:</strong> {trip.distance} km</p>
					{#if userState.role === 'Admin'}
						<button
							onclick={() => goto(`/trips/edit/${trip._id}`)}
							class="mt-2 rounded bg-blue-600 p-2 text-white hover:bg-blue-700"
						>
							Edit
						</button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
