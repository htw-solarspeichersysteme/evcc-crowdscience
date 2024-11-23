CREATE TABLE `dashboard` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`user_id` text(255) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer,
	`deleted_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `instance` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`bucket` text(255),
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `loading_session` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`instance_id` text(255) NOT NULL,
	`start_time` integer,
	`end_time` integer,
	`location` text(255),
	`vehicle` text(255),
	`energy` real,
	`duration` text(255),
	`sun_percentage` real,
	`price` real,
	`price_per_kwh` real,
	`co2_per_kwh` real,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer,
	`deleted_at` integer,
	FOREIGN KEY (`instance_id`) REFERENCES `instance`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`first_name` text(255),
	`last_name` text(255),
	`email` text(255) NOT NULL,
	`password_hash` text(255),
	`is_admin` integer DEFAULT false,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer,
	`deleted_at` integer
);
