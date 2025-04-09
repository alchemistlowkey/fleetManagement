<script>
	import { goto } from '$app/navigation';
	import { getContext } from 'svelte';
	import { assets } from '$lib/assets/assets';
	import axios from 'axios';
	import toast from 'svelte-french-toast';

	const { appState, resetUserState } = getContext('appState');
	let otpDigits = $state(Array(6).fill(''));
	let isVerifying = $state(false);
	let timeLeft = $state(60); // 1 minute to match backend (adjust to 600 for 10 minutes if needed)
	let timerExpired = $state(false);

	// Reactive timer effect
	$effect(() => {
		if (isVerifying && !timerExpired) {
			const interval = setInterval(() => {
				if (timeLeft > 0) {
					timeLeft -= 1;
				} else {
					timerExpired = true;
				}
			}, 1000);
			return () => clearInterval(interval); // Cleanup
		}
	});

	function togglePassword() {
		appState.user.showPassword = !appState.user.showPassword;
	}

	function toggleSignUp() {
		appState.user.isSignup = !appState.user.isSignup;
		isVerifying = false;
		timeLeft = 60;
		timerExpired = false;
	}

	async function submitHandler(event) {
		event.preventDefault();
		appState.user.isLoading = true;

		try {
			if (appState.user.isSignup) {
				const { data } = await axios.post('/api/auth/signup', {
					name: appState.user.name,
					email: appState.user.email,
					password: appState.user.password
				});

				if (data.success) {
					toast.success(data.message);
					appState.user.isSignup = false;
					isVerifying = true;
					timeLeft = 60;
					timerExpired = false;
				} else {
					toast.error(data.message);
				}
			} else {
				const { data } = await axios.post('/api/auth/login', {
					email: appState.user.email,
					password: appState.user.password
				});

				if (data.success) {
					if (!data.isAccountVerified) {
						toast.error('Your account is not verified. Please enter the OTP sent to your email.');
						isVerifying = true;
						timeLeft = 60;
						timerExpired = false;
						await resendOtp();
					} else {
						appState.user.isLoggedIn = true;
						appState.user.id = data.id;
						appState.user.name = data.name;
						appState.user.email = data.email;
						appState.user.role = data.role;
						appState.user.token = data.token;
						toast.success(data.message);
						goto('/trips');
					}
				} else {
					toast.error(data.message);
				}
			}
		} catch (error) {
			toast.error(error.response?.data?.message || error.message || 'An error occurred');
		} finally {
			appState.user.isLoading = false;
		}
	}

	async function verifyOtp(event) {
		event.preventDefault();
		appState.user.isLoading = true;

		const otp = otpDigits.join('');
		try {
			const { data } = await axios.post('/api/auth/verify', {
				email: appState.user.email,
				otp
			});
			if (data.success) {
				toast.success(data.message);
				otpDigits = Array(6).fill('');
				isVerifying = false;
				appState.user.email = '';
				appState.user.password = '';
				appState.user.name = '';
				timeLeft = 60;
				timerExpired = false;
			} else {
				toast.error(data.message);
				if (data.message === 'Invalid or expired OTP') {
					timerExpired = true; // Force resend option
				}
			}
		} catch (error) {
			toast.error(error.response?.data?.message || error.message);
			if (error.response?.data?.message === 'Invalid or expired OTP') {
				timerExpired = true; // Force resend option
			}
		} finally {
			appState.user.isLoading = false;
		}
	}

	async function resendOtp() {
		appState.user.isLoading = true;
		try {
			const { data } = await axios.post('/api/auth/resend-otp', {
				email: appState.user.email
			});
			if (data.success) {
				toast.success('A new OTP has been sent to your email');
				timeLeft = 60;
				timerExpired = false;
				otpDigits = Array(6).fill('');
			} else {
				toast.error(data.message);
			}
		} catch (error) {
			toast.error(error.response?.data?.message || 'Failed to resend OTP');
		} finally {
			appState.user.isLoading = false;
		}
	}

	function handleOtpInput(event, index) {
		const value = event.target.value;
		if (value.length <= 1 && /^[0-9]*$/.test(value)) {
			otpDigits[index] = value;
			if (value && index < 5) {
				document.getElementById(`otp-${index + 1}`).focus();
			}
		}
	}

	function formatTime(seconds) {
		const minutes = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${minutes}:${secs < 1 ? '0' : ''}${secs}`; // Fixed padding logic
	}
</script>

{#if !appState.user.isLoggedIn}
	<div class="mx-auto my-40 max-w-sm items-center justify-center rounded-lg bg-white p-6 shadow">
		{#if isVerifying}
			<!-- OTP Verification -->
			<h2 class="mb-4 text-center text-xl font-bold">Verify Email</h2>
			<form onsubmit={verifyOtp} class="space-y-4">
				<div class="mb-4 flex justify-between">
					{#each otpDigits as digit, index}
						<input
							id="otp-{index}"
							value={digit}
							oninput={(e) => handleOtpInput(e, index)}
							maxlength="1"
							type="text"
							class="h-12 w-12 rounded-md border bg-transparent p-2 text-center outline-none"
							required
						/>
					{/each}
				</div>
				<p class="text-center text-sm">
					Time remaining: {formatTime(timeLeft)}
					{#if timerExpired}
						<br />
						<button
							onclick={resendOtp}
							class="mt-2 cursor-pointer text-blue-500 underline"
							disabled={appState.user.isLoading}
						>
							Resend OTP
						</button>
					{/if}
				</p>
				<button
					type="submit"
					class="w-full cursor-pointer rounded bg-black p-2 text-white hover:bg-lime-800 disabled:opacity-50"
					disabled={appState.user.isLoading || timerExpired}
				>
					{#if appState.user.isLoading}
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
				{appState.user.isSignup ? 'Sign Up' : 'Login'}
			</h2>
			<form onsubmit={submitHandler} class="space-y-4">
				{#if appState.user.isSignup}
					<div class="relative flex w-full items-center">
						<img
							src={assets.person_icon}
							alt="person icon"
							class="absolute top-1/2 left-3 w-5 -translate-y-1/2"
						/>
						<input
							bind:value={appState.user.name}
							type="text"
							placeholder="Name"
							class="w-full rounded-md border bg-transparent p-2 px-10 outline-none"
							required
						/>
					</div>
				{/if}
				<div class="relative flex w-full items-center">
					<img
						src={assets.mail_icon}
						alt="mail icon"
						class="absolute top-1/2 left-3 w-5 -translate-y-1/2"
					/>
					<input
						bind:value={appState.user.email}
						type="email"
						placeholder="Email"
						class="w-full rounded-md border bg-transparent p-2 px-10 outline-none"
						required
					/>
				</div>
				<div class="relative flex w-full items-center">
					<img
						src={assets.lock_icon}
						alt="lock icon"
						class="absolute top-1/2 left-3 w-5 -translate-y-1/2"
					/>
					<input
						bind:value={appState.user.password}
						type={appState.user.showPassword ? 'text' : 'password'}
						placeholder="Password"
						class="w-full rounded-md border bg-transparent p-2 px-10 outline-none"
						required
					/>
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<img
						onclick={togglePassword}
						src={appState.user.showPassword ? assets.eye_slash_icon : assets.eye_icon}
						alt="password icon"
						class="absolute top-1/2 right-3 w-5 -translate-y-1/2 cursor-pointer"
					/>
				</div>
				<button
					type="submit"
					class="w-full cursor-pointer rounded bg-black p-2 text-white hover:bg-lime-800 disabled:opacity-50"
					disabled={appState.user.isLoading}
				>
					{#if appState.user.isLoading}
						<div class="flex items-center justify-center">
							<div
								class="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-orange-300"
							></div>
						</div>
					{:else}
						{appState.user.isSignup ? 'Sign Up' : 'Login'}
					{/if}
				</button>
			</form>
			<p class="mt-4 text-center text-sm">
				{appState.user.isSignup ? 'Already have an account?' : "Don't have an account?"}
				<button onclick={toggleSignUp} class="cursor-pointer text-blue-500 underline">
					{appState.user.isSignup ? 'Login' : 'Sign Up'}
				</button>
			</p>
		{/if}
	</div>
{:else}
	<div class="mx-auto my-80 flex items-center justify-center text-center">
		You are currently logged in as {appState.user.email}
	</div>
{/if}
