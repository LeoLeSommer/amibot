import { useContext } from "react";

import {
  ServerConfigContext,
  type ServerConfigContextValue,
} from "../provider";

export default function useServerConfig(): ServerConfigContextValue {
  const value = useContext(ServerConfigContext);

  if (!value) {
    throw new Error("useServerConfig must be used within ServerConfigProvider");
  }

  return value;
}
