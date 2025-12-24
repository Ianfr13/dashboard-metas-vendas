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
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `goals_id` PRIMARY KEY(`id`)
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
	`currentRevenue` text DEFAULT ('0'),
	`currentSales` int DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sub_goals_id` PRIMARY KEY(`id`)
);
