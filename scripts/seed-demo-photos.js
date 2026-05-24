#!/usr/bin/env node
/**
 * Seed demo photos for the entire Topping House family.
 *
 * For every active chore in the database this script:
 *   1. Uploads a "reference" photo to the reference-photos bucket
 *   2. Uploads a "clean" + "messy" submission photo to the submissions
 *      bucket (under the kid's path)
 *   3. Sets chore.reference_photo_path
 *   4. Updates every existing submission for that chore to point at
 *      either the clean or messy photo — deterministically by hashing
 *      the submission ID so the dashboard, queue, and detail pages all
 *      show real images instead of broken-image placeholders.
 *
 * Chore titles in the DB map to a photo-set name (one of the 11 sets in
 * `demo images/`). Multiple chore titles can share a photo set
 * (e.g. "Vacuum the hallway" and "Vacuum a common area").
 *
 * Run with:
 *
 *   SUPABASE_SERVICE_ROLE_KEY="eyJh…" \
 *     node scripts/seed-demo-photos.js
 *
 * Grab the service role key from:
 *   https://supabase.com/dashboard/project/lgougfxihmbiezlmvbvm/settings/api
 *   → "Project API keys" → service_role  (NOT the publishable key)
 *
 * The service role key bypasses RLS so we can write to the private
 * buckets without auth. Don't paste this key into the codebase; just
 * use it once and forget the env var.
 *
 * Idempotent — re-running overwrites cleanly via x-upsert.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lgougfxihmbiezlmvbvm.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY env var not set.');
  console.error(
    'Get it from Supabase → Project Settings → API → service_role key.'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const IMG_DIR = path.join(__dirname, '..', 'demo images');

// Map from chore title (as stored in the DB) to the photo-set prefix
// used in `demo images/` filenames. `null` = no demo photos available
// for this chore (it'll be skipped). The "Make bed" / Alice case is a
// special-named file set carried over from the original seed.
const CHORE_TO_PHOTO_SET = {
  // Bed / bedroom
  'Make bed': 'Alice',
  'Maintain bedroom (weekly)': 'Tidy bedroom floor',
  'Tidy bedroom floor': 'Tidy bedroom floor',

  // Pets, school, laundry
  'Feed the pet': 'Feed the pet',
  'Pack school backpack': 'Pack school backpack',
  'Put away clean laundry': 'Put away clean laundry',
  'Wash own laundry': 'Wash own laundry',

  // Whole-house chores
  'Sweep the front porch': 'Sweep the front porch',
  'Wipe the table': 'Wipe the table',
  'Vacuum a common area': 'Vacuum a common area',
  'Vacuum the hallway': 'Vacuum a common area',
  'Clean the bathroom counter + sink': 'Clean bathroom counter + sink',
  'Cook a simple meal': 'Cook a simple meal',

  // No demo photos for these (skip them — keeps the chore but no media)
  'Wash the car': null,
};

/**
 * Locate a file in IMG_DIR by photo-set name + state.
 * Tolerates: regular hyphen vs em-dash, double-dot typos, extra spaces.
 * Returns just the basename, or undefined if not found.
 */
function findFile(setName, state) {
  // Special case: the original Alice photos predate the naming convention.
  if (setName === 'Alice') {
    if (state === 'reference') return 'Alice Bedroom Clean.png';
    if (state === 'clean') return 'Alice clean up.png';
    if (state === 'messy') return 'Alice messy room.png';
  }
  const files = fs.readdirSync(IMG_DIR);
  // Allow either separator (- or —), any number of dots before png,
  // and forgive trailing whitespace.
  const escaped = setName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^${escaped}\\s*[—-]\\s*${state}\\.+png$`, 'i');
  return files.find((f) => re.test(f));
}

async function uploadFile(bucket, key, filePath) {
  const buf = fs.readFileSync(filePath);
  const { error } = await supabase.storage.from(bucket).upload(key, buf, {
    contentType: 'image/png',
    upsert: true,
  });
  if (error) throw new Error(`upload ${bucket}/${key} failed: ${error.message}`);
  console.log(`    → ${bucket}/${key}`);
}

// Deterministic clean-vs-messy choice for a submission. ~70% clean / 30%
// messy so the demo feels realistic without being uniformly perfect.
function isMessyByHash(submissionId) {
  const lastByte = parseInt(submissionId.replace(/-/g, '').slice(-2), 16);
  return lastByte < 0x4d; // 0x4d / 0xff ≈ 0.30
}

async function main() {
  console.log('Loading chores from DB...');
  const { data: chores, error: choresErr } = await supabase
    .from('chores')
    .select('id, family_id, kid_id, title, active')
    .eq('active', true);
  if (choresErr) throw choresErr;
  console.log(`Found ${chores.length} active chores.\n`);

  let totalSubsUpdated = 0;
  let skipped = 0;

  for (const chore of chores) {
    const setName = CHORE_TO_PHOTO_SET[chore.title];
    if (setName === undefined) {
      console.log(`  SKIP: unknown chore title "${chore.title}"`);
      skipped++;
      continue;
    }
    if (setName === null) {
      console.log(`  SKIP: no demo photos defined for "${chore.title}"`);
      skipped++;
      continue;
    }

    const refFile = findFile(setName, 'reference');
    const cleanFile = findFile(setName, 'clean');
    const messyFile = findFile(setName, 'messy');
    if (!refFile || !cleanFile || !messyFile) {
      console.log(
        `  SKIP: missing photos for set "${setName}" (ref=${refFile} clean=${cleanFile} messy=${messyFile})`
      );
      skipped++;
      continue;
    }

    const kidPrefix = chore.kid_id.slice(0, 8);
    console.log(`\nChore: "${chore.title}"  [kid ${kidPrefix}]  set "${setName}"`);

    const refPath = `${chore.family_id}/${chore.id}/reference.png`;
    const cleanPath = `${chore.family_id}/${chore.kid_id}/${chore.id}/demo-clean.png`;
    const messyPath = `${chore.family_id}/${chore.kid_id}/${chore.id}/demo-messy.png`;

    await uploadFile('reference-photos', refPath, path.join(IMG_DIR, refFile));
    await uploadFile('submissions', cleanPath, path.join(IMG_DIR, cleanFile));
    await uploadFile('submissions', messyPath, path.join(IMG_DIR, messyFile));

    // Point the chore at its new reference photo.
    const { error: choreUpErr } = await supabase
      .from('chores')
      .update({ reference_photo_path: refPath })
      .eq('id', chore.id);
    if (choreUpErr) throw choreUpErr;

    // Re-point every submission of this chore at either clean or messy.
    const { data: subs, error: subErr } = await supabase
      .from('submissions')
      .select('id')
      .eq('chore_id', chore.id);
    if (subErr) throw subErr;

    for (const sub of subs) {
      const photoPath = isMessyByHash(sub.id) ? messyPath : cleanPath;
      const { error: subUpErr } = await supabase
        .from('submissions')
        .update({ photo_path: photoPath })
        .eq('id', sub.id);
      if (subUpErr) throw subUpErr;
    }
    totalSubsUpdated += subs.length;
    console.log(`    Updated ${subs.length} submission rows`);
  }

  console.log('\n────────────────────────────────────');
  console.log(`✓ Done. Updated ${totalSubsUpdated} submissions across ${chores.length - skipped} chores.`);
  if (skipped > 0) {
    console.log(`  Skipped ${skipped} chores (no photo set defined or missing files).`);
  }
  console.log('  Refresh the app to see real photos everywhere.');
}

main().catch((err) => {
  console.error('\n✗ Failed:', err.message || err);
  process.exit(1);
});
