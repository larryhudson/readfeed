CREATE TABLE `audio_files` (
	`id` integer PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`title` text,
	`duration_ms` integer,
	`duration` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`file_path` text
);
--> statement-breakpoint
CREATE TABLE `audio_items` (
	`id` integer PRIMARY KEY NOT NULL,
	`audio_file_id` integer,
	`title` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`audio_file_id`) REFERENCES `audio_files`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `content_item_audio_items` (
	`id` integer PRIMARY KEY NOT NULL,
	`content_item_id` integer,
	`audio_item_id` integer,
	`order` integer,
	FOREIGN KEY (`content_item_id`) REFERENCES `content_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`audio_item_id`) REFERENCES `audio_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `content_items` (
	`id` integer PRIMARY KEY NOT NULL,
	`feed_id` integer,
	`url` text,
	`title` text,
	`text_content` text,
	`document_file_id` integer,
	`type` text DEFAULT 'webpage' NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`feed_id`) REFERENCES `feeds`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`document_file_id`) REFERENCES `document_files`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `content_part_audio_items` (
	`id` integer PRIMARY KEY NOT NULL,
	`content_part_id` integer,
	`audio_item_id` integer,
	`order` integer,
	FOREIGN KEY (`content_part_id`) REFERENCES `content_parts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`audio_item_id`) REFERENCES `audio_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `content_parts` (
	`id` integer PRIMARY KEY NOT NULL,
	`content_item_id` integer,
	`title` text,
	`text` text,
	`order` integer,
	`audio_file_id` integer,
	FOREIGN KEY (`content_item_id`) REFERENCES `content_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`audio_file_id`) REFERENCES `audio_files`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `document_files` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`file_path` text
);
--> statement-breakpoint
CREATE TABLE `feeds` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`user_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`hashed_password` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`active_expires` blob NOT NULL,
	`idle_expires` blob NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`is_admin` integer DEFAULT false
);
--> statement-breakpoint
CREATE TABLE `waitlist_invitations` (
	`id` integer PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`waitlist_user_id` integer,
	`user_id` integer,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`sent_at` integer,
	`message` text,
	`invite_code` text,
	FOREIGN KEY (`waitlist_user_id`) REFERENCES `waitlist_users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `waitlist_users` (
	`id` integer PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`why_interested` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `waitlist_invitations_email_unique` ON `waitlist_invitations` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `waitlist_users_email_unique` ON `waitlist_users` (`email`);
