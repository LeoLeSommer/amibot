import { useQueryClient } from "@tanstack/react-query";
import { createContext, useEffect, useState, type ReactNode } from "react";
import { Platform } from "react-native";

import { setApiBaseUrl } from "@/lib/api/client";
import {
  normalizeServerUrl,
  resolveServerUrl,
  type ServerUrlSource,
} from "@/lib/api/serverUrl";

import {
  clearServerUrl,
  loadServerUrl,
  saveServerUrl,
} from "./services/serverConfig";

export type ServerConfigContextValue = {
  serverUrl: string | null;
  source: ServerUrlSource;
  isLoading: boolean;
  connect: (url: string) => Promise<void>;
  disconnect: () => Promise<void>;
};

export const ServerConfigContext =
  createContext<ServerConfigContextValue | null>(null);

type ServerConfigState = {
  serverUrl: string | null;
  source: ServerUrlSource;
  isLoading: boolean;
};

export function ServerConfigProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<ServerConfigState>({
    serverUrl: null,
    source: "none",
    isLoading: true,
  });

  useEffect(() => {
    let active = true;

    void loadServerUrl()
      .then((storedUrl) => {
        if (!active) {
          return;
        }

        const resolved = resolveServerUrl({
          storedUrl,
          envUrl: process.env.EXPO_PUBLIC_AMIBOT_SERVER_URL,
          webOrigin: Platform.OS === "web" ? globalThis.location?.origin : null,
          platform: Platform.OS,
        });

        setApiBaseUrl(resolved.url);
        setState({
          serverUrl: resolved.url,
          source: resolved.source,
          isLoading: false,
        });
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setApiBaseUrl(null);
        setState({ serverUrl: null, source: "none", isLoading: false });
      });

    return () => {
      active = false;
    };
  }, []);

  const connect = async (url: string): Promise<void> => {
    const normalized = normalizeServerUrl(url);
    if (!normalized) {
      return;
    }

    saveServerUrl(normalized);
    setApiBaseUrl(normalized);
    queryClient.clear();
    setState({ serverUrl: normalized, source: "stored", isLoading: false });
  };

  const disconnect = async (): Promise<void> => {
    clearServerUrl();
    setApiBaseUrl(null);
    queryClient.clear();
    setState({ serverUrl: null, source: "none", isLoading: false });
  };

  return (
    <ServerConfigContext.Provider value={{ ...state, connect, disconnect }}>
      {children}
    </ServerConfigContext.Provider>
  );
}
