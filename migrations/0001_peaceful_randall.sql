CREATE TABLE "blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"block_number" integer NOT NULL,
	"block_hash" varchar NOT NULL,
	"previous_hash" varchar NOT NULL,
	"merkle_root" varchar NOT NULL,
	"timestamp" timestamp DEFAULT now(),
	"nonce" integer NOT NULL,
	"difficulty" integer DEFAULT 4,
	"transaction_count" integer DEFAULT 0,
	"miner" varchar,
	"reward" integer DEFAULT 100,
	CONSTRAINT "blocks_block_number_unique" UNIQUE("block_number"),
	CONSTRAINT "blocks_block_hash_unique" UNIQUE("block_hash")
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "block_hash" varchar;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "block_number" integer;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "transaction_hash" varchar;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "gas_used" integer DEFAULT 21000;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_miner_users_id_fk" FOREIGN KEY ("miner") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;