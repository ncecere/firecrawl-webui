CREATE TABLE `job_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`scheduled_job_id` text NOT NULL,
	`run_type` text DEFAULT 'scheduled' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`started_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`completed_at` text,
	`result_data` text,
	`error_message` text,
	`execution_time_ms` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`scheduled_job_id`) REFERENCES `scheduled_jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `scheduled_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`job_type` text NOT NULL,
	`job_config` text NOT NULL,
	`url` text,
	`urls` text,
	`schedule_type` text NOT NULL,
	`schedule_config` text NOT NULL,
	`timezone` text DEFAULT 'UTC' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_run_at` text,
	`next_run_at` text NOT NULL
);
