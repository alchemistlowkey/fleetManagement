<script>
	import { goto } from '$app/navigation';
	import { getContext } from 'svelte';
	import { assets } from '$lib/assets/assets';
	import axios from 'axios';
	import toast from 'svelte-french-toast';

	const { userState, resetUserState } = getContext('userState');
	let otp = $state('');
	let isVerifying = $state(false);

	function togglePassword() {
		userState.showPassword = !userState.showPassword;
	}

	function toggleSignUp() {
		userState.isSignup = !userState.isSignup;
		isVerifying = false;
	}

	async function submitHandler(event) {
		event.preventDefault();

		userState.isLoading = true;

		try {
			if (userState.isSignup) {
				const { data } = await axios.post('/api/auth/signup', {
					name: userState.name,
					email: userState.email,
					password: userState.password
				});

				if (data.success) {
					toast.success(data.message);
					userState.isSignup = false;
					isVerifying = true;
				} else {
					toast.error(data.message);
				}
			} else {
				const { data } = await axios.post('/api/auth/login', {
					email: userState.email,
					password: userState.password
				});

				if (data.success) {
					userState.isLoggedIn = true;
					userState.id = data.id;
					userState.name = data.name;
					userState.email = data.email;
					userState.role = data.role;
					userState.token = data.token;
					toast.success(data.message);
					goto('/');
				} else {
					toast.error(data.message);
				}
			}
		} catch (error) {
			toast.error(error.response?.data?.message || error.message || 'An error occurred');
		} finally {
			userState.isLoading = false;
		}
	}

	async function verifyOtp(event) {
		event.preventDefault();
		userState.isLoading = true;

		try {
			const { data } = await axios.post('api/auth/verify', {
				email: userState.email,
				otp
			});
			if (data.success) {
				toast.success(data.message);
				otp = '';
				isVerifying = false;
				userState.email = '';
				userState.password = '';
				userState.name = '';
			} else {
				toast.error(data.message);
			}
		} catch (error) {
			toast.error(error.response?.data?.message || error.message);
		} finally {
			userState.isLoading = false;
		}
	}
</script>

{#if !userState.isLoggedIn}
	<div class="mx-auto my-40 w-sm items-center justify-center rounded-lg bg-white p-6 shadow">
		{#if isVerifying}
			<!-- OTP Verification -->
			<h2 class="mb-4 text-center text-xl font-bold">Verify Email</h2>
			<form onsubmit={verifyOtp} class="space-y-4">
				<div class="relative mb-4 flex w-full items-center">
					<input
						bind:value={otp}
						type="text"
						placeholder="Enter OTP"
						class="w-full rounded-md border bg-transparent p-2 px-4 outline-none"
						required
					/>
				</div>
				<button
					type="submit"
					class="w-full cursor-pointer rounded bg-black p-2 text-white hover:bg-lime-800 disabled:opacity-50"
					disabled={userState.isLoading}
				>
					{#if userState.isLoading}
						<div class="flex items-center justify-center">
							<div
								class="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-orange-300"
							></div>
						</div>
					{:else}
						Verify
					{/if}
				</button>
			</form>
		{:else}
			<!-- Login/Signup Form -->

			<h2 class="mb-4 text-center text-xl font-bold">
				{userState.isSignup ? 'Sign Up' : 'Login'}
			</h2>

			{#if userState.isSignup}
				<div class="relative mb-4 flex w-full items-center">
					<img
						src={assets.person_icon}
						alt="person icon"
						class="absolute top-1/2 left-3 w-5 -translate-y-1/2"
					/>
					<input
						bind:value={userState.name}
						type="text"
						placeholder="Name"
						class="w-full rounded-md border bg-transparent p-2 px-10 outline-none"
					/>
				</div>
			{/if}

			<div class="relative mb-4 flex w-full items-center">
				<img
					src={assets.mail_icon}
					alt="mail icon"
					class="absolute top-1/2 left-3 w-5 -translate-y-1/2"
				/>
				<input
					bind:value={userState.email}
					type="email"
					placeholder="Email"
					class="w-full rounded-md border bg-transparent p-2 px-10 outline-none"
					required
				/>
			</div>

			<div class="relative mb-4 flex w-full items-center">
				<img
					src={assets.lock_icon}
					alt="lock icon"
					class="absolute top-1/2 left-3 w-5 -translate-y-1/2"
				/>
				<input
					bind:value={userState.password}
					type={userState.showPassword ? 'text' : 'password'}
					placeholder="Password"
					class="w-full rounded-md border bg-transparent p-2 px-10 outline-none"
					required
				/>
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<img
					onclick={togglePassword}
					src={userState.showPassword ? assets.eye_slash_icon : assets.eye_icon}
					alt="password icon"
					class="absolute top-1/2 right-3 w-5 -translate-y-1/2 cursor-pointer"
				/>
			</div>

			<button
				onclick={submitHandler}
				class="w-full cursor-pointer rounded bg-black p-2 text-white hover:bg-lime-800 disabled:opacity-50"
				disabled={userState.isLoading}
			>
				{#if userState.isLoading}
					<div class="flex items-center justify-center">
						<div
							class="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-orange-300"
						></div>
					</div>
				{:else}
					{userState.isSignup ? 'Sign Up' : 'Login'}
				{/if}
			</button>

			<p class="mt-4 text-center text-sm">
				{userState.isSignup ? 'Already have an account?' : "Don't have an account?"}
				<button onclick={toggleSignUp} class="cursor-pointer text-blue-500 underline">
					{userState.isSignup ? 'Login' : 'Sign Up'}
				</button>
			</p>
		{/if}
	</div>
{:else}
	<div class="mx-auto my-80 flex items-center justify-center text-center">
		You are currently logged in as {userState.email}
	</div>
{/if}
