<script>
	import { getContext } from 'svelte';
	import axios from 'axios';
	import toast from 'svelte-french-toast';
	import { goto } from '$app/navigation';
	import { assets } from '$lib/assets/assets';

	const { userState } = getContext('userState');
	let vehicles = $state([]);

	$effect(() => {
		if (!userState.isLoggedIn) {
			toast.error('Please log in to view vehicles');
			goto('/login');
		} else {
			fetchVehicles();
		}
	});

	async function fetchVehicles() {
		userState.isLoading = true;
		try {
			const { data } = await axios.get('/api/vehicles', {
				headers: { Authorization: `Bearer ${userState.token}` }
			});
			if (data.success) {
				vehicles = data.vehicles;
			} else {
				toast.error(data.message);
			}
		} catch (error) {
			toast.error(error.response?.data?.message || 'Failed to fetch vehicles');
		} finally {
			userState.isLoading = false;
		}
	}
</script>

<div class="container mx-auto p-6">
	<h1 class="mb-6 text-3xl font-bold text-gray-800">Vehicles</h1>
	{#if userState.isLoading}
		<div class="flex justify-center">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"
			></div>
		</div>
	{:else if vehicles.length === 0}
		<p class="text-gray-500">No vehicles found.</p>
	{:else}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each vehicles as vehicle (vehicle._id)}
				<div class="rounded-lg bg-white p-4 shadow-md transition-shadow hover:shadow-lg">
					<h2 class="text-xl font-semibold text-blue-600">{vehicle.plateNumber}</h2>
					<p class="text-gray-700">Make: {vehicle.make}</p>
					<p class="text-gray-700">Model: {vehicle.model}</p>
					<p class="text-gray-700">Year: {vehicle.year}</p>
					<p class="text-gray-700">VIN: {vehicle.vin}</p>
					<p class="text-gray-700">Fuel Type: {vehicle.fuelType}</p>
					<p class="text-gray-700">
						Driver: {vehicle.assignedDriver ? vehicle.assignedDriver.name : 'Unassigned'}
					</p>
					{#if userState.role === 'Admin'}
						<button
							onclick={() => goto(`/vehicles/edit/${vehicle._id}`)}
							class="mt-2 rounded bg-black p-2 text-white hover:bg-lime-800"
						>
							Edit
						</button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
