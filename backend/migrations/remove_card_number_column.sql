-- Migration to remove card_number column from cards table
-- This migration removes the card_number field from the cards table

-- Drop the card_number column from the cards table
ALTER TABLE cards DROP COLUMN IF EXISTS card_number;

-- Add a comment to document this change
COMMENT ON TABLE cards IS 'Cards table without card_number field - removed in migration';
