#!/usr/bin/env node
/**
 * Start Metro from the project root using this script's location.
 * Avoids uv_cwd ENOENT when cwd is invalid (e.g. external drive unmounted).
 */
const path = require('path');
const { spawn } = require('child_process');

const projectRoot = path.resolve(path.join(__dirname, '..'));
process.chdir(projectRoot);

const cli = path.join(projectRoot, 'node_modules', 'react-native', 'cli.js');
const child = spawn(process.execPath, [cli, 'start'], {
  stdio: 'inherit',
  cwd: projectRoot,
  env: { ...process.env, REACT_NATIVE_PROJECT_ROOT: projectRoot },
});
child.on('exit', (code) => process.exit(code != null ? code : 0));