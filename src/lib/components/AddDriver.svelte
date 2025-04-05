<script>
	import { getContext } from 'svelte';
	import axios from 'axios';
	import toast from 'svelte-french-toast';
	import { goto } from '$app/navigation';

	const { userState } = getContext('userState');
	let formData = $state({
		driverName: '',
		driverEmail: '',
		phone: '',
		licenseNumber: '',
		status: 'active'
	});

	let isLoading = $state(false);

	$effect(() => {
		if (!userState.isLoggedIn || userState.role !== 'Admin') {
			toast.error('You must be an Admin to access this page');
			goto('/login');
		}
	});

	async function addDriver(event) {
		event.preventDefault();
		isLoading = true;

		try {
			const { data } = await axios.post('/api/drivers', formData, {
				headers: { Authorization: `Bearer ${userState.token}` }
			});

			if (data.success) {
				toast.success('Driver added successfully');
				goto('/drivers');
			} else {
				toast.error(data.message);
			}
		} catch (error) {
			toast.error(error.response?.data?.message || 'Failed to add driver');
			console.error('Client-side error:', error);
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="mx-auto max-w-md py-10">
	<h1 class="mb-6 text-3xl font-bold">Add Driver</h1>
	<form onsubmit={addDriver} class="max-w-md space-y-4">
		<div>
			<label for="name" class="block text-sm font-medium">Name</label>
			<input
				id="name"
				bind:value={formData.driverName}
				type="text"
				class="w-full rounded border p-2"
				required
			/>
		</div>
		<div>
			<label for="email" class="block text-sm font-medium">Email</label>
			<input
				id="email"
				bind:value={formData.driverEmail}
				type="email"
				class="w-full rounded border p-2"
				required
			/>
		</div>
		<div>
			<label for="phone" class="block text-sm font-medium">Phone</label>
			<input
				id="phone"
				bind:value={formData.phone}
				type="tel"
				class="w-full rounded border p-2"
				required
			/>
		</div>
		<div>
			<label for="licenseNumber" class="block text-sm font-medium">License Number</label>
			<input
				id="licenseNumber"
				bind:value={formData.licenseNumber}
				type="text"
				class="w-full rounded border p-2"
				required
			/>
		</div>
		<div>
			<label for="status" class="block text-sm font-medium">Status</label>
			<select id="status" bind:value={formData.status} class="w-full rounded border p-2">
				<option value="active">Active</option>
				<option value="inactive">Inactive</option>
				<option value="suspended">Suspended</option>
			</select>
		</div>
		<button
			type="submit"
			class="w-full rounded bg-black p-2 text-white hover:bg-lime-700 disabled:opacity-50"
			disabled={isLoading}
		>
			{#if isLoading}
				<div class="flex items-center justify-center">
					<div
						class="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-orange-300"
					></div>
				</div>
			{:else}
				Add Driver
			{/if}
		</button>
	</form>
</div>
