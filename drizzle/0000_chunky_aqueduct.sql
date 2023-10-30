CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
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