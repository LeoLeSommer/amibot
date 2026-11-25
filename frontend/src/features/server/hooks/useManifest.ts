import { useQuery } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/errors";
import { fetchManifest } from "@/lib/api/manifest";

import { serverQueryKeys } from "../queryKeys";

import useServerConfig from "./useServerConfig";

export default function useManifest() {
  const { serverUrl } = useServerConfig();

  return useQuery({
    queryKey: serverQueryKeys.manifest(serverUrl),
    queryFn: fetchManifest,
    enabled: Boolean(serverUrl),
    retry: (failureCount, error) =>
      !(
        error instanceof ApiError &&
        (error.status === 426 || error.code === "invalid_manifest")
      ) && failureCount < 1,
  });
}
