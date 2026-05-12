#!/usr/bin/env bash
# Membuat core Solr yang dibutuhkan JanusGraph/Atlas: vertex_index, edge_index, fulltext_index
# Konfigurasi: solr/atlas-config (Apache Atlas 2.3.0 distro/src/conf/solr)
# Catatan: image solr resmi tidak menyertakan curl — gunakan wget.
set -euo pipefail

SOLR_URL="${SOLR_URL:-http://solr:8983}"
ATLAS_TEMPLATE="${ATLAS_SOLR_TEMPLATE:-/atlas-solr}"
DATA_ROOT="${SOLR_DATA_ROOT:-/var/solr/data}"
CORES=(vertex_index edge_index fulltext_index)

echo "Menunggu Solr di ${SOLR_URL} ..."
ready=0
for _ in {1..90}; do
  if wget -q -T 5 -O /dev/null "${SOLR_URL}/solr/admin/info/system?wt=json" 2>/dev/null; then
    ready=1
    break
  fi
  sleep 2
done
if [[ "${ready}" -ne 1 ]]; then
  echo "ERROR: Solr tidak merespon setelah ~3 menit: ${SOLR_URL}" >&2
  exit 1
fi

list_cores_json() {
  wget -qO- "${SOLR_URL}/solr/admin/cores?action=LIST&wt=json"
}

for core in "${CORES[@]}"; do
  json="$(list_cores_json || true)"
  if echo "${json}" | grep -q "\"${core}\""; then
    echo "Core '${core}' sudah ada, lewati."
    continue
  fi

  inst="${DATA_ROOT}/${core}"
  echo "Membuat core '${core}' di ${inst} ..."
  rm -rf "${inst}"
  mkdir -p "${inst}/conf" "${inst}/data"
  cp -a "${ATLAS_TEMPLATE}/." "${inst}/conf/"
  chown -R 8983:8983 "${inst}" 2>/dev/null || true

  resp_file="/tmp/solr-create-${core}.txt"
  if ! wget -q -O "${resp_file}" --post-data="action=CREATE&name=${core}&instanceDir=${inst}&wt=json" \
    "${SOLR_URL}/solr/admin/cores" 2>/dev/null; then
    echo "ERROR: CREATE core '${core}' gagal (HTTP atau wget). Respons:" >&2
    cat "${resp_file}" 2>/dev/null >&2 || true
    exit 1
  fi
  if ! grep -q '"status":0' "${resp_file}"; then
    echo "ERROR: CREATE core '${core}' ditolak Solr (status bukan 0):" >&2
    cat "${resp_file}" >&2
    exit 1
  fi

  echo "Core '${core}' selesai."
done

echo "Semua core Atlas/JanusGraph untuk Solr siap."
