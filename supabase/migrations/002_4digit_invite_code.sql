-- Change invite_code default from 8-char hex to 4-digit number (1000–9999)
ALTER TABLE couples
  ALTER COLUMN invite_code
  SET DEFAULT lpad((floor(random() * 9000) + 1000)::int::text, 4, '0');
