import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');

export const readData = async (filename) => {
    try {
        const filePath = path.join(DATA_DIR, filename);
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // Return empty array if file doesn't exist
            await fs.writeFile(path.join(DATA_DIR, filename), '[]');
            return [];
        }
        throw error;
    }
};

export const writeData = async (filename, data) => {
    try {
        const filePath = path.join(DATA_DIR, filename);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.warn(`Failed to write to ${filename} (likely read-only FS):`, error.message);
        // Do not throw, so the app continues functioning (in-memory data flow)
    }
};
