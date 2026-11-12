BEGIN;

ALTER TABLE pegawai
ADD COLUMN nama_tim_kerja varchar;

UPDATE pegawai
SET nama_tim_kerja = CASE
  WHEN jabatan_tim LIKE 'Wakil Ketua Tim Kerja %'
    THEN regexp_replace(jabatan_tim, '^Wakil Ketua Tim Kerja[[:space:]]+', '')
  WHEN jabatan_tim LIKE 'Ketua Tim Kerja %'
    THEN regexp_replace(jabatan_tim, '^Ketua Tim Kerja[[:space:]]+', '')
  ELSE jabatan_tim
END
WHERE jabatan_tim IS NOT NULL;

UPDATE pegawai AS p
SET jabatan_tim = CASE
  WHEN p.jabatan_tim LIKE 'Wakil Ketua Tim Kerja %' THEN 'Wakil Ketua Tim'
  WHEN p.jabatan_tim LIKE 'Ketua Tim Kerja %' THEN 'Ketua Tim'
  WHEN EXISTS (
    SELECT 1
    FROM master_jabatan AS j
    WHERE j.id = p.id_jabatan
      AND j.nama_jabatan = 'Kepala Sub Bagian Tata Usaha'
  ) THEN 'Kasubbag TU'
  ELSE NULL
END;

UPDATE pegawai
SET nama_tim_kerja = 'Tata Usaha'
WHERE jabatan_tim = 'Kasubbag TU'
  AND nama_tim_kerja IS NULL;

COMMIT;
