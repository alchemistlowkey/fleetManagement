<script>
	import { getContext } from 'svelte';
	import axios from 'axios';
	import toast from 'svelte-french-toast';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	const { appState } = getContext('appState');
	let formData = {
		driverName: '',
		driverEmail: '',
		phone: '',
		licenseNumber: '',
		status: 'active'
	};

	if (!appState.user.isLoggedIn || appState.user.role !== 'Admin') {
		toast.error('You must be an Admin to access this page');
		goto('/login');
	} else {
		fetchDriver();
	}

	async function fetchDriver() {
		appState.user.isLoading = true;
		try {
			const { data } = await axios.get(`/api/drivers/${$page.params.id}`, {
				headers: { Authorization: `Bearer ${appState.user.token}` }
			});
			if (data.success) {
				formData = data.driver;
			} else {
				toast.error(data.message);
			}
		} catch (error) {
			toast.error(error.response?.data?.message || 'Failed to fetch driver');
		} finally {
			appState.user.isLoading = false;
		}
	}

	async function updateDriver(event) {
		event.preventDefault();
		appState.user.isLoading = true;

		try {
			const { data } = await axios.put(`/api/drivers/${$page.params.id}`, formData, {
				headers: {
					Authorization: `Bearer ${appState.user.token}`,
					'Content-Type': 'application/json'
				}
			});
			if (data.success) {
				toast.success('Driver updated successfully');
				goto('/drivers');
			} else {
				toast.error(data.message);
			}
		} catch (error) {
			toast.error(error.response?.data?.message || 'Failed to update driver');
		} finally {
			appState.user.isLoading = false;
		}
	}
</script>

<div class="mx-auto max-w-md md:p-6 text-xs md:text-base">
	<h1 class="mb-6 text-3xl font-bold">Edit Driver</h1>
	{#if appState.user.isLoading && !formData.driverName}
		<div class="flex justify-center">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"
			></div>
		</div>
	{:else}
		<form onsubmit={updateDriver} class="max-w-md space-y-4">
			<div>
				<label for="driverName" class="block text-sm font-medium">Name</label>
				<input
					id="driverName"
					bind:value={formData.driverName}
					type="text"
					class="w-full rounded border p-2"
					required
				/>
			</div>
			<div>
				<label for="driverEmail" class="block text-sm font-medium">Email</label>
				<input
					id="driverEmail"
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
				disabled={appState.user.isLoading}
			>
				{#if appState.user.isLoading}
					<div class="flex items-center justify-center">
						<div
							class="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-orange-500"
						></div>
					</div>
				{:else}
					Update Driver
				{/if}
			</button>
		</form>
	{/if}
</div>
