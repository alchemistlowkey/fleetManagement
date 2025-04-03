<script>
	import { setContext } from 'svelte';
	import toast from 'svelte-french-toast';

	let { children } = $props();

	// Function to get initial state from localStorage
	function getInitialState() {
		if (typeof window !== 'undefined') {
			return {
				id: localStorage.getItem('userId') || '',
				name: localStorage.getItem('userName') || '',
				email: localStorage.getItem('userEmail') || '',
				role: localStorage.getItem('userRole') || '',
				token: localStorage.getItem('token') || '',
				isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
				showPassword: false,
				userData: {},
				isSignup: false,
				isLoading: false
			};
		}
		return {
			id: '',
			name: '',
			email: '',
			role: '',
			token: '',
			isLoggedIn: false,
			showPassword: false,
			userData: {},
			isSignup: false,
			isLoading: false
		};
	}

	// Use $state for reactive user state
	let userState = $state(getInitialState());

	// Sync with localStorage whenever userState changes
	$effect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem('userId', userState.id);
			localStorage.setItem('userName', userState.name);
			localStorage.setItem('userEmail', userState.email);
			localStorage.setItem('userRole', userState.role);
			localStorage.setItem('token', userState.token);
			localStorage.setItem('isLoggedIn', String(userState.isLoggedIn));
		}
	});

	// Function to reset user state (update properties individually)
	function resetUserState() {
		userState.id = '';
		userState.name = '';
		userState.email = '';
		userState.role = '';
		userState.token = '';
		userState.isLoggedIn = false;
		userState.showPassword = false;
		userState.userData = {};
		userState.isSignup = false;
		userState.isLoading = false;
		toast.success('Logged out successfully');
	}

	// Provide context
	setContext('userState', { userState, resetUserState });
</script>

{@render children()}
