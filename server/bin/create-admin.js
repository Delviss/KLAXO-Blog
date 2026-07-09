#!/usr/bin/env node
'use strict';

/**
 * Create (or reset) the first admin user (#16).
 *
 *   npm run create-admin -- --email you@klaxo.eu --password 'secret'
 *   ADMIN_EMAIL=you@klaxo.eu npm run create-admin        # prompts for password
 *
 * Never hardcodes credentials; reads from flags, then env, then a hidden prompt.
 */

const readline = require('readline');
const bcrypt = require('bcryptjs');
const { config } = require('../src/config');
const { pool } = require('../src/db/pool');
const Users = require('../src/db/users');

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

function prompt(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    if (hidden) {
      const onData = (char) => {
        char = String(char);
        if (['\n', '\r', ''].includes(char)) process.stdin.removeListener('data', onData);
        else process.stdout.write('\x1b[2K\x1b[200D' + question + '*'.repeat(rl.line.length));
      };
      process.stdin.on('data', onData);
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write('\n');
      resolve(answer.trim());
    });
  });
}

async function main() {
  let email = arg('email') || config.admin.email;
  let password = arg('password') || config.admin.password;

  if (!email) email = await prompt('Admin email: ');
  email = String(email).trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error(`Invalid email: ${email}`);
  }
  if (!password) password = await prompt('Admin password (min 10 chars): ', { hidden: true });
  if (!password || password.length < 10) {
    throw new Error('Password must be at least 10 characters.');
  }

  const hash = await bcrypt.hash(password, 12);
  const user = await Users.createUser({ email, passwordHash: hash, role: 'admin' });
  console.log(`✔ Admin ready: ${user.email} (${user.id})`);
}

main()
  .catch((err) => {
    console.error('x create-admin failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
