// Database schema. See specifications/architecture.md for the data model.
//
// RLS is enabled on every table without policies: the browser can't read or
// write tables through the Supabase API. All access goes through the server
// with the direct Drizzle connection.

import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  pgEnum,
  pgTable,
  pgView,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  index,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const adminRole = pgEnum("admin_role", ["owner", "admin"]);
export const challengeType = pgEnum("challenge_type", ["photo", "text"]);
export const challengeValidation = pgEnum("challenge_validation", [
  "auto",
  "manual",
]);
export const challengeKind = pgEnum("challenge_kind", ["permanent", "flash"]);
export const submissionStatus = pgEnum("submission_status", [
  "pending",
  "approved",
  "rejected",
]);

export const parties = pgTable("parties", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  joinCode: text("join_code").notNull().unique(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  // Null while the party is a draft.
  openedAt: timestamp("opened_at", { withTimezone: true }),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => authUsers.id),
  createdAt: createdAt(),
}).enableRLS();

export const partyAdmins = pgTable(
  "party_admins",
  {
    partyId: uuid("party_id")
      .notNull()
      .references(() => parties.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    role: adminRole("role").notNull().default("admin"),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.partyId, t.userId] }),
    index("party_admins_user_id_idx").on(t.userId),
  ],
).enableRLS();

export const adminInvitations = pgTable(
  "admin_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    partyId: uuid("party_id")
      .notNull()
      .references(() => parties.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    token: text("token").notNull().unique(),
    invitedBy: uuid("invited_by")
      .notNull()
      .references(() => authUsers.id),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  },
  (t) => [index("admin_invitations_party_id_idx").on(t.partyId)],
).enableRLS();

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    partyId: uuid("party_id")
      .notNull()
      .references(() => parties.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull(),
    emoji: text("emoji"),
    position: integer("position").notNull().default(0),
  },
  (t) => [uniqueIndex("teams_party_id_name_key").on(t.partyId, t.name)],
).enableRLS();

export const players = pgTable(
  "players",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    partyId: uuid("party_id")
      .notNull()
      .references(() => parties.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id),
    // Anonymous Supabase user.
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("players_party_id_user_id_key").on(t.partyId, t.userId),
    uniqueIndex("players_party_id_display_name_key").on(
      t.partyId,
      sql`lower(${t.displayName})`,
    ),
    index("players_team_id_idx").on(t.teamId),
  ],
).enableRLS();

export const challenges = pgTable(
  "challenges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    partyId: uuid("party_id")
      .notNull()
      .references(() => parties.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    type: challengeType("type").notNull(),
    points: integer("points").notNull(),
    validation: challengeValidation("validation").notNull().default("manual"),
    // Text challenges only.
    expectedAnswer: text("expected_answer"),
    kind: challengeKind("kind").notNull().default("permanent"),
    // Flash challenges only.
    flashStartsAt: timestamp("flash_starts_at", { withTimezone: true }),
    flashDurationMin: integer("flash_duration_min"),
    startNotifiedAt: timestamp("start_notified_at", { withTimezone: true }),
    position: integer("position").notNull().default(0),
    hidden: boolean("hidden").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [
    index("challenges_party_id_idx").on(t.partyId),
    check(
      "challenges_flash_fields",
      sql`${t.kind} = 'permanent' or (${t.flashStartsAt} is not null and ${t.flashDurationMin} > 0)`,
    ),
  ],
).enableRLS();

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    partyId: uuid("party_id")
      .notNull()
      .references(() => parties.id, { onDelete: "cascade" }),
    challengeId: uuid("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    status: submissionStatus("status").notNull().default("pending"),
    textAnswer: text("text_answer"),
    photoPath: text("photo_path"),
    caption: text("caption"),
    pointsAwarded: integer("points_awarded"),
    reviewMessage: text("review_message"),
    // Null for automatic validation.
    reviewedBy: uuid("reviewed_by").references(() => authUsers.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    // A player can retry a challenge only after a rejection.
    uniqueIndex("submissions_challenge_id_player_id_key")
      .on(t.challengeId, t.playerId)
      .where(sql`${t.status} <> 'rejected'`),
    index("submissions_party_id_created_at_idx").on(t.partyId, t.createdAt),
    index("submissions_player_id_idx").on(t.playerId),
  ],
).enableRLS();

export const bonuses = pgTable(
  "bonuses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    partyId: uuid("party_id")
      .notNull()
      .references(() => parties.id, { onDelete: "cascade" }),
    playerId: uuid("player_id").references(() => players.id, {
      onDelete: "cascade",
    }),
    teamId: uuid("team_id").references(() => teams.id, {
      onDelete: "cascade",
    }),
    // Negative to remove points.
    points: integer("points").notNull(),
    reason: text("reason").notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => authUsers.id),
    createdAt: createdAt(),
  },
  (t) => [
    index("bonuses_party_id_idx").on(t.partyId),
    check(
      "bonuses_single_target",
      sql`(${t.playerId} is null) <> (${t.teamId} is null)`,
    ),
  ],
).enableRLS();

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    // Language of the notifications sent to this device.
    locale: text("locale").notNull().default("en"),
    createdAt: createdAt(),
  },
  (t) => [index("push_subscriptions_player_id_idx").on(t.playerId)],
).enableRLS();

// Scores are computed on read. A team's score uses its current players, so
// points follow a player who changes team.
export const playerScores = pgView("player_scores", {
  playerId: uuid("player_id").notNull(),
  partyId: uuid("party_id").notNull(),
  teamId: uuid("team_id").notNull(),
  score: integer("score").notNull(),
})
  .with({ securityInvoker: true })
  .as(sql`
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
  `);

export const teamScores = pgView("team_scores", {
  teamId: uuid("team_id").notNull(),
  partyId: uuid("party_id").notNull(),
  score: integer("score").notNull(),
})
  .with({ securityInvoker: true })
  .as(sql`
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
  `);
