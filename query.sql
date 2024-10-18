-- Alter the 'achievements' table to add the 'game_id' column
ALTER TABLE achievements
ADD COLUMN game_id INTEGER;

-- achievments table use joins
SELECT  * FROM achievements JOIN items ON achievements.game_id = items.game_id WHERE player_id = 1;