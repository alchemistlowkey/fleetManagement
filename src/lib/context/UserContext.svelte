<script>
	import { setContext } from 'svelte';
	import toast from 'svelte-french-toast';
	import axios from 'axios';
	import { browser } from '$app/environment';
	import { getGoogleMapsLoader } from '$lib/config/google-maps';

	let { children } = $props();

	// Initial user state
	function getInitialUserState() {
		if (typeof window !== 'undefined') {
			return {
				id: localStorage.getItem('userId') || '',
				name: localStorage.getItem('userName') || '',
				email: localStorage.getItem('userEmail') || '',
				role: localStorage.getItem('userRole') || '',
				token: localStorage.getItem('token') || '',
				isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
				showPassword: false,
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
			isSignup: false,
			isLoading: false
		};
	}

	// Global app state
	let appState = $state({
		user: getInitialUserState(),
		trips: [],
		vehicles: [],
		drivers: [],
		mapsReady: false,
		mapInstances: {}
	});

	// Sync user state with localStorage
	$effect(() => {
		if (browser) {
			localStorage.setItem('userId', appState.user.id);
			localStorage.setItem('userName', appState.user.name);
			localStorage.setItem('userEmail', appState.user.email);
			localStorage.setItem('userRole', appState.user.role);
			localStorage.setItem('token', appState.user.token);
			localStorage.setItem('isLoggedIn', String(appState.user.isLoggedIn));
		}
	});

	// Reset user state
	function resetUserState() {
		appState.user.id = '';
		appState.user.name = '';
		appState.user.email = '';
		appState.user.role = '';
		appState.user.token = '';
		appState.user.isLoggedIn = false;
		appState.user.showPassword = false;
		appState.user.isSignup = false;
		appState.user.isLoading = false;
		toast.success('Logged out successfully');
	}

	// Fetch global data (vehicles, drivers, trips)
	async function fetchGlobalData() {
		appState.user.isLoading = true;
		try {
			const [vehiclesRes, driversRes, tripsRes] = await Promise.all([
				axios.get('/api/vehicles', { headers: { Authorization: `Bearer ${appState.user.token}` } }),
				axios.get('/api/drivers', { headers: { Authorization: `Bearer ${appState.user.token}` } }),
				axios.get('/api/trips', { headers: { Authorization: `Bearer ${appState.user.token}` } })
			]);

			appState.vehicles = vehiclesRes.data.success ? vehiclesRes.data.vehicles : [];
			appState.drivers = driversRes.data.success ? driversRes.data.drivers : [];
			appState.trips = tripsRes.data.success
				? await Promise.all(
						tripsRes.data.trips.map(async (trip) => ({
							...trip,
							startAddress: await geocodeLatLng(trip.startLocation),
							endAddress: await geocodeLatLng(trip.endLocation)
						}))
					)
				: [];
		} catch (error) {
			console.error('Failed to fetch global data:', error);
			toast.error('Failed to load application data');
		} finally {
			appState.user.isLoading = false;
		}
	}

	// Geocode helper
	async function geocodeLatLng(location) {
		if (!browser || !location?.lat || !location?.lng) return 'Unknown Location';
		try {
			const loader = await getGoogleMapsLoader();
			const google = await loader.load();
			const geocoder = new google.maps.Geocoder();
			return new Promise((resolve) => {
				geocoder.geocode(
					{ location: { lat: location.lat, lng: location.lng } },
					(results, status) => {
						resolve(
							status === 'OK' && results[0] ? results[0].formatted_address : 'Unknown Location'
						);
					}
				);
			});
		} catch (error) {
			console.error('Geocoding error:', error);
			return 'Unknown Location';
		}
	}

	// Initialize map for a trip
	async function initializeTripMap(tripId, mapElement) {
		if (!browser || !appState.mapsReady || !mapElement) return;
		try {
			const trip = appState.trips.find((t) => t._id === tripId);
			if (!trip) return;

			const loader = await getGoogleMapsLoader();
			const google = await loader.load();
			const map = new google.maps.Map(mapElement, {
				center: { lat: trip.startLocation.lat, lng: trip.startLocation.lng },
				zoom: 13,
				disableDefaultUI: true
			});

			const startMarker = new google.maps.Marker({
				position: { lat: trip.startLocation.lat, lng: trip.startLocation.lng },
				map,
				title: trip.startAddress || 'Start',
				icon: { url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' }
			});
			const endMarker = new google.maps.Marker({
				position: { lat: trip.endLocation.lat, lng: trip.endLocation.lng },
				map,
				title: trip.endAddress || 'End',
				icon: { url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }
			});

			const directionsService = new google.maps.DirectionsService();
			const directionsRenderer = new google.maps.DirectionsRenderer();
			directionsRenderer.setMap(map);
			directionsService.route(
				{
					origin: { lat: trip.startLocation.lat, lng: trip.startLocation.lng },
					destination: { lat: trip.endLocation.lat, lng: trip.endLocation.lng },
					travelMode: 'DRIVING'
				},
				(result, status) => {
					if (status === 'OK') {
						directionsRenderer.setDirections(result);
					} else {
						new google.maps.Polyline({
							path: [
								{ lat: trip.startLocation.lat, lng: trip.startLocation.lng },
								{ lat: trip.endLocation.lat, lng: trip.endLocation.lng }
							],
							geodesic: true,
							strokeColor: '#0000FF',
							strokeOpacity: 1.0,
							strokeWeight: 2
						}).setMap(map);
					}
				}
			);

			const bounds = new google.maps.LatLngBounds();
			bounds.extend({ lat: trip.startLocation.lat, lng: trip.startLocation.lng });
			bounds.extend({ lat: trip.endLocation.lat, lng: trip.endLocation.lng });
			map.fitBounds(bounds);

			appState.mapInstances[tripId] = map;
		} catch (error) {
			console.error('Failed to initialize map:', error);
			toast.error('Failed to load map');
		}
	}

	// Set mapsReady on mount
	$effect(() => {
		if (browser && !appState.mapsReady) {
			appState.mapsReady = true;
		}
	});

	// Set context
	setContext('appState', {
		appState,
		resetUserState,
		fetchGlobalData,
		geocodeLatLng,
		initializeTripMap
	});
</script>

{@render children()}
