ALTER TABLE `scheduled_jobs` ADD `api_endpoint` text DEFAULT 'http://localhost:3002';
--> statement-breakpoint
UPDATE `scheduled_jobs` SET `api_endpoint` = 'http://localhost:3002' WHERE `api_endpoint` IS NULL;
