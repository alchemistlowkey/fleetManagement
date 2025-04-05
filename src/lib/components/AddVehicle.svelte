<script>
	import { getContext } from 'svelte';
	import axios from 'axios';
	import toast from 'svelte-french-toast';
	import { goto } from '$app/navigation';

	const { userState } = getContext('userState');
	let formData = $state({
		plateNumber: '',
		make: '',
		model: '',
		year: '',
		vin: '',
		fuelType: 'petrol'
	});

	$effect(() => {
		if (!userState.isLoggedIn || userState.role !== 'Admin') {
			toast.error('You must be an Admin to access this page');
			goto('/login');
		}
	});

	async function addVehicle(event) {
		event.preventDefault();
		userState.isLoading = true;

		try {
			const { data } = await axios.post('/api/vehicles', formData, {
				headers: { Authorization: `Bearer ${userState.token}` }
			});

			if (data.success) {
				toast.promise({
					loading: 'Saving...',
					success: 'Vehicle added successfully',
					error: 'Failed to add vehicle'
				});
				goto('/vehicles');
			} else {
				toast.error(data.message);
			}
		} catch (error) {
			toast.error(error.response?.data?.message || 'Failed to add vehicle');
		} finally {
			userState.isLoading = false;
		}
	}
</script>

<div class="mx-auto max-w-md py-10">
	<h1 class="mb-6 text-3xl font-bold">Add Vehicle</h1>
	<form onsubmit={addVehicle} class="max-w-md space-y-4">
		<div>
			<label for="plateNumber" class="block text-sm font-medium">Plate Number</label>
			<input
				bind:value={formData.plateNumber}
				type="text"
				class="w-full rounded border p-2"
				required
			/>
		</div>
		<div>
			<label for="make" class="block text-sm font-medium">Make</label>
			<input bind:value={formData.make} type="text" class="w-full rounded border p-2" required />
		</div>
		<div>
			<label for="model" class="block text-sm font-medium">Model</label>
			<input bind:value={formData.model} type="text" class="w-full rounded border p-2" required />
		</div>
		<div>
			<label for="year" class="block text-sm font-medium">Year</label>
			<input bind:value={formData.year} type="number" class="w-full rounded border p-2" required />
		</div>
		<div>
			<label for="vin" class="block text-sm font-medium">VIN</label>
			<input bind:value={formData.vin} type="text" class="w-full rounded border p-2" required />
		</div>
		<div>
			<label for="fuelType" class="block text-sm font-medium">Fuel Type</label>
			<select bind:value={formData.fuelType} class="w-full rounded border p-2">
				<option value="CNG">CNG</option>
				<option value="petrol">Petrol</option>
				<option value="diesel">Diesel</option>
				<option value="electric">Electric</option>
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
						class="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-orange-300"
					></div>
				</div>
			{:else}
				Add Vehicle
			{/if}
		</button>
	</form>
</div>
