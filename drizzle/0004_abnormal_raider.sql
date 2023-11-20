/*
 SQLite does not support "Drop not null from column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html
                  https://stackoverflow.com/questions/2083543/modify-a-columns-type-in-sqlite3

 Due to that we don't generate migration automatically and it has to be done manually
PRAGMA foreign_keys=off;
BEGIN TRANSACTION;
CREATE TABLE new_content_items (
    id integer PRIMARY KEY NOT NULL,
    feed_id integer,
    url text,  -- Removed NOT NULL constraint
    title text,
    text_content text,
    document_file_id integer,
    type text DEFAULT 'webpage' NOT NULL,
    created_at integer DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feed_id) REFERENCES feeds(id) ON UPDATE no action ON DELETE no action,
    FOREIGN KEY (document_file_id) REFERENCES document_files(id) ON UPDATE no action ON DELETE no action
);
INSERT INTO new_content_items SELECT * FROM content_items;
DROP TABLE content_items;
ALTER TABLE new_content_items RENAME TO content_items;
COMMIT;
PRAGMA foreign_keys=on;
*/
SELECT * from content_items;
