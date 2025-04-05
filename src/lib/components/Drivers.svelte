<script>
	import { getContext } from 'svelte';
	import axios from 'axios';
	import toast from 'svelte-french-toast';
	import { goto } from '$app/navigation';
	import { assets } from '$lib/assets/assets';

	const { userState } = getContext('userState');
	let drivers = $state([]);

	$effect(() => {
		if (!userState.isLoggedIn) {
			toast.error('Please log in to view drivers');
			goto('/login');
		} else {
			fetchDrivers();
		}
	});

	async function fetchDrivers() {
		userState.isLoading = true;
		try {
			const { data } = await axios.get('/api/drivers', {
				headers: { Authorization: `Bearer ${userState.token}` }
			});
			if (data.success) {
				drivers = data.drivers;
			} else {
				toast.error(data.message);
			}
		} catch (error) {
			toast.error(error.response?.data?.message || 'Failed to fetch drivers');
		} finally {
			userState.isLoading = false;
		}
	}
</script>

<div class="container mx-auto p-6">
	<h1 class="mb-6 text-3xl font-bold text-gray-800">Drivers</h1>
	{#if userState.isLoading}
		<div class="flex justify-center">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"
			></div>
		</div>
	{:else if drivers.length === 0}
		<p class="text-gray-500">No drivers found.</p>
	{:else}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each drivers as driver (driver._id)}
				<div class="rounded-lg bg-white p-4 shadow-md transition-shadow hover:shadow-lg">
					<h2 class="text-xl font-semibold text-blue-600">{driver.name}</h2>
					<p class="text-gray-700">Email: {driver.email}</p>
					<p class="text-gray-700">Phone: {driver.phone}</p>
					<p class="text-gray-700">License: {driver.licenseNumber}</p>
					<p class="text-gray-700">
						Vehicle: {driver.assignedVehicle ? driver.assignedVehicle.plateNumber : 'Unassigned'}
					</p>
					<p class="text-gray-700">Status: {driver.status}</p>
					{#if userState.role === 'Admin'}
						<button
							onclick={() => goto(`/drivers/edit/${driver._id}`)}
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
