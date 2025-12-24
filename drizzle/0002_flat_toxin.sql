ALTER TABLE `daily_results` MODIFY COLUMN `marketingDirectRevenue` text NOT NULL;--> statement-breakpoint
ALTER TABLE `daily_results` MODIFY COLUMN `commercialRevenue` text NOT NULL;--> statement-breakpoint
ALTER TABLE `daily_results` MODIFY COLUMN `actualInvestment` text;--> statement-breakpoint
ALTER TABLE `daily_results` MODIFY COLUMN `actualCPA` text;--> statement-breakpoint
ALTER TABLE `daily_results` MODIFY COLUMN `actualCPL` text;--> statement-breakpoint
ALTER TABLE `simulation_params` MODIFY COLUMN `vslConversionRate` text NOT NULL;--> statement-breakpoint
ALTER TABLE `simulation_params` MODIFY COLUMN `tslConversionRate` text NOT NULL;--> statement-breakpoint
ALTER TABLE `simulation_params` MODIFY COLUMN `checkoutConversionRate` text NOT NULL;--> statement-breakpoint
ALTER TABLE `simulation_params` MODIFY COLUMN `upsellConversionRate` text NOT NULL;--> statement-breakpoint
ALTER TABLE `simulation_params` MODIFY COLUMN `sdrConversionRate` text NOT NULL;--> statement-breakpoint
ALTER TABLE `simulation_params` MODIFY COLUMN `targetCPA` text NOT NULL;--> statement-breakpoint
ALTER TABLE `simulation_params` MODIFY COLUMN `targetCPL` text NOT NULL;--> statement-breakpoint
ALTER TABLE `simulation_params` MODIFY COLUMN `avgCTR` text NOT NULL;--> statement-breakpoint
ALTER TABLE `simulation_params` MODIFY COLUMN `frontTicket` text NOT NULL;--> statement-breakpoint
ALTER TABLE `simulation_params` MODIFY COLUMN `upsellTicket` text NOT NULL;--> statement-breakpoint
ALTER TABLE `simulation_params` MODIFY COLUMN `avgTicket` text NOT NULL;