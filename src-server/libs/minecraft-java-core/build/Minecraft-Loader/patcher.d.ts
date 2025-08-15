/**
 * @author Luuxis
 * Luuxis License v1.0 (voir fichier LICENSE pour les détails en FR/EN)
 */
import { EventEmitter } from 'events';
interface ForgePatcherOptions {
    path: string;
    loader: {
        type: string;
    };
}
interface Config {
    java: string;
    minecraft: string;
    minecraftJson: string;
}
interface ProfileData {
    client: string;
    [key: string]: any;
}
export interface Profile {
    data: Record<string, ProfileData>;
    processors?: any[];
    libraries?: Array<{
        name?: string;
    }>;
    path?: string;
}
export default class ForgePatcher extends EventEmitter {
    private readonly options;
    constructor(options: ForgePatcherOptions);
    patcher(profile: Profile, config: Config, neoForgeOld?: boolean): Promise<void>;
    check(profile: Profile): boolean;
    private setArgument;
    private computePath;
    private readJarManifest;
}
export {};
