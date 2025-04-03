<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getContext } from 'svelte';
	import axios from 'axios';
	import toast from 'svelte-french-toast';
	import { assets } from '$lib/assets/assets';

	// Get the user state from context
	const { userState, resetUserState } = getContext('userState');
</script>

<div
	class="flex min-h-screen max-w-14 flex-col md:text-base text-xs justify-between space-y-6 border-r border-gray-300 bg-lime-950 px-4 pt-10 pb-10 text-white md:max-w-40 md:py-10"
>
	<div class="">
		<a href="/" class="mb-20">
			<img src={assets.logo} alt="logo icon" class="mx-auto min-w-7 md:max-w-20 pb-20" />
		</a>

		<nav class="flex flex-col gap-2">

			<a
				href="/"
				class="flex items-center gap-2 rounded transition-all"
				class:font-bold={$page.url.pathname === '/'}
				class:bg-sky-800={$page.url.pathname === '/'}
			>
				<img src={assets.home_icon} alt="home icon" class="md:md:max-w-8 max-w-6 p-1 sm:p-2" />
				<p class="hidden md:block pe-1">Dashboard</p>
			</a>

			<a
				href="/request-leave"
				class="flex items-center gap-2 rounded transition-all"
				class:font-bold={$page.url.pathname === '/request-leave'}
				class:bg-sky-800={$page.url.pathname === '/request-leave'}
			>
				<img src={assets.leave_icon} alt="leave icon" class="md:max-w-8 max-w-6 p-1 sm:p-2" />
				<p class="hidden md:block">Vehicles</p>
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
            <p class="md:text-xs text-[8px] mx-auto text-gray-300">({userState.role})</p>
			<a
				href="/login"
				onclick={resetUserState}
				class="flex cursor-pointer items-center gap-2 rounded transition-all"
			>
				<img src={assets.logout_icon} alt="logout icon" class="md:max-w-8 max-w-6 p-1 sm:p-2" />
				<p class="hidden md:block">Logout</p>
			</a>
		{:else}
			<a
				href="/login"
				class="flex items-center gap-2 rounded transition-all"
				class:font-bold={$page.url.pathname === '/login'}
				class:bg-sky-800={$page.url.pathname === '/login'}
			>
				<img src={assets.person_icon_sidebar} alt="user icon" class="md:max-w-8 max-w-6 p-1 sm:p-2" />
				<p class="hidden md:block">Login</p>
			</a>
		{/if}

		<a
			href="/settings"
			class="flex items-center gap-2 rounded transition-all"
			class:font-bold={$page.url.pathname === '/settings'}
			class:bg-sky-800={$page.url.pathname === '/settings'}
		>
			<img src={assets.settings_icon} alt="settings icon" class="md:max-w-8 max-w-6 p-1 sm:p-2" />
			<p class="hidden md:block">Settings</p>
		</a>
	</div>
</div>
