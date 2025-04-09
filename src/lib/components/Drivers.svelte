<script>
	import { getContext } from 'svelte';
	import axios from 'axios';
	import toast from 'svelte-french-toast';
	import { goto } from '$app/navigation';
	import { assets } from '$lib/assets/assets';

	const { userState } = getContext('userState');
	let drivers = $state([]);
	let vehicles = $state([]);
	let selectedVehicles = $state({});
	let assigning = $state({});

	$effect(() => {
		if (!userState.isLoggedIn) {
			toast.error('Please log in to view drivers');
			goto('/login');
		} else {
			fetchDrivers();
			fetchVehicles();
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
				drivers.forEach((driver) => {
					selectedVehicles[driver._id] = driver.assignedVehicle?._id || '';
					assigning[driver._id] = false;
				});
			} else {
				toast.error(data.message);
			}
		} catch (error) {
			toast.error(error.response?.data?.message || 'Failed to fetch drivers');
		} finally {
			userState.isLoading = false;
		}
	}

	async function fetchVehicles() {
		try {
			const { data } = await axios.get('/api/vehicles', {
				headers: { Authorization: `Bearer ${userState.token}` }
			});
			if (data.success) {
				vehicles = data.vehicles;
			} else {
				toast.error(data.message || 'Failed to fetch vehicles');
			}
		} catch (error) {
			toast.error(error.response?.data?.message || 'Failed to fetch vehicles');
		}
	}

	async function assignVehicle(driverId) {
		assigning[driverId] = true;
		const vehicleId = selectedVehicles[driverId];
		try {
			const { data } = await axios.put(
				`/api/drivers/${driverId}/assign-vehicle`,
				{ vehicleId: vehicleId || null },
				{ headers: { Authorization: `Bearer ${userState.token}` } }
			);
			if (data.success) {
				toast.success('Vehicle assigned successfully');
				await Promise.all([fetchDrivers(), fetchVehicles()]); // Refresh both lists
			} else {
				toast.error(data.message);
			}
		} catch (error) {
			toast.error(error.response?.data?.message || 'Failed to assign vehicle');
		} finally {
			assigning[driverId] = false;
		}
	}

	async function deleteDriver(id) {
		if (!confirm('Are you sure you want to delete this driver?')) return;
		try {
			const { data } = await axios.delete(`/api/drivers/${id}`, {
				headers: { Authorization: `Bearer ${userState.token}` }
			});
			if (data.success) {
				toast.success('Driver deleted successfully');
				drivers = drivers.filter((d) => d._id !== id);
				delete selectedVehicles[id];
				delete assigning[id];
				await fetchVehicles(); // Refresh vehicles list after deletion
			} else {
				toast.error(data.message);
			}
		} catch (error) {
			toast.error(error.response?.data?.message || 'Failed to delete driver');
		}
	}
</script>

<!-- HTML remains the same -->
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
				<div
					class="rounded-lg border border-amber-400 bg-white p-4 hover:scale-105 hover:transition-all"
				>
					<h2 class="text-xl font-semibold text-blue-600">{driver.driverName}</h2>
					<p class="text-gray-700"><strong>Email:</strong> {driver.driverEmail}</p>
					<p class="text-gray-700"><strong>Phone:</strong> {driver.phone}</p>
					<p class="text-gray-700"><strong>License:</strong> {driver.licenseNumber}</p>
					<p class="text-gray-700"><strong>Status:</strong> {driver.status}</p>
					<p class="text-gray-700">
						<strong>Vehicle:</strong>
						{driver.assignedVehicle ? driver.assignedVehicle.plateNumber : 'Unassigned'}
					</p>
					{#if userState.role === 'Admin'}
						<div class="mt-2">
							<div class="relative">
								<select
									bind:value={selectedVehicles[driver._id]}
									onchange={() => assignVehicle(driver._id)}
									class="mb-2 w-full appearance-none rounded border p-2"
									disabled={assigning[driver._id]}
								>
									<option value="">Unassign Vehicle</option>
									{#each vehicles as vehicle}
										<option value={vehicle._id}>{vehicle.plateNumber}</option>
									{/each}
								</select>
								{#if assigning[driver._id]}
									<div class="absolute top-1/2 right-2 -translate-y-1/2">
										<div
											class="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500"
										></div>
									</div>
								{/if}
							</div>
							<div class="flex justify-center gap-2">
								<button
									onclick={() => goto(`/drivers/edit/${driver._id}`)}
									class="flex-1 rounded bg-sky-400 p-2 text-white hover:bg-lime-800"
									disabled={assigning[driver._id]}
								>
									Edit
								</button>
								<button
									onclick={() => deleteDriver(driver._id)}
									class="flex-1 rounded bg-rose-400 p-2 text-white hover:bg-teal-800"
									disabled={assigning[driver._id]}
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
	select {
		background-color: #f9fafb;
		border-color: #d1d5db;
	}
	select:hover:not(:disabled) {
		border-color: #9ca3af;
	}
	select:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
