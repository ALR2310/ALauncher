interface ZipEntry {
    entryName: string;
    isDirectory: boolean;
    getData: () => Buffer;
}
export default class Unzipper {
    private entries;
    constructor(zipFilePath: string);
    getEntries(): ZipEntry[];
}
export {};
