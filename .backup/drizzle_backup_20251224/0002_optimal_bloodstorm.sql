CREATE TABLE `custos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`canal` enum('marketing','comercial') NOT NULL,
	`tipo` varchar(100) NOT NULL,
	`valor_mensal` decimal(10,2) NOT NULL,
	`mes` int NOT NULL,
	`ano` int NOT NULL,
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `custos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `distribuicao_canal` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mes` int NOT NULL,
	`ano` int NOT NULL,
	`percentual_marketing` decimal(5,2) NOT NULL,
	`percentual_comercial` decimal(5,2) NOT NULL,
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `distribuicao_canal_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `funil_produtos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`funil_id` int NOT NULL,
	`produto_id` int NOT NULL,
	`tipo` enum('frontend','backend','downsell') NOT NULL,
	`taxa_take` decimal(5,2),
	`ordem` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `funil_produtos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `funis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`url` text,
	`ticket_medio` decimal(10,2),
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `funis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `metas_principais` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mes` int NOT NULL,
	`ano` int NOT NULL,
	`valor_meta` decimal(12,2) NOT NULL,
	`valor_atual` decimal(12,2) DEFAULT '0',
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `metas_principais_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sub_metas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meta_principal_id` int NOT NULL,
	`valor` decimal(12,2) NOT NULL,
	`atingida` int NOT NULL DEFAULT 0,
	`data_atingida` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sub_metas_id` PRIMARY KEY(`id`)
);
