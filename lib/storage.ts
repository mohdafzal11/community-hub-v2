import { db } from "./db";
import { eq, ilike, or, desc, sql, and } from "drizzle-orm";
import {
  users,
  forumCategories,
  forumTopics,
  forumReplies,
  activities,
  quests,
  questCompletions,
  type User,
  type InsertUser,
  type ForumCategory,
  type InsertCategory,
  type ForumTopic,
  type InsertTopic,
  type ForumReply,
  type InsertReply,
  type Activity,
  type InsertActivity,
  type Quest,
  type InsertQuest,
  type QuestCompletion,
  type InsertQuestCompletion,
} from "@/shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  getAllMembers(): Promise<User[]>;
  searchMembers(query: string): Promise<User[]>;
  getLeaderboard(sortBy?: string): Promise<User[]>;

  getAllCategories(): Promise<ForumCategory[]>;
  getCategory(id: string): Promise<ForumCategory | undefined>;
  createCategory(category: InsertCategory): Promise<ForumCategory>;
  updateCategory(id: string, data: Partial<InsertCategory>): Promise<ForumCategory | undefined>;
  deleteCategory(id: string): Promise<void>;

  getTopicsByCategory(categoryId: string): Promise<(ForumTopic & { author: User })[]>;
  getTopicsByAuthor(authorId: string): Promise<ForumTopic[]>;
  getRecentTopics(limit?: number): Promise<(ForumTopic & { author: User })[]>;
  getTopic(id: string): Promise<(ForumTopic & { author: User }) | undefined>;
  createTopic(topic: InsertTopic): Promise<ForumTopic>;

  getRepliesByTopic(topicId: string): Promise<(ForumReply & { author: User })[]>;
  createReply(reply: InsertReply): Promise<ForumReply>;

  getActivities(limit?: number): Promise<(Activity & { user: User })[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  searchTopics(query: string): Promise<(ForumTopic & { author: User })[]>;

  getAllQuests(): Promise<Quest[]>;
  getQuest(id: string): Promise<Quest | undefined>;
  createQuest(quest: InsertQuest): Promise<Quest>;
  updateQuest(id: string, data: Partial<InsertQuest>): Promise<Quest | undefined>;
  deleteQuest(id: string): Promise<void>;

  getUserQuestCompletions(userId: string): Promise<(QuestCompletion & { quest: Quest })[]>;
  startQuest(data: InsertQuestCompletion): Promise<QuestCompletion>;
  updateQuestProgress(id: string, progress: number, status: string): Promise<QuestCompletion | undefined>;
  getQuestCompletion(questId: string, userId: string): Promise<QuestCompletion | undefined>;

  getDashboardStats(): Promise<{ totalContributors: number; totalReferrals: number; totalEvents: number; totalContent: number }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async getAllMembers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.joinedAt));
  }

  async searchMembers(query: string): Promise<User[]> {
    const pattern = `%${query}%`;
    return db
      .select()
      .from(users)
      .where(
        or(
          ilike(users.username, pattern),
          ilike(users.email, pattern),
          ilike(users.bio, pattern)
        )
      )
      .orderBy(desc(users.joinedAt));
  }

  async getLeaderboard(sortBy = "totalPoints"): Promise<User[]> {
    const orderCol =
      sortBy === "referrals" ? users.referralsCount :
      sortBy === "events" ? users.eventsCount :
      sortBy === "content" ? users.contentCount :
      users.totalPoints;
    return db.select().from(users).orderBy(desc(orderCol)).limit(50);
  }

  async getAllCategories(): Promise<ForumCategory[]> {
    return db.select().from(forumCategories);
  }

  async getCategory(id: string): Promise<ForumCategory | undefined> {
    const [cat] = await db.select().from(forumCategories).where(eq(forumCategories.id, id));
    return cat;
  }

  async createCategory(category: InsertCategory): Promise<ForumCategory> {
    const [cat] = await db.insert(forumCategories).values(category).returning();
    return cat;
  }

  async updateCategory(id: string, data: Partial<InsertCategory>): Promise<ForumCategory | undefined> {
    const [cat] = await db.update(forumCategories).set(data).where(eq(forumCategories.id, id)).returning();
    return cat;
  }

  async deleteCategory(id: string): Promise<void> {
    const topics = await db.select({ id: forumTopics.id }).from(forumTopics).where(eq(forumTopics.categoryId, id));
    for (const topic of topics) {
      await db.delete(forumReplies).where(eq(forumReplies.topicId, topic.id));
    }
    await db.delete(forumTopics).where(eq(forumTopics.categoryId, id));
    await db.delete(forumCategories).where(eq(forumCategories.id, id));
  }

  async getTopicsByCategory(categoryId: string): Promise<(ForumTopic & { author: User })[]> {
    const result = await db
      .select()
      .from(forumTopics)
      .innerJoin(users, eq(forumTopics.authorId, users.id))
      .where(eq(forumTopics.categoryId, categoryId))
      .orderBy(desc(forumTopics.isPinned), desc(forumTopics.createdAt));

    return result.map((r) => ({
      ...r.forum_topics,
      author: r.users,
    }));
  }

  async getRecentTopics(limit: number = 10): Promise<(ForumTopic & { author: User })[]> {
    const result = await db
      .select()
      .from(forumTopics)
      .innerJoin(users, eq(forumTopics.authorId, users.id))
      .orderBy(desc(forumTopics.createdAt))
      .limit(limit);

    return result.map((r) => ({
      ...r.forum_topics,
      author: r.users,
    }));
  }

  async getTopicsByAuthor(authorId: string): Promise<ForumTopic[]> {
    return db
      .select()
      .from(forumTopics)
      .where(eq(forumTopics.authorId, authorId))
      .orderBy(desc(forumTopics.createdAt));
  }

  async getTopic(id: string): Promise<(ForumTopic & { author: User }) | undefined> {
    const result = await db
      .select()
      .from(forumTopics)
      .innerJoin(users, eq(forumTopics.authorId, users.id))
      .where(eq(forumTopics.id, id));

    if (result.length === 0) return undefined;
    return { ...result[0].forum_topics, author: result[0].users };
  }

  async createTopic(topic: InsertTopic): Promise<ForumTopic> {
    const [created] = await db.insert(forumTopics).values(topic).returning();
    await db
      .update(forumCategories)
      .set({ topicCount: sql`${forumCategories.topicCount} + 1` })
      .where(eq(forumCategories.id, topic.categoryId));
    return created;
  }

  async getRepliesByTopic(topicId: string): Promise<(ForumReply & { author: User })[]> {
    const result = await db
      .select()
      .from(forumReplies)
      .innerJoin(users, eq(forumReplies.authorId, users.id))
      .where(eq(forumReplies.topicId, topicId))
      .orderBy(forumReplies.createdAt);

    return result.map((r) => ({
      ...r.forum_replies,
      author: r.users,
    }));
  }

  async createReply(reply: InsertReply): Promise<ForumReply> {
    const [created] = await db.insert(forumReplies).values(reply).returning();
    await db
      .update(forumTopics)
      .set({
        replyCount: sql`${forumTopics.replyCount} + 1`,
        lastReplyAt: new Date(),
      })
      .where(eq(forumTopics.id, reply.topicId));
    return created;
  }

  async getActivities(limit = 50): Promise<(Activity & { user: User })[]> {
    const result = await db
      .select()
      .from(activities)
      .innerJoin(users, eq(activities.userId, users.id))
      .orderBy(desc(activities.createdAt))
      .limit(limit);

    return result.map((r) => ({
      ...r.activities,
      user: r.users,
    }));
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [created] = await db.insert(activities).values(activity).returning();
    return created;
  }

  async searchTopics(query: string): Promise<(ForumTopic & { author: User })[]> {
    const pattern = `%${query}%`;
    const result = await db
      .select()
      .from(forumTopics)
      .innerJoin(users, eq(forumTopics.authorId, users.id))
      .where(or(ilike(forumTopics.title, pattern), ilike(forumTopics.content, pattern)))
      .orderBy(desc(forumTopics.createdAt));

    return result.map((r) => ({
      ...r.forum_topics,
      author: r.users,
    }));
  }

  async getAllQuests(): Promise<Quest[]> {
    return db.select().from(quests).where(eq(quests.isActive, true)).orderBy(desc(quests.createdAt));
  }

  async getQuest(id: string): Promise<Quest | undefined> {
    const [quest] = await db.select().from(quests).where(eq(quests.id, id));
    return quest;
  }

  async createQuest(quest: InsertQuest): Promise<Quest> {
    const [created] = await db.insert(quests).values(quest).returning();
    return created;
  }

  async updateQuest(id: string, data: Partial<InsertQuest>): Promise<Quest | undefined> {
    const [updated] = await db.update(quests).set(data).where(eq(quests.id, id)).returning();
    return updated;
  }

  async deleteQuest(id: string): Promise<void> {
    await db.delete(questCompletions).where(eq(questCompletions.questId, id));
    await db.delete(quests).where(eq(quests.id, id));
  }

  async getUserQuestCompletions(userId: string): Promise<(QuestCompletion & { quest: Quest })[]> {
    const result = await db
      .select()
      .from(questCompletions)
      .innerJoin(quests, eq(questCompletions.questId, quests.id))
      .where(eq(questCompletions.userId, userId))
      .orderBy(desc(questCompletions.startedAt));

    return result.map((r) => ({
      ...r.quest_completions,
      quest: r.quests,
    }));
  }

  async startQuest(data: InsertQuestCompletion): Promise<QuestCompletion> {
    const [created] = await db.insert(questCompletions).values(data).returning();
    return created;
  }

  async updateQuestProgress(id: string, progress: number, status: string): Promise<QuestCompletion | undefined> {
    const updateData: Record<string, unknown> = { progress, status };
    if (status === "completed") {
      updateData.completedAt = new Date();
    }
    const [updated] = await db.update(questCompletions).set(updateData).where(eq(questCompletions.id, id)).returning();
    return updated;
  }

  async getQuestCompletion(questId: string, userId: string): Promise<QuestCompletion | undefined> {
    const [completion] = await db
      .select()
      .from(questCompletions)
      .where(and(eq(questCompletions.questId, questId), eq(questCompletions.userId, userId)));
    return completion;
  }

  async getDashboardStats(): Promise<{ totalContributors: number; totalReferrals: number; totalEvents: number; totalContent: number }> {
    const allUsers = await db.select().from(users);
    return {
      totalContributors: allUsers.length,
      totalReferrals: allUsers.reduce((sum, u) => sum + (u.referralsCount ?? 0), 0),
      totalEvents: allUsers.reduce((sum, u) => sum + (u.eventsCount ?? 0), 0),
      totalContent: allUsers.reduce((sum, u) => sum + (u.contentCount ?? 0), 0),
    };
  }
}

export const storage = new DatabaseStorage();
