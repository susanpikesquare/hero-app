#!/usr/bin/env bash
#
# Upload Alice's three demo photos to Supabase Storage.
#
# Run once:
#
#   SUPABASE_SERVICE_ROLE_KEY="eyJh…" \
#     bash scripts/seed-alice-photos.sh
#
# Grab the service role key from:
#   https://supabase.com/dashboard/project/lgougfxihmbiezlmvbvm/settings/api
#   → "Project API keys" → service_role  (NOT the publishable key)
#
# The service role key bypasses RLS so we can write to the private buckets
# without authenticating as a specific user. Don't paste this key into
# the codebase or share it; just use it once and forget the env var.

set -euo pipefail

if [[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  echo "ERROR: SUPABASE_SERVICE_ROLE_KEY env var not set." >&2
  echo "Get it from Supabase → Project Settings → API → service_role key." >&2
  exit 1
fi

SUPABASE_URL="https://lgougfxihmbiezlmvbvm.supabase.co"
FAMILY_ID="14b0ea74-69d1-48c4-bd51-36522510237d"
ALICE_ID="10826fa0-5fa6-43a1-a75e-f336178d3681"
MAKE_BED_CHORE="c19a9692-4f56-4f0e-b168-dbb6117cf776"
IMG_DIR="$(cd "$(dirname "$0")/../demo images" && pwd)"

upload() {
  local bucket="$1"
  local key="$2"
  local file="$3"
  echo "→ ${bucket}/${key}"
  # x-upsert: true so re-running this script overwrites cleanly.
  curl --fail-with-body --silent --show-error \
    -X POST \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: image/png" \
    -H "x-upsert: true" \
    --data-binary @"${file}" \
    "${SUPABASE_URL}/storage/v1/object/${bucket}/${key}" \
    | head -c 200
  echo
}

upload "reference-photos" \
  "${FAMILY_ID}/${MAKE_BED_CHORE}/reference.png" \
  "${IMG_DIR}/Alice Bedroom Clean.png"

upload "submissions" \
  "${FAMILY_ID}/${ALICE_ID}/${MAKE_BED_CHORE}/cleanup-demo.png" \
  "${IMG_DIR}/Alice clean up.png"

upload "submissions" \
  "${FAMILY_ID}/${ALICE_ID}/${MAKE_BED_CHORE}/messy-demo.png" \
  "${IMG_DIR}/Alice messy room.png"

echo
echo "✓ All three Alice photos uploaded."
echo "  Refresh https://hero-app-pied-three.vercel.app/app — Alice's"
echo "  Make-bed chore now shows the clean reference, and her two demo"
echo "  submissions will render real images."
