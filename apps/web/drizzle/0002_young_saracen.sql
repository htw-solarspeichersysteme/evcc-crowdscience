CREATE TABLE `api_token` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`user_id` text(255) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer,
	`deleted_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
