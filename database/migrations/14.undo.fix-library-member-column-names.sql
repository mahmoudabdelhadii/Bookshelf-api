-- Undo library_member column name fix

ALTER TABLE server."library_member" 
RENAME COLUMN "join_date" TO "joined_at";