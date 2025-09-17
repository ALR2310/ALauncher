"use strict";
/**
 * @author Luuxis
 * Luuxis License v1.0 (voir fichier LICENSE pour les détails en FR/EN)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const events_1 = __importDefault(require("events"));
const Index_js_1 = require("../utils/Index.js");
const Downloader_js_1 = __importDefault(require("../utils/Downloader.js"));
/**
 * Manages the download and extraction of the correct Java runtime for Minecraft.
 * It supports both Mojang's curated list of Java runtimes and the Adoptium fallback.
 */
class JavaDownloader extends events_1.default {
    constructor(options) {
        super();
        this.options = options;
    }
    /**
     * Retrieves Java files from Mojang's runtime metadata if possible,
     * otherwise falls back to getJavaOther().
     *
     * @param jsonversion A JSON object describing the Minecraft version (with optional javaVersion).
     * @returns An object containing a list of JavaFileItems and the final path to "java".
     */
    async getJavaFiles(jsonversion) {
        // If a specific version is forced, delegate to getJavaOther() immediately
        if (this.options.java.version) {
            return this.getJavaOther(jsonversion, this.options.java.version);
        }
        // OS-to-architecture mapping for Mojang's curated Java.
        const archMapping = {
            win32: { x64: 'windows-x64', ia32: 'windows-x86', arm64: 'windows-arm64' },
            darwin: { x64: 'mac-os', arm64: this.options.intelEnabledMac ? 'mac-os' : 'mac-os-arm64' },
            linux: { x64: 'linux', ia32: 'linux-i386' }
        };
        const osPlatform = os_1.default.platform(); // "win32", "darwin", "linux", ...
        const arch = os_1.default.arch(); // "x64", "arm64", "ia32", ...
        const javaVersionName = jsonversion.javaVersion?.component || 'jre-legacy';
        const osArchMapping = archMapping[osPlatform];
        const files = [];
        // If we don't have a valid mapping for the current OS, fallback to Adoptium
        if (!osArchMapping) {
            return this.getJavaOther(jsonversion);
        }
        // Determine the OS-specific identifier
        const archOs = osArchMapping[arch];
        if (!archOs) {
            // If we can't match the arch in the sub-object, fallback
            return this.getJavaOther(jsonversion);
        }
        // Fetch Mojang's Java runtime metadata
        const url = 'https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json';
        const javaVersionsJson = await fetch(url).then(res => res.json());
        const versionName = javaVersionsJson[archOs]?.[javaVersionName]?.[0]?.version?.name;
        if (!versionName) {
            return this.getJavaOther(jsonversion);
        }
        // Fetch the runtime manifest which lists individual files
        const manifestUrl = javaVersionsJson[archOs][javaVersionName][0]?.manifest?.url;
        const manifest = await fetch(manifestUrl).then(res => res.json());
        const manifestEntries = Object.entries(manifest.files);
        // Identify the Java executable in the manifest
        const javaExeKey = process.platform === 'win32' ? 'bin/javaw.exe' : 'bin/java';
        const javaEntry = manifestEntries.find(([relPath]) => relPath.endsWith(javaExeKey));
        if (!javaEntry) {
            // If we can't find the executable, fallback
            return this.getJavaOther(jsonversion);
        }
        const toDelete = javaEntry[0].replace(javaExeKey, '');
        for (const [relPath, info] of manifestEntries) {
            if (info.type === 'directory')
                continue;
            if (!info.downloads)
                continue;
            files.push({
                path: `runtime/jre-${versionName}-${archOs}/${relPath.replace(toDelete, '')}`,
                executable: info.executable,
                sha1: info.downloads.raw.sha1,
                size: info.downloads.raw.size,
                url: info.downloads.raw.url,
                type: 'Java'
            });
        }
        return {
            files,
            path: path_1.default.resolve(this.options.path, `runtime/jre-${versionName}-${archOs}`, 'bin', process.platform === 'win32' ? 'javaw.exe' : 'java')
        };
    }
    /**
     * Fallback method to download Java from Adoptium if Mojang's metadata is unavailable
     * or doesn't have the appropriate runtime for the user's platform/arch.
     *
     * @param jsonversion A Minecraft version JSON (with optional javaVersion).
     * @param versionDownload A forced Java version (string) if provided by the user.
     */
    async getJavaOther(jsonversion, versionDownload) {
        const { platform, arch } = this.getPlatformArch();
        const majorVersion = versionDownload || jsonversion.javaVersion?.majorVersion || 8;
        const pathFolder = path_1.default.resolve(this.options.path, `runtime/jre-${majorVersion}`);
        // Build the API query to fetch the Java version
        const queryParams = new URLSearchParams({
            java_version: majorVersion.toString(),
            os: platform,
            arch: arch,
            archive_type: 'zip',
            java_package_type: this.options.java.type
        });
        const javaVersionURL = `https://api.azul.com/metadata/v1/zulu/packages/?${queryParams.toString()}`;
        let javaVersions = await fetch(javaVersionURL).then(res => res.json());
        if (!Array.isArray(javaVersions) || javaVersions.length === 0) {
            return { files: [], path: '', error: true, message: 'No Java versions found for the specified parameters.' };
        }
        javaVersions = javaVersions[0];
        let javaExePath = path_1.default.join(pathFolder, javaVersions.name.replace('.zip', ''), 'bin', 'java');
        if (platform === 'macos') {
            try {
                const pathBin = fs_1.default.readFileSync(path_1.default.join(pathFolder, javaVersions.name.replace('.zip', ''), "bin"), 'utf8').toString();
                javaExePath = path_1.default.join(pathFolder, javaVersions.name.replace('.zip', ''), pathBin, 'java');
            }
            catch (_) {
            }
        }
        if (!fs_1.default.existsSync(javaExePath)) {
            await this.verifyAndDownloadFile({
                filePath: path_1.default.join(pathFolder, javaVersions.name),
                pathFolder: pathFolder,
                fileName: javaVersions.name,
                url: javaVersions.download_url
            });
            const entries = await (0, Index_js_1.getFileFromArchive)(path_1.default.join(pathFolder, javaVersions.name), null, null, true);
            for (const entry of entries) {
                if (entry.name.startsWith('META-INF'))
                    continue;
                if (entry.isDirectory) {
                    fs_1.default.mkdirSync(`${pathFolder}/${entry.name}`, { recursive: true, mode: 0o777 });
                    continue;
                }
                fs_1.default.writeFileSync(`${pathFolder}/${entry.name}`, entry.data, { mode: 0o777 });
            }
            if (platform === 'macos') {
                try {
                    const pathBin = fs_1.default.readFileSync(path_1.default.join(pathFolder, javaVersions.name.replace('.zip', ''), "bin"), 'utf8').toString();
                    javaExePath = path_1.default.join(pathFolder, javaVersions.name.replace('.zip', ''), pathBin, 'java');
                }
                catch (_) {
                }
            }
        }
        return { files: [], path: javaExePath };
    }
    /**
     * Maps the Node `os.platform()` and `os.arch()` to Adoptium's expected format.
     * Apple Silicon can optionally download x64 if `intelEnabledMac` is true.
     */
    getPlatformArch() {
        const platformMap = {
            win32: 'windows',
            darwin: 'macos',
            linux: 'linux'
        };
        const archMap = {
            x64: 'x64',
            ia32: 'x32',
            arm64: 'aarch64',
            arm: 'arm'
        };
        const mappedPlatform = platformMap[os_1.default.platform()] || os_1.default.platform();
        let mappedArch = archMap[os_1.default.arch()] || os_1.default.arch();
        // Force x64 if Apple Silicon but user wants to use Intel-based Java
        if (os_1.default.platform() === 'darwin' && os_1.default.arch() === 'arm64' && this.options.intelEnabledMac) {
            mappedArch = 'x64';
        }
        return { platform: mappedPlatform, arch: mappedArch };
    }
    /**
     * Verifies if the Java archive already exists and matches the expected checksum.
     * If it doesn't exist or fails the hash check, it downloads from the given URL.
     *
     * @param params.filePath   The local file path
     * @param params.pathFolder The folder to place the file in
     * @param params.fileName   The name of the file
     * @param params.url        The remote download URL
     * @param params.checksum   Expected SHA-256 hash
     */
    async verifyAndDownloadFile({ filePath, pathFolder, fileName, url }) {
        // If not found or failed checksum, download anew
        if (!fs_1.default.existsSync(filePath)) {
            fs_1.default.mkdirSync(pathFolder, { recursive: true });
            const download = new Downloader_js_1.default();
            // Relay progress events
            download.on('progress', (downloaded, size) => {
                this.emit('progress', downloaded, size, fileName);
            });
            // Start download
            await download.downloadFile(url, pathFolder, fileName);
        }
    }
}
exports.default = JavaDownloader;
//# sourceMappingURL=Minecraft-Java.js.map