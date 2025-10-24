/**
 * @author Luuxis
 * Luuxis License v1.0 (voir fichier LICENSE pour les détails en FR/EN)
 */
export type MicrosoftClientType = 'electron' | 'nwjs' | 'terminal';
export interface MinecraftSkin {
    id?: string;
    state?: string;
    url?: string;
    variant?: string;
    alias?: string;
    base64?: string;
}
export interface MinecraftProfile {
    id: string;
    name: string;
    skins?: MinecraftSkin[];
    capes?: MinecraftSkin[];
}
export interface AuthError {
    error: string;
    errorType?: string;
    [key: string]: any;
}
export interface AuthResponse {
    access_token: string;
    client_token: string;
    uuid: string;
    name: string;
    refresh_token: string;
    user_properties: string;
    meta: {
        type: 'Xbox';
        access_token_expires_in: number;
        demo: boolean;
    };
    xboxAccount: {
        xuid: string;
        gamertag: string;
        ageGroup: string;
    };
    profile: {
        skins?: MinecraftSkin[];
        capes?: MinecraftSkin[];
    };
}
export default class Microsoft {
    client_id: string;
    type: MicrosoftClientType;
    /**
     * Creates a Microsoft auth instance.
     * @param client_id Your Microsoft OAuth client ID (default: '00000000402b5328' if none provided).
     */
    constructor(client_id: string);
    /**
     * Opens a GUI (Electron or NW.js) or uses terminal approach to fetch an OAuth2 code,
     * and then retrieves user information from Microsoft if successful.
     *
     * @param type The environment to open the OAuth window. Defaults to the auto-detected type.
     * @param url  The full OAuth2 authorization URL. If not provided, a default is used.
     * @returns    An object with user data on success, or false if canceled.
     */
    getAuth(type?: MicrosoftClientType, url?: string): Promise<AuthResponse | AuthError | false>;
    /**
     * Exchanges an OAuth2 authorization code for an access token, then retrieves account information.
     * @param code The OAuth2 authorization code returned by Microsoft.
     * @returns    The authenticated user data or an error object.
     */
    private exchangeCodeForToken;
    /**
     * Refreshes the user's session if the token has expired or is about to expire.
     * Otherwise, simply fetches the user's profile.
     *
     * @param acc A previously obtained AuthResponse object.
     * @returns   Updated AuthResponse (with new token if needed) or an error object.
     */
    refresh(acc: AuthResponse | any): Promise<AuthResponse | AuthError>;
    /**
     * Retrieves and assembles the full account details (Xbox Live, XSTS, Minecraft).
     * @param oauth2 The token object returned by the Microsoft OAuth endpoint.
     * @returns      A fully populated AuthResponse object or an error.
     */
    private getAccount;
    getProfile(mcLogin: {
        access_token: string;
    }): Promise<MinecraftProfile | AuthError>;
}
