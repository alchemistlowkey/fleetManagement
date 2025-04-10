<script>
	import { getContext } from 'svelte';
	import axios from 'axios';
	import toast from 'svelte-french-toast';
	import { goto } from '$app/navigation';
	import { assets } from '$lib/assets/assets';

	const { appState } = getContext('appState');
	let vehicles = $state([]);
	let drivers = $state([]);
	let selectedDrivers = $state({});
	let assigning = $state({});

	$effect(() => {
		if (!appState.user.isLoggedIn) {
			toast.error('Please log in to view vehicles');
			goto('/login');
		} else {
			fetchVehicles();
			fetchDrivers();
		}
	});

	async function fetchVehicles() {
		appState.user.isLoading = true;
		try {
			const { data } = await axios.get('/api/vehicles', {
				headers: { Authorization: `Bearer ${appState.user.token}` }
			});
			if (data.success) {
				vehicles = data.vehicles;
				vehicles.forEach((vehicle) => {
					selectedDrivers[vehicle._id] = vehicle.assignedDriver?._id || '';
					assigning[vehicle._id] = false;
				});
			} else {
				toast.error(data.message);
			}
		} catch (error) {
			toast.error(error.response?.data?.message || 'Failed to fetch vehicles');
		} finally {
			appState.user.isLoading = false;
		}
	}

	async function fetchDrivers() {
		try {
			const { data } = await axios.get('/api/drivers', {
				headers: { Authorization: `Bearer ${appState.user.token}` }
			});
			if (data.success) {
				drivers = data.drivers;
			} else {
				toast.error(data.message || 'Failed to fetch drivers');
			}
		} catch (error) {
			toast.error(error.response?.data?.message || 'Failed to fetch drivers');
		}
	}

	async function assignDriver(vehicleId) {
		assigning[vehicleId] = true;
		const driverId = selectedDrivers[vehicleId];
		try {
			const { data } = await axios.put(
				`/api/vehicles/${vehicleId}/assign-driver`,
				{ driverId: driverId || null },
				{ headers: { Authorization: `Bearer ${appState.user.token}` } }
			);
			if (data.success) {
				toast.success('Driver assigned successfully');
				await Promise.all([fetchVehicles(), fetchDrivers()]);
			} else {
				toast.error(data.message);
			}
		} catch (error) {
			toast.error(error.response?.data?.message || 'Failed to assign driver');
		} finally {
			assigning[vehicleId] = false;
		}
	}

	async function deleteVehicle(id) {
		if (!confirm('Are you sure you want to delete this vehicle?')) return;
		try {
			const { data } = await axios.delete(`/api/vehicles/${id}`, {
				headers: { Authorization: `Bearer ${appState.user.token}` }
			});
			if (data.success) {
				toast.success('Vehicle deleted successfully');
				vehicles = vehicles.filter((v) => v._id !== id);
				delete selectedDrivers[id];
				delete assigning[id];
				await fetchDrivers(); // Refresh drivers list after deletion
			} else {
				toast.error(data.message);
			}
		} catch (error) {
			toast.error(error.response?.data?.message || 'Failed to delete vehicle');
		}
	}
</script>

<div class="container mx-auto md:p-6 text-xs md:text-base">
	<h1 class="mb-6 text-3xl font-bold text-gray-800">Vehicles</h1>
	{#if appState.user.isLoading}
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
				<div
					class="rounded-lg border border-amber-400 bg-white p-4 hover:scale-105 hover:shadow-lg hover:transition-all"
				>
					<h2 class="text-xl font-semibold text-blue-600">{vehicle.plateNumber}</h2>
					<p class="text-gray-700"><strong>Make:</strong> {vehicle.make}</p>
					<p class="text-gray-700"><strong>Model:</strong> {vehicle.model}</p>
					<p class="text-gray-700"><strong>Year:</strong> {vehicle.year}</p>
					<p class="text-gray-700"><strong>VIN:</strong> {vehicle.vin}</p>
					<p class="text-gray-700"><strong>Fuel Type:</strong> {vehicle.fuelType}</p>
					<p class="text-gray-700">
						<strong>Driver:</strong>
						{vehicle.assignedDriver ? vehicle.assignedDriver.driverName : 'Unassigned'}
					</p>
					{#if appState.user.role === 'Admin'}
						<div class="mt-2">
							<div class="relative">
								<select
									bind:value={selectedDrivers[vehicle._id]}
									onchange={() => assignDriver(vehicle._id)}
									class="mb-2 w-full appearance-none rounded border p-2"
									disabled={assigning[vehicle._id]}
								>
									<option value="">Unassign Driver</option>
									{#each drivers as driver}
										<option value={driver._id}>{driver.driverName}</option>
									{/each}
								</select>
								{#if assigning[vehicle._id]}
									<div class="absolute top-1/2 right-2 -translate-y-1/2">
										<div
											class="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500"
										></div>
									</div>
								{/if}
							</div>
							<div class="flex justify-center gap-2">
								<button
									onclick={() => goto(`/vehicles/edit/${vehicle._id}`)}
									class="flex-1 rounded bg-sky-400 p-2 text-white hover:bg-lime-800"
									disabled={assigning[vehicle._id]}
								>
									Edit
								</button>
								<button
									onclick={() => deleteVehicle(vehicle._id)}
									class="flex-1 rounded bg-rose-400 p-2 text-white hover:bg-teal-800"
									disabled={assigning[vehicle._id]}
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
