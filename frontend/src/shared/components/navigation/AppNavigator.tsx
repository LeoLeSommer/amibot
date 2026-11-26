import { ThemeProvider as NavigationThemeProvider, Stack } from "expo-router";

import useNavigationTheme from "./useNavigationTheme";

export type AppNavigatorProps = {
  reduceMotion: boolean;
};

/**
 * Navigator theme derived from the active app palette so screen backgrounds
 * follow the in-app color mode instead of the navigation library default.
 */
export default function AppNavigator({ reduceMotion }: AppNavigatorProps) {
  const navigationTheme = useNavigationTheme();

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: reduceMotion ? "none" : "default",
        }}
      >
        <Stack.Screen
          name="home"
          options={{ animation: reduceMotion ? "none" : "fade" }}
        />
        <Stack.Screen
          name="settings"
          options={{
            animation: reduceMotion ? "none" : "slide_from_right",
            gestureEnabled: !reduceMotion,
          }}
        />
        <Stack.Screen name="update" options={{ gestureEnabled: false }} />
      </Stack>
    </NavigationThemeProvider>
  );
}
