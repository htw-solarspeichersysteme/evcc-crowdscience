DROP TABLE `api_token`;--> statement-breakpoint
DROP TABLE `dashboard`;--> statement-breakpoint
DROP TABLE `extracted_loading_session`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `extracted_loading_session` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`start_time` integer NOT NULL,
	`end_time` integer NOT NULL,
	`duration` integer NOT NULL,
	`instance_id` text(255) NOT NULL,
	`component_id` text(255) NOT NULL,
	`start_soc` real,
	`end_soc` real,
	`start_range` real,
	`end_range` real,
	`limit_soc` real,
	`charged_energy` real,
	`session_energy` real,
	`max_charge_power` real,
	`max_phases_active` real,
	`mode` text(255),
	`price` real,
	`solar_percentage` real,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer,
	`deleted_at` integer,
	FOREIGN KEY (`instance_id`) REFERENCES `instance`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=ON;