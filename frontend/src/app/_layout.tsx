import { Archivo_600SemiBold } from "@expo-google-fonts/archivo/600SemiBold";
import { Archivo_700Bold } from "@expo-google-fonts/archivo/700Bold";
import { PublicSans_400Regular } from "@expo-google-fonts/public-sans/400Regular";
import { PublicSans_500Medium } from "@expo-google-fonts/public-sans/500Medium";
import { PublicSans_600SemiBold } from "@expo-google-fonts/public-sans/600SemiBold";
import { PublicSans_700Bold } from "@expo-google-fonts/public-sans/700Bold";
import { PublicSans_800ExtraBold } from "@expo-google-fonts/public-sans/800ExtraBold";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import ManifestSlotBridge from "@/features/server/components/ManifestSlotBridge";
import { ServerConfigProvider } from "@/features/server/provider";
import { setClientUpdateRequiredHandler } from "@/lib/api/client";
import { queryClient } from "@/lib/queryClient";
import ThemeProvider from "@/shared/theme/ThemeProvider";
import useAccessibilityPreferences from "@/shared/theme/useAccessibilityPreferences";

import "@/global.css";
import "@/i18n";

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 300, fade: true });

function RootLayout() {
  const { reduceMotion } = useAccessibilityPreferences();
  const [fontsLoaded, fontError] = useFonts({
    "Archivo-SemiBold": Archivo_600SemiBold,
    "Archivo-Bold": Archivo_700Bold,
    "PublicSans-Regular": PublicSans_400Regular,
    "PublicSans-Medium": PublicSans_500Medium,
    "PublicSans-SemiBold": PublicSans_600SemiBold,
    "PublicSans-Bold": PublicSans_700Bold,
    "PublicSans-ExtraBold": PublicSans_800ExtraBold,
  });

  useEffect(() => {
    setClientUpdateRequiredHandler(() => router.replace("/update"));

    return () => {
      setClientUpdateRequiredHandler(null);
    };
  }, []);

  useEffect(() => {
    if (!fontsLoaded && !fontError) {
      return;
    }

    void SplashScreen.hideAsync();
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ServerConfigProvider>
          <ManifestSlotBridge>
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
              <Stack.Screen name="update" options={{ gestureEnabled: false }} />
            </Stack>
          </ManifestSlotBridge>
        </ServerConfigProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default RootLayout;
