#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# MinIO bucket setup for Pathfinder
#
# Run this ONCE against the existing MinIO instance (shared with dishes-app).
# Requires the MinIO Client (mc) to be installed and accessible.
#   https://min.io/docs/minio/linux/reference/minio-mc.html
#
# Usage:
#   MINIO_ALIAS=myminio \
#   MINIO_URL=https://dishes-s3.collardserver.co.uk \
#   MINIO_ROOT_USER=admin \
#   MINIO_ROOT_PASS=your-admin-password \
#   bash setup_guide/minio-setup.sh
# ---------------------------------------------------------------------------

set -euo pipefail

ALIAS="${MINIO_ALIAS:-myminio}"
URL="${MINIO_URL:?MINIO_URL is required}"
ROOT_USER="${MINIO_ROOT_USER:?MINIO_ROOT_USER is required}"
ROOT_PASS="${MINIO_ROOT_PASS:?MINIO_ROOT_PASS is required}"
BUCKET="pathfinder"
SVC_USER="pathfinder-app"

echo "==> Configuring mc alias '${ALIAS}' → ${URL}"
mc alias set "${ALIAS}" "${URL}" "${ROOT_USER}" "${ROOT_PASS}"

# ── Bucket ──────────────────────────────────────────────────────────────────

if mc ls "${ALIAS}/${BUCKET}" &>/dev/null; then
  echo "==> Bucket '${BUCKET}' already exists, skipping creation"
else
  echo "==> Creating bucket '${BUCKET}'"
  mc mb "${ALIAS}/${BUCKET}"
fi

# ── Public read policy (anonymous GetObject only, no listing) ────────────────
# 'download' preset allows anonymous GET on objects but NOT ListBucket.
# This lets image URLs work in browsers without exposing the full bucket contents.

echo "==> Setting anonymous download policy on '${BUCKET}'"
mc anonymous set download "${ALIAS}/${BUCKET}"

# ── Service account scoped to this bucket ───────────────────────────────────
# Creates a MinIO service account (access key + secret) that can only read/write
# the pathfinder bucket. Use these credentials in Pathfinder's .env, NOT the root key.

echo "==> Creating service account '${SVC_USER}'"

# Inline IAM policy: allow all S3 actions on the pathfinder bucket only
POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::${BUCKET}/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::${BUCKET}"
    }
  ]
}
EOF
)

# Write policy to a temp file (mc admin policy requires a file path)
POLICY_FILE=$(mktemp /tmp/pathfinder-policy-XXXX.json)
echo "${POLICY}" > "${POLICY_FILE}"

# Create or update the policy
mc admin policy create "${ALIAS}" pathfinder-policy "${POLICY_FILE}" 2>/dev/null \
  || mc admin policy update "${ALIAS}" pathfinder-policy "${POLICY_FILE}"

rm "${POLICY_FILE}"

# Create the service account user if it doesn't exist
if ! mc admin user info "${ALIAS}" "${SVC_USER}" &>/dev/null; then
  SVC_PASS=$(openssl rand -base64 24)
  mc admin user add "${ALIAS}" "${SVC_USER}" "${SVC_PASS}"
  echo ""
  echo "  ⚠️  Service account password (save this — it won't be shown again):"
  echo "  Username : ${SVC_USER}"
  echo "  Password : ${SVC_PASS}"
  echo ""
fi

mc admin policy attach "${ALIAS}" pathfinder-policy --user "${SVC_USER}"

# Create an access key for the service account
echo "==> Generating access key for '${SVC_USER}'"
mc admin user svcacct add "${ALIAS}" "${SVC_USER}" --name "pathfinder-web"

echo ""
echo "==> Done. Add the printed Access Key and Secret Key to Pathfinder's environment:"
echo ""
echo "  S3_ENDPOINT=${URL}"
echo "  S3_BUCKET=${BUCKET}"
echo "  S3_ACCESS_KEY=<Access Key above>"
echo "  S3_SECRET_KEY=<Secret Key above>"
echo "  S3_PUBLIC_URL=${URL}   # or a separate CDN URL if you have one"
echo ""
echo "  NEXT_PUBLIC_APP_URL is separate — that's the Pathfinder web app URL, not MinIO."
