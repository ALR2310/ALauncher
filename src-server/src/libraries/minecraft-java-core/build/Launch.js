"use strict";
/**
 * @author Luuxis
 * Luuxis License v1.0 (voir fichier LICENSE pour les détails en FR/EN)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const Minecraft_Json_js_1 = __importDefault(require("./Minecraft/Minecraft-Json.js"));
const Minecraft_Libraries_js_1 = __importDefault(require("./Minecraft/Minecraft-Libraries.js"));
const Minecraft_Assets_js_1 = __importDefault(require("./Minecraft/Minecraft-Assets.js"));
const Minecraft_Loader_js_1 = __importDefault(require("./Minecraft/Minecraft-Loader.js"));
const Minecraft_Java_js_1 = __importDefault(require("./Minecraft/Minecraft-Java.js"));
const Minecraft_Bundle_js_1 = __importDefault(require("./Minecraft/Minecraft-Bundle.js"));
const Minecraft_Arguments_js_1 = __importDefault(require("./Minecraft/Minecraft-Arguments.js"));
const Index_js_1 = require("./utils/Index.js");
const Downloader_js_1 = __importDefault(require("./utils/Downloader.js"));
class Launch extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.isCancelled = false;
        this.minecraftProcess = null;
        this.currentDownloader = null;
        this.downloadPromise = null;
    }
    async Launch(opt) {
        this.isCancelled = false;
        this.minecraftProcess = null;
        this.currentDownloader = null;
        this.downloadPromise = null;
        const defaultOptions = {
            url: null,
            authenticator: null,
            timeout: 10000,
            path: '.Minecraft',
            version: 'latest_release',
            instance: null,
            detached: false,
            intelEnabledMac: false,
            downloadFileMultiple: 5,
            bypassOffline: false,
            loader: {
                path: './loader',
                type: null,
                build: 'latest',
                enable: false,
            },
            mcp: null,
            verify: false,
            ignored: [],
            JVM_ARGS: [],
            GAME_ARGS: [],
            java: {
                path: null,
                version: null,
                type: 'jre',
            },
            screen: {
                width: null,
                height: null,
                fullscreen: false,
            },
            memory: {
                min: '1G',
                max: '2G',
            },
            ...opt,
        };
        this.options = defaultOptions;
        this.options.path = path_1.default.resolve(this.options.path).replace(/\\/g, '/');
        if (this.options.mcp) {
            if (this.options.instance)
                this.options.mcp = `${this.options.path}/instances/${this.options.instance}/${this.options.mcp}`;
            else
                this.options.mcp = path_1.default.resolve(`${this.options.path}/${this.options.mcp}`).replace(/\\/g, '/');
        }
        if (this.options.loader.type) {
            this.options.loader.type = this.options.loader.type.toLowerCase();
            this.options.loader.build = this.options.loader.build.toLowerCase();
        }
        if (!this.options.authenticator)
            return this.emit('error', { error: 'Authenticator not found' });
        if (this.options.downloadFileMultiple < 1)
            this.options.downloadFileMultiple = 1;
        if (this.options.downloadFileMultiple > 30)
            this.options.downloadFileMultiple = 30;
        if (typeof this.options.loader.path !== 'string')
            this.options.loader.path = `./loader/${this.options.loader.type}`;
        if (this.options.java.version && typeof this.options.java.type !== 'string')
            this.options.java.type = 'jre';
        this.start();
    }
    async start() {
        if (this.isCancelled) {
            this.emit('cancelled', 'Launch has been cancelled');
            return;
        }
        let data = await this.DownloadGame();
        if (data.cancelled) {
            this.emit('cancelled', 'Launch has been cancelled');
            return;
        }
        if (data.error)
            return this.emit('error', data);
        if (this.isCancelled) {
            this.emit('cancelled', 'Launch has been cancelled');
            return;
        }
        let { minecraftJson, minecraftLoader, minecraftVersion, minecraftJava } = data;
        let minecraftArguments = await new Minecraft_Arguments_js_1.default(this.options).GetArguments(minecraftJson, minecraftLoader);
        if (minecraftArguments.error)
            return this.emit('error', minecraftArguments);
        let loaderArguments = await new Minecraft_Loader_js_1.default(this.options).GetArguments(minecraftLoader, minecraftVersion);
        if (loaderArguments.error)
            return this.emit('error', loaderArguments);
        let Arguments = [
            ...minecraftArguments.jvm,
            ...minecraftArguments.classpath,
            ...loaderArguments.jvm,
            minecraftArguments.mainClass,
            ...minecraftArguments.game,
            ...loaderArguments.game,
        ];
        let java = this.options.java.path ? this.options.java.path : minecraftJava.path;
        let logs = this.options.instance ? `${this.options.path}/instances/${this.options.instance}` : this.options.path;
        if (!fs_1.default.existsSync(logs))
            fs_1.default.mkdirSync(logs, { recursive: true });
        let argumentsLogs = Arguments.join(' ');
        argumentsLogs = argumentsLogs.replaceAll(this.options.authenticator?.access_token, '????????');
        argumentsLogs = argumentsLogs.replaceAll(this.options.authenticator?.client_token, '????????');
        argumentsLogs = argumentsLogs.replaceAll(this.options.authenticator?.uuid, '????????');
        argumentsLogs = argumentsLogs.replaceAll(this.options.authenticator?.xboxAccount?.xuid, '????????');
        argumentsLogs = argumentsLogs.replaceAll(`${this.options.path}/`, '');
        this.emit('data', `Launching with arguments ${argumentsLogs}`);
        if (this.isCancelled) {
            this.emit('cancelled', 'Launch has been cancelled');
            return;
        }
        this.minecraftProcess = (0, child_process_1.spawn)(java, Arguments, { cwd: logs, detached: this.options.detached });
        this.minecraftProcess.stdout?.on('data', (data) => this.emit('data', data.toString('utf-8')));
        this.minecraftProcess.stderr?.on('data', (data) => this.emit('data', data.toString('utf-8')));
        this.minecraftProcess.on('close', (code) => {
            this.minecraftProcess = null;
            if (!this.isCancelled)
                this.emit('close', 'Minecraft closed');
        });
    }
    async DownloadGame() {
        let InfoVersion = await new Minecraft_Json_js_1.default(this.options).GetInfoVersion();
        let loaderJson = null;
        if ('error' in InfoVersion) {
            return { error: InfoVersion.error };
        }
        let { json, version } = InfoVersion;
        let libraries = new Minecraft_Libraries_js_1.default(this.options);
        let bundle = new Minecraft_Bundle_js_1.default(this.options);
        let java = new Minecraft_Java_js_1.default(this.options);
        java.on('progress', (progress, size, element) => {
            this.emit('progress', progress, size, element);
        });
        java.on('extract', (progress) => {
            this.emit('extract', progress);
        });
        let gameLibraries = await libraries.Getlibraries(json);
        let gameAssetsOther = await libraries.GetAssetsOthers(this.options.url);
        let gameAssets = await new Minecraft_Assets_js_1.default(this.options).getAssets(json);
        let gameJava = this.options.java.path ? { files: [] } : await java.getJavaFiles(json);
        if (gameJava.error)
            return { error: gameJava.error };
        let filesList = await bundle.checkBundle([
            ...gameLibraries,
            ...gameAssetsOther,
            ...gameAssets,
            ...gameJava.files,
        ]);
        if (filesList.length > 0) {
            if (this.isCancelled)
                return { cancelled: true };
            this.currentDownloader = new Downloader_js_1.default();
            let totsize = await bundle.getTotalSize(filesList);
            this.currentDownloader.on('progress', (DL, totDL, element) => {
                this.emit('progress', DL, totDL, element);
            });
            this.currentDownloader.on('speed', (speed) => {
                this.emit('speed', speed);
            });
            this.currentDownloader.on('estimated', (time) => {
                this.emit('estimated', time);
            });
            this.currentDownloader.on('error', (e) => {
                this.emit('error', e);
            });
            this.downloadPromise = this.currentDownloader.downloadFileMultiple(filesList, totsize, this.options.downloadFileMultiple, this.options.timeout);
            await this.downloadPromise;
            this.currentDownloader = null;
            this.downloadPromise = null;
            if (this.isCancelled) {
                return { cancelled: true };
            }
        }
        if (this.options.loader.enable === true) {
            let loaderInstall = new Minecraft_Loader_js_1.default(this.options);
            loaderInstall.on('extract', (extract) => {
                this.emit('extract', extract);
            });
            loaderInstall.on('progress', (progress, size, element) => {
                this.emit('progress', progress, size, element);
            });
            loaderInstall.on('check', (progress, size, element) => {
                this.emit('check', progress, size, element);
            });
            loaderInstall.on('patch', (patch) => {
                this.emit('patch', patch);
            });
            let jsonLoader = await loaderInstall
                .GetLoader(version, this.options.java.path ? this.options.java.path : gameJava.path)
                .then((data) => data)
                .catch((err) => err);
            if (jsonLoader.error)
                return { error: jsonLoader.error };
            loaderJson = jsonLoader;
        }
        try {
            if (this.isCancelled)
                return { cancelled: true };
            if (this.options.verify)
                await bundle.checkFiles([...gameLibraries, ...gameAssetsOther, ...gameAssets, ...gameJava.files]);
            if (this.isCancelled)
                return { cancelled: true };
            let natives = await libraries.natives(gameLibraries);
            if (natives.length === 0)
                json.nativesList = false;
            else
                json.nativesList = true;
            if ((0, Index_js_1.isold)(json))
                new Minecraft_Assets_js_1.default(this.options).copyAssets(json);
            return {
                minecraftJson: json,
                minecraftLoader: loaderJson,
                minecraftVersion: version,
                minecraftJava: gameJava,
            };
        }
        catch (e) {
            if (this.isCancelled)
                return { cancelled: true };
            this.emit('error', e);
            return { error: e?.message || e };
        }
    }
    cancel() {
        if (this.isCancelled)
            return;
        this.isCancelled = true;
        if (this.currentDownloader) {
            this.emit('data', 'Cancelling downloads...');
            try {
                this.currentDownloader.cancel();
            }
            catch { }
        }
        if (this.minecraftProcess && !this.minecraftProcess.killed) {
            this.emit('data', 'Terminating Minecraft process...');
            try {
                this.minecraftProcess.kill('SIGTERM');
                setTimeout(() => {
                    if (this.minecraftProcess && !this.minecraftProcess.killed) {
                        if (process.platform === 'win32' && this.minecraftProcess.pid) {
                            require('child_process').exec(`taskkill /PID ${this.minecraftProcess.pid} /T /F`, () => { });
                        }
                        else {
                            this.minecraftProcess.kill('SIGKILL');
                        }
                    }
                }, 2000);
            }
            catch (error) {
                this.emit('data', `Failed to terminate process: ${error}`);
            }
        }
        this.currentDownloader = null;
        this.downloadPromise = null;
        this.emit('cancelled', 'Launch has been cancelled');
    }
}
exports.default = Launch;
//# sourceMappingURL=Launch.js.map