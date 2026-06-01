#!/usr/bin/env bash
set -euo pipefail

if [[ "${ENVIRONMENT:-}" != "prod" && "${ENVIRONMENT:-}" != "production" ]]; then
  echo "ENVIRONMENT=prod is required" >&2
  exit 2
fi

repo_root="$(git rev-parse --show-toplevel)"
cd "${repo_root}"

source_sha="${SOURCE_SHA:-$(git rev-parse HEAD)}"
short_sha="${source_sha:0:12}"
image_date="${IMAGE_DATE:-$(date -u +%F)}"
image_tag="${IMAGE_TAG:-${short_sha}-prod-${image_date}}"
registry_push="${REGISTRY_PUSH:-10.152.183.28:5000}"
registry_pull="${REGISTRY_PULL:-registry.cars-operator-system.svc.cluster.local:5000}"

push_image="${registry_push}/p2ppsr/marscast:${image_tag}"
pull_image="${registry_pull}/p2ppsr/marscast:${image_tag}"

docker build -t "${push_image}" .
docker push "${push_image}"

cat > release-manifest.json <<EOF
{
  "source_sha": "${source_sha}",
  "environment": "prod",
  "image_tag": "${image_tag}",
  "image": "${pull_image}"
}
EOF

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    printf 'image_tag=%s\n' "${image_tag}"
    printf 'image=%s\n' "${pull_image}"
  } >> "${GITHUB_OUTPUT}"
fi

printf 'Pushed image %s\n' "${pull_image}"
