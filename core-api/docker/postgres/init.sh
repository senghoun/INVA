#!/bin/sh
set -eu
for database in "${POSTGRES_AUTH_DB:-inva_auth_db}" "${POSTGRES_HR_DB:-inva_hr_db}" "${POSTGRES_AC_DB:-inva_ac_db}" "${POSTGRES_CRM_DB:-inva_crm_db}" "${POSTGRES_IT_DB:-inva_it_db}" "${POSTGRES_PV_DB:-inva_pv_db}"; do
  case "$database" in ''|*[!a-zA-Z0-9_]*) echo 'Invalid database name' >&2; exit 1;; esac
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres -c "CREATE DATABASE \"$database\";"
done
