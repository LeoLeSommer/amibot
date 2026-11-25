import { createContext } from "react";

/**
 * Tracks how many `GlassSurface` components enclose the current subtree.
 * Glass chrome must never nest; `GlassSurface` logs a development warning when
 * this is greater than zero.
 */
export const GlassDepthContext = createContext(0);
