CREATE TABLE `extracted_loading_session` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`start_time` integer,
	`end_time` integer,
	`duration` integer,
	`instance_id` text(255) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer,
	`deleted_at` integer,
	FOREIGN KEY (`instance_id`) REFERENCES `instance`(`id`) ON UPDATE no action ON DELETE no action
);
