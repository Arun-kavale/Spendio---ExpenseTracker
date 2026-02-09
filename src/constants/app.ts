/**
 * App metadata from package.json (single source of truth for version/name).
 */
import packageJson from '../../package.json';

export const APP_VERSION = packageJson.version;
export const APP_NAME = packageJson.name;
