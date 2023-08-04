import fs from 'react-native-fs';

export const CACHE_DIRECTORY = `${fs.CachesDirectoryPath}/PersonaMediaCache`;

export async function get(fileName) {
    // TODO: Use fs.read for large files?
    const filePath = `${CACHE_DIRECTORY}/${fileName}`;
    try {
        return await fs.readFile(filePath);
    } catch (e) {
        console.log(e);
        return null;
    }
}

export async function set(fileName, contents) {
    // TODO: Use fs.write for large files?
    const filePath = `${CACHE_DIRECTORY}/${fileName}`;
    try {
        await fs.writeFile(filePath, contents);
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
}

export async function setup() {
    try {
        await fs.mkdir(CACHE_DIRECTORY, {NSURLIsExcludedFromBackupKey: true});
        console.log('Cache successfully setup');
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
}

export async function remove(fileName) {
    const filePath = `${CACHE_DIRECTORY}/${fileName}`;
    return fs
        .unlink(filePath)
        .then(() => {
            console.log('FILE DELETED');
        })
        .catch(err => {
            console.log(err);
        });
}

export async function clear() {
    const files = await fs.readDir(CACHE_DIRECTORY);
    return Promise.all(
        files.map(async file => {
            return await fs.unlink(file.path);
        }),
    );
}

export async function list() {
    const files = await fs.readDir(CACHE_DIRECTORY);
    files.forEach(file => {
        console.log(file.name);
    });
}
