import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull().unique(),
  username: text("username").notNull().unique(),
  bio: text("bio").default(""),
  avatarUrl: text("avatar_url").default(""),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  skillTags: text("skill_tags").array().default(sql`'{}'::text[]`),
  lensHandle: text("lens_handle").default(""),
  farcasterHandle: text("farcaster_handle").default(""),
  xHandle: text("x_handle").default(""),
  isOnboarded: boolean("is_onboarded").default(false),
  tier: text("tier").default("explorer").notNull(),
  role: text("role").default("contributor").notNull(),
  region: text("region").default(""),
  city: text("city").default(""),
  referralCode: text("referral_code").default(""),
  referralsCount: integer("referrals_count").default(0).notNull(),
  contentCount: integer("content_count").default(0).notNull(),
  eventsCount: integer("events_count").default(0).notNull(),
  sponsorLeadsCount: integer("sponsor_leads_count").default(0).notNull(),
  totalPoints: integer("total_points").default(0).notNull(),
  questsCompleted: integer("quests_completed").default(0).notNull(),
  stipend: integer("stipend").default(0),
  college: text("college").default(""),
  telegramHandle: text("telegram_handle").default(""),
});

export const forumCategories = pgTable("forum_categories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").default(""),
  slug: text("slug").notNull().unique(),
  icon: text("icon").default("MessageSquare"),
  topicCount: integer("topic_count").default(0),
});

export const forumTopics = pgTable("forum_topics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: uuid("category_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url").default(""),
  authorId: uuid("author_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isPinned: boolean("is_pinned").default(false),
  replyCount: integer("reply_count").default(0),
  lastReplyAt: timestamp("last_reply_at"),
});

export const forumReplies = pgTable("forum_replies", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  topicId: uuid("topic_id").notNull(),
  content: text("content").notNull(),
  authorId: uuid("author_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  parentReplyId: uuid("parent_reply_id"),
});

export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  userId: uuid("user_id").notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quests = pgTable("quests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").default(""),
  category: text("category").notNull(),
  points: integer("points").default(0).notNull(),
  targetCount: integer("target_count").default(1).notNull(),
  difficulty: text("difficulty").default("easy").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const questCompletions = pgTable("quest_completions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  questId: uuid("quest_id").notNull(),
  userId: uuid("user_id").notNull(),
  status: text("status").default("in_progress").notNull(),
  progress: integer("progress").default(0).notNull(),
  completedAt: timestamp("completed_at"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, joinedAt: true });
export const insertCategorySchema = createInsertSchema(forumCategories).omit({ id: true, topicCount: true });
export const insertTopicSchema = createInsertSchema(forumTopics).omit({ id: true, createdAt: true, replyCount: true, lastReplyAt: true });
export const insertReplySchema = createInsertSchema(forumReplies).omit({ id: true, createdAt: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true });
export const insertQuestSchema = createInsertSchema(quests).omit({ id: true, createdAt: true });
export const insertQuestCompletionSchema = createInsertSchema(questCompletions).omit({ id: true, startedAt: true, completedAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type ForumCategory = typeof forumCategories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type ForumTopic = typeof forumTopics.$inferSelect;
export type InsertTopic = z.infer<typeof insertTopicSchema>;
export type ForumReply = typeof forumReplies.$inferSelect;
export type InsertReply = z.infer<typeof insertReplySchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Quest = typeof quests.$inferSelect;
export type InsertQuest = z.infer<typeof insertQuestSchema>;
export type QuestCompletion = typeof questCompletions.$inferSelect;
export type InsertQuestCompletion = z.infer<typeof insertQuestCompletionSchema>;
