CREATE TYPE "public"."admin_role" AS ENUM('owner', 'admin');--> statement-breakpoint
CREATE TYPE "public"."challenge_kind" AS ENUM('permanent', 'flash');--> statement-breakpoint
CREATE TYPE "public"."challenge_type" AS ENUM('photo', 'text');--> statement-breakpoint
CREATE TYPE "public"."challenge_validation" AS ENUM('auto', 'manual');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "admin_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"party_id" uuid NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"invited_by" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	CONSTRAINT "admin_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "admin_invitations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "bonuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"party_id" uuid NOT NULL,
	"player_id" uuid,
	"team_id" uuid,
	"points" integer NOT NULL,
	"reason" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bonuses_single_target" CHECK (("bonuses"."player_id" is null) <> ("bonuses"."team_id" is null))
);
--> statement-breakpoint
ALTER TABLE "bonuses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"party_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"type" "challenge_type" NOT NULL,
	"points" integer NOT NULL,
	"validation" "challenge_validation" DEFAULT 'manual' NOT NULL,
	"expected_answer" text,
	"kind" "challenge_kind" DEFAULT 'permanent' NOT NULL,
	"flash_starts_at" timestamp with time zone,
	"flash_duration_min" integer,
	"start_notified_at" timestamp with time zone,
	"position" integer DEFAULT 0 NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "challenges_flash_fields" CHECK ("challenges"."kind" = 'permanent' or ("challenges"."flash_starts_at" is not null and "challenges"."flash_duration_min" > 0))
);
--> statement-breakpoint
ALTER TABLE "challenges" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "parties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"join_code" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"opened_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "parties_join_code_unique" UNIQUE("join_code")
);
--> statement-breakpoint
ALTER TABLE "parties" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "party_admins" (
	"party_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "admin_role" DEFAULT 'admin' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "party_admins_party_id_user_id_pk" PRIMARY KEY("party_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "party_admins" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"party_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "players" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
ALTER TABLE "push_subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"party_id" uuid NOT NULL,
	"challenge_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"status" "submission_status" DEFAULT 'pending' NOT NULL,
	"text_answer" text,
	"photo_path" text,
	"caption" text,
	"points_awarded" integer,
	"review_message" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "submissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"party_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"emoji" text,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "teams" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "admin_invitations" ADD CONSTRAINT "admin_invitations_party_id_parties_id_fk" FOREIGN KEY ("party_id") REFERENCES "public"."parties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_invitations" ADD CONSTRAINT "admin_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonuses" ADD CONSTRAINT "bonuses_party_id_parties_id_fk" FOREIGN KEY ("party_id") REFERENCES "public"."parties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonuses" ADD CONSTRAINT "bonuses_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonuses" ADD CONSTRAINT "bonuses_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonuses" ADD CONSTRAINT "bonuses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_party_id_parties_id_fk" FOREIGN KEY ("party_id") REFERENCES "public"."parties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parties" ADD CONSTRAINT "parties_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "party_admins" ADD CONSTRAINT "party_admins_party_id_parties_id_fk" FOREIGN KEY ("party_id") REFERENCES "public"."parties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "party_admins" ADD CONSTRAINT "party_admins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_party_id_parties_id_fk" FOREIGN KEY ("party_id") REFERENCES "public"."parties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_party_id_parties_id_fk" FOREIGN KEY ("party_id") REFERENCES "public"."parties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_party_id_parties_id_fk" FOREIGN KEY ("party_id") REFERENCES "public"."parties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_invitations_party_id_idx" ON "admin_invitations" USING btree ("party_id");--> statement-breakpoint
CREATE INDEX "bonuses_party_id_idx" ON "bonuses" USING btree ("party_id");--> statement-breakpoint
CREATE INDEX "challenges_party_id_idx" ON "challenges" USING btree ("party_id");--> statement-breakpoint
CREATE INDEX "party_admins_user_id_idx" ON "party_admins" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "players_party_id_user_id_key" ON "players" USING btree ("party_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "players_party_id_display_name_key" ON "players" USING btree ("party_id",lower("display_name"));--> statement-breakpoint
CREATE INDEX "players_team_id_idx" ON "players" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "push_subscriptions_player_id_idx" ON "push_subscriptions" USING btree ("player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "submissions_challenge_id_player_id_key" ON "submissions" USING btree ("challenge_id","player_id") WHERE "submissions"."status" <> 'rejected';--> statement-breakpoint
CREATE INDEX "submissions_party_id_created_at_idx" ON "submissions" USING btree ("party_id","created_at");--> statement-breakpoint
CREATE INDEX "submissions_player_id_idx" ON "submissions" USING btree ("player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "teams_party_id_name_key" ON "teams" USING btree ("party_id","name");--> statement-breakpoint
CREATE VIEW "public"."player_scores" WITH (security_invoker = true) AS (
    select
      p.id as player_id,
      p.party_id,
      p.team_id,
      (
        coalesce((select sum(s.points_awarded) from submissions s
                  where s.player_id = p.id and s.status = 'approved'), 0)
        + coalesce((select sum(b.points) from bonuses b
                    where b.player_id = p.id), 0)
      )::int as score
    from players p
  );--> statement-breakpoint
CREATE VIEW "public"."team_scores" WITH (security_invoker = true) AS (
    select
      t.id as team_id,
      t.party_id,
      (
        coalesce((select sum(ps.score) from player_scores ps
                  where ps.team_id = t.id), 0)
        + coalesce((select sum(b.points) from bonuses b
                    where b.team_id = t.id), 0)
      )::int as score
    from teams t
  );