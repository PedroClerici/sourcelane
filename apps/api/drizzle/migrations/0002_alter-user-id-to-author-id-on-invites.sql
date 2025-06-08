ALTER TABLE "invites" RENAME COLUMN "user_id" TO "author_id";--> statement-breakpoint
ALTER TABLE "invites" DROP CONSTRAINT "invites_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;