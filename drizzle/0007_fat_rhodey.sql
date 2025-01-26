ALTER TABLE `instance` ADD `last_job_run` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `instance` DROP COLUMN `bucket`;