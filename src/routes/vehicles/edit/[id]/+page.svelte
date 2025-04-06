<script>
    import { getContext } from 'svelte';
    import axios from 'axios';
    import toast from 'svelte-french-toast';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
  
    const { userState } = getContext('userState');
    let formData = {
      plateNumber: '',
      make: '',
      model: '',
      year: '',
      vin: '',
      fuelType: 'petrol'
    };
  
    if (!userState.isLoggedIn || userState.role !== 'Admin') {
      toast.error('You must be an Admin to access this page');
      goto('/login');
    } else {
      fetchVehicle();
    }
  
    async function fetchVehicle() {
      userState.isLoading = true;
      try {
        const { data } = await axios.get(`/api/vehicles/${$page.params.id}`, {
          headers: { Authorization: `Bearer ${userState.token}` }
        });
        if (data.success) {
          formData = data.vehicle;
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch vehicle');
      } finally {
        userState.isLoading = false;
      }
    }
  
    async function updateVehicle(event) {
      event.preventDefault();
      userState.isLoading = true;
  
      try {
        const { data } = await axios.put(`/api/vehicles/${$page.params.id}`, formData, {
          headers: { Authorization: `Bearer ${userState.token}`, 'Content-Type': 'application/json' }
        });
        if (data.success) {
          toast.success('Vehicle updated successfully');
          goto('/vehicles');
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to update vehicle');
      } finally {
        userState.isLoading = false;
      }
    }
  </script>
  
  <div class="mx-auto max-w-md py-10">
    <h1 class="mb-6 text-3xl font-bold">Edit Vehicle</h1>
    {#if userState.isLoading && !formData.plateNumber}
      <div class="flex justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"></div>
      </div>
    {:else}
      <form onsubmit={updateVehicle} class="max-w-md space-y-4">
        <div>
          <label for="plateNumber" class="block text-sm font-medium">Plate Number</label>
          <input
            id="plateNumber"
            bind:value={formData.plateNumber}
            type="text"
            class="w-full rounded border p-2"
            required
          />
        </div>
        <div>
          <label for="make" class="block text-sm font-medium">Make</label>
          <input id="make" bind:value={formData.make} type="text" class="w-full rounded border p-2" required />
        </div>
        <div>
          <label for="model" class="block text-sm font-medium">Model</label>
          <input id="model" bind:value={formData.model} type="text" class="w-full rounded border p-2" required />
        </div>
        <div>
          <label for="year" class="block text-sm font-medium">Year</label>
          <input id="year" bind:value={formData.year} type="number" class="w-full rounded border p-2" required />
        </div>
        <div>
          <label for="vin" class="block text-sm font-medium">VIN</label>
          <input id="vin" bind:value={formData.vin} type="text" class="w-full rounded border p-2" required />
        </div>
        <div>
          <label for="fuelType" class="block text-sm font-medium">Fuel Type</label>
          <select id="fuelType" bind:value={formData.fuelType} class="w-full rounded border p-2">
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
                class="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-orange-500"
              ></div>
            </div>
          {:else}
            Update Vehicle
          {/if}
        </button>
      </form>
    {/if}
  </div>