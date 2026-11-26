import { ThemeProvider as NavigationThemeProvider } from "expo-router";
import { Stack } from "expo-router/js-stack";

import useNavigationTheme from "./useNavigationTheme";

export type AppNavigatorProps = {
  reduceMotion: boolean;
};

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
