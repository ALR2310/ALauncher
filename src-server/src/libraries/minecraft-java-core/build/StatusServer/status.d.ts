/**
 * @author Luuxis
 * Luuxis License v1.0 (voir fichier LICENSE pour les détails en FR/EN)
 */
export default class status {
    ip: string;
    port: number;
    constructor(ip?: string, port?: number);
    getStatus(): Promise<unknown>;
}
