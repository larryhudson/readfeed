ALTER TABLE audio_items ADD `feed_id` integer REFERENCES feeds(id);
