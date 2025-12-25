CREATE TABLE `calculated_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`simulationParamsId` int NOT NULL,
	`scenario` enum('3M','4M','5M') NOT NULL,
	`period` enum('daily','weekly','monthly') NOT NULL,
	`week` int,
	`day` int,
	`requiredViews` int NOT NULL,
	`requiredLeads` int NOT NULL,
	`requiredClicks` int NOT NULL,
	`trafficInvestment` text NOT NULL,
	`expectedRevenue` text NOT NULL,
	`roi` text NOT NULL,
	`roas` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calculated_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` timestamp NOT NULL,
	`scenario` enum('3M','4M','5M') NOT NULL,
	`week` int NOT NULL,
	`marketingDirectSales` int NOT NULL DEFAULT 0,
	`commercialSales` int NOT NULL DEFAULT 0,
	`marketingDirectRevenue` text NOT NULL,
	`commercialRevenue` text NOT NULL,
	`actualViews` int DEFAULT 0,
	`actualLeads` int DEFAULT 0,
	`actualInvestment` text,
	`actualCPA` text,
	`actualCPL` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`scenario` enum('3M','4M','5M') NOT NULL,
	`period` enum('monthly','weekly','daily') NOT NULL,
	`targetRevenue` text NOT NULL,
	`targetSales` int NOT NULL,
	`targetMarketingSales` int NOT NULL,
	`targetCommercialSales` int NOT NULL,
	`subGoals` text,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gtm_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_name` varchar(100) NOT NULL,
	`event_data` text,
	`user_id` varchar(255),
	`session_id` varchar(255),
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`ip_address` varchar(45),
	`user_agent` text,
	`page_url` text,
	`referrer` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gtm_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`type` enum('front','upsell','high-ticket') NOT NULL,
	`channel` enum('marketing','comercial','both') NOT NULL DEFAULT 'both',
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `simulation_params` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`scenario` enum('3M','4M','5M') NOT NULL,
	`vslConversionRate` text NOT NULL,
	`tslConversionRate` text NOT NULL,
	`checkoutConversionRate` text NOT NULL,
	`upsellConversionRate` text NOT NULL,
	`sdrConversionRate` text NOT NULL,
	`targetCPA` text NOT NULL,
	`targetCPL` text NOT NULL,
	`avgCTR` text NOT NULL,
	`frontTicket` text NOT NULL,
	`upsellTicket` text NOT NULL,
	`avgTicket` text NOT NULL,
	`sdrDailyMeetings` int NOT NULL DEFAULT 4,
	`sdrCount` int NOT NULL DEFAULT 1,
	`closerCount` int NOT NULL DEFAULT 2,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `simulation_params_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sub_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`goalId` int NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('product','funnel','channel','team','other') NOT NULL,
	`targetRevenue` text NOT NULL,
	`targetSales` int NOT NULL,
	`currentRevenue` text,
	`currentSales` int,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sub_goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
