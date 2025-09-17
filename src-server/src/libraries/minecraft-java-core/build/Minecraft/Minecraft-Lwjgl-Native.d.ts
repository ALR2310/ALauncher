/**
 * @author Luuxis
 * Luuxis License v1.0 (voir fichier LICENSE pour les détails en FR/EN)
 */
/**
 * Minimal interface describing a single library entry in the version JSON.
 * Adjust as needed to reflect your actual library data structure.
 */
interface MinecraftLibrary {
    name: string;
}
/**
 * Represents the structure of a Minecraft version JSON.
 * You can expand this interface based on your actual usage.
 */
interface MinecraftVersion {
    libraries: MinecraftLibrary[];
}
/**
 * Options for constructing the MinecraftLoader, if needed.
 * Extend or remove fields to match your actual requirements.
 */
interface LoaderOptions {
    [key: string]: unknown;
}
/**
 * This class modifies the version JSON for ARM-based Linux systems,
 * specifically handling LWJGL library replacements for versions 2.9.x or custom LWJGL versions.
 */
export default class MinecraftLoader {
    private options;
    constructor(options: LoaderOptions);
    /**
     * Processes a Minecraft version JSON, removing default JInput and LWJGL entries
     * if needed, then injecting ARM-compatible LWJGL libraries from local JSON files.
     *
     * @param version A MinecraftVersion object containing a list of libraries
     * @returns The same version object, but with updated libraries for ARM-based Linux
     */
    ProcessJson(version: MinecraftVersion): Promise<MinecraftVersion>;
}
export {};
