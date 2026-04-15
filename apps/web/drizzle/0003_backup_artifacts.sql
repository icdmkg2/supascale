CREATE TABLE `backup_artifacts` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text,
	`file_name` text NOT NULL,
	`backup_kind` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`status` text DEFAULT 'completed' NOT NULL,
	`storage_destination` text DEFAULT 'cloud' NOT NULL,
	`storage_id` text,
	`schedule_cron` text,
	`timezone` text,
	`completed_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
