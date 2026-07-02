import { Redirect } from 'expo-router';

export default function Index() {
  // We will redirect to the auth flow or dashboard depending on auth state.
  // For now, redirect to the login page.
  return <Redirect href="/(auth)/entry" />;
}
