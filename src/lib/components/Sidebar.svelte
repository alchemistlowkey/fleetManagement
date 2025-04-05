<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getContext } from 'svelte';
	import axios from 'axios';
	import toast from 'svelte-french-toast';
	import { assets } from '$lib/assets/assets';

	const { userState, resetUserState } = getContext('userState');

	function logout() {
		resetUserState();
		goto('/login');
	}
</script>

<div
	class="flex min-h-screen max-w-14 flex-col justify-between space-y-6 border-r border-gray-300 bg-lime-950 px-4 pt-10 pb-10 text-xs text-white md:max-w-40 md:py-10 md:text-sm"
>
	<div class="">
		<a href="/" class="mb-20">
			<img src={assets.logo} alt="logo icon" class="mx-auto min-w-7 pb-20 md:max-w-20" />
		</a>

		<nav class="flex flex-col gap-2">
			<a
				href="/"
				class="flex items-center gap-2 rounded transition-all"
				class:font-bold={$page.url.pathname === '/'}
				class:bg-sky-800={$page.url.pathname === '/'}
			>
				<img src={assets.home_icon} alt="home icon" class="max-w-6 p-1 sm:p-2 md:md:max-w-8" />
				<p class="hidden pe-1 md:block">Dashboard</p>
			</a>

			{#if userState.role === 'Admin'}
				<a
					href="/vehicles/add"
					class="flex items-center gap-2 rounded transition-all"
					class:font-bold={$page.url.pathname === '/vehicles/add'}
					class:bg-sky-800={$page.url.pathname === '/vehicles/add'}
				>
					<img src={assets.vehicle_add_icon} alt="add icon" class="max-w-6 p-1 sm:p-2 md:max-w-8" />
					<p class="hidden md:block">Add Vehicle</p>
				</a>
			{/if}
			<a
				href="/vehicles"
				class="flex items-center gap-2 rounded transition-all"
				class:font-bold={$page.url.pathname === '/vehicles'}
				class:bg-sky-800={$page.url.pathname === '/vehicles'}
			>
				<img src={assets.vehicle_icon} alt="vehicles icon" class="max-w-6 p-1 sm:p-2 md:max-w-8" />
				<p class="hidden md:block">Vehicles</p>
			</a>

			<a
				href="/drivers"
				class="flex items-center gap-2 rounded transition-all"
				class:font-bold={$page.url.pathname === '/drivers'}
				class:bg-sky-800={$page.url.pathname === '/drivers'}
			>
				<img src={assets.driver_icon} alt="drivers icon" class="max-w-6 p-1 sm:p-2 md:max-w-8" />
				<p class="hidden md:block">Drivers</p>
			</a>
			{#if userState.role === 'Admin'}
				<a
					href="/drivers/add"
					class="flex items-center gap-2 rounded transition-all"
					class:font-bold={$page.url.pathname === '/drivers/add'}
					class:bg-sky-800={$page.url.pathname === '/drivers/add'}
				>
					<img src={assets.add_icon} alt="add icon" class="max-w-6 p-1 sm:p-2 md:max-w-8" />
					<p class="hidden md:block">Add Driver</p>
				</a>
			{/if}

			{#if userState.role === 'Admin'}
				<a
					href="/trips/add"
					class="flex items-center gap-2 rounded transition-all"
					class:font-bold={$page.url.pathname === '/trips/add'}
					class:bg-sky-800={$page.url.pathname === '/trips/add'}
				>
					<img src={assets.add_icon} alt="add icon" class="max-w-6 p-1 sm:p-2 md:max-w-8" />
					<p class="hidden md:block">Add Trip</p>
				</a>
			{/if}

			<a
				href="/trips"
				class="flex items-center gap-2 rounded transition-all"
				class:font-bold={$page.url.pathname === '/trips'}
				class:bg-sky-800={$page.url.pathname === '/trips'}
			>
				<img src={assets.trip_icon} alt="trips icon" class="max-w-6 p-1 sm:p-2 md:max-w-8" />
				<p class="hidden md:block">Trips</p>
			</a>
		</nav>
	</div>
	<div class="mt-auto flex flex-col gap-2">
		{#if userState.isLoggedIn}
			<div class="flex items-center justify-center gap-2 rounded px-1 transition-all">
				<div
					class="flex h-4 w-4 items-center justify-center rounded-full bg-black p-1 text-white sm:p-2 md:h-8 md:w-8"
				>
					{#if userState.name}
						{userState.name[0].toUpperCase()}
					{:else}
						?
					{/if}
				</div>
			</div>
			<p class="mx-auto text-[8px] text-gray-300 md:text-xs">({userState.role})</p>
			<button
				onclick={logout}
				class="flex cursor-pointer items-center gap-2 rounded transition-all"
			>
				<img src={assets.logout_icon} alt="logout icon" class="max-w-6 p-1 sm:p-2 md:max-w-8" />
				<p class="hidden md:block">Logout</p>
			</button>
		{:else}
			<a
				href="/login"
				class="flex items-center gap-2 rounded transition-all"
				class:font-bold={$page.url.pathname === '/login'}
				class:bg-sky-800={$page.url.pathname === '/login'}
			>
				<img
					src={assets.person_icon_sidebar}
					alt="user icon"
					class="max-w-6 p-1 sm:p-2 md:max-w-8"
				/>
				<p class="hidden md:block">Login</p>
			</a>
		{/if}

		<a
			href="/settings"
			class="flex items-center gap-2 rounded transition-all"
			class:font-bold={$page.url.pathname === '/settings'}
			class:bg-sky-800={$page.url.pathname === '/settings'}
		>
			<img src={assets.settings_icon} alt="settings icon" class="max-w-6 p-1 sm:p-2 md:max-w-8" />
			<p class="hidden md:block">Settings</p>
		</a>
	</div>
</div>
