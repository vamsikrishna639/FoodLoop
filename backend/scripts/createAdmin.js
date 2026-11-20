// Creates one approved admin account. Admins cannot register through the
// app (the register route refuses the role) and there is no API route for
// it, so this script and the seed are the only ways to make one.
//
// Usage (from backend/):
//   npm run create-admin -- --name "Admin Name" --email admin2@example.com --password "secret123"
//   npm run create-admin -- --name "Admin Name" --email admin2@example.com --password "secret123" --phone 9876543210
//
// --phone is optional. The "--" after create-admin tells npm that what
// follows belongs to the script, not to npm itself.
//
// Safety:
// - It only ever adds one user. It never deletes or changes other data.
// - If the email is already used, it stops and changes nothing.
// - The password is never printed; only its bcrypt hash is saved.
require('dotenv').config(); // the same .env (MONGO_URI) the server reads
const { parseArgs } = require('node:util');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');

const USAGE =
  'Usage: npm run create-admin -- --name "Admin Name" --email admin@example.com --password "secret123" [--phone 9876543210]';

// The same express-validator rules as POST /api/auth/register
// (src/routes/authRoutes.js), so an admin account is never weaker than a
// normal one. The phone is optional here; the model needs one, so a
// placeholder is saved when it is left out.
const rules = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').trim().isEmail().withMessage('Enter a valid email').toLowerCase(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().trim().matches(/^[0-9+\- ]{7,15}$/).withMessage('Enter a valid phone number'),
];

// Print what is wrong (never the values themselves) and stop.
function fail(problems) {
  problems.forEach((p) => console.error(`  - ${p}`));
  console.error(`\n${USAGE}`);
  process.exit(1);
}

// Read --name, --email, --password and --phone from the command line.
function readOptions() {
  try {
    const { values } = parseArgs({
      options: {
        name: { type: 'string' },
        email: { type: 'string' },
        password: { type: 'string' },
        phone: { type: 'string' },
      },
      strict: true, // an unknown or misspelt option is an error
    });
    return values;
  } catch {
    // The parser's own message can repeat a stray value, which could be the
    // password, so a fixed message is shown instead.
    return fail(['Unknown option or a value without its --name / --email / --password / --phone flag.']);
  }
}

// Run the registration rules on the options, the way Express would run them
// on a request body. The sanitizers (trim, lower case) change req.body.
async function validate(values) {
  const req = { body: { ...values } };
  for (const rule of rules) await rule.run(req);
  const errors = validationResult(req).array().map((e) => e.msg);
  if (errors.length) fail(errors);
  return req.body;
}

async function main() {
  const input = await validate(readOptions());

  await connectDB();

  // Never overwrite an existing account (it could be someone else's).
  if (await User.exists({ email: input.email })) {
    console.error(`An account with the email ${input.email} already exists. Nothing was changed.`);
    process.exitCode = 1;
    return;
  }

  // Hashed exactly as in registration (authController.register).
  const passwordHash = await bcrypt.hash(input.password, 10);
  await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    role: 'admin',
    phone: input.phone || 'Not given', // the model needs a phone
    organization: 'Campus Admin',
    verificationStatus: 'approved', // an admin is approved from the start
  });

  console.log(`Admin account created for ${input.email}. Sign in with the password you chose.`);
}

main()
  .catch((err) => {
    console.error('Could not create the admin:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
