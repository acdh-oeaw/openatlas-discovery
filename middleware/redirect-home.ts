export default defineNuxtRouteMiddleware(() => {
	const localePath = useLocalePath();
	return navigateTo(localePath("/visualization?mode=map"), { replace: true });
});
