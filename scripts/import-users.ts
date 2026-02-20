import { db } from "../lib/db";
import {
  users,
  forumCategories,
  forumTopics,
  activities,
} from "../shared/schema";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";

function generatePassword(length = 10): string {
  const chars =
    "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789@#$!";
  let password = "";
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

const spreadsheetUsers = [
  {
    name: "Pragnesh Dubey",
    college: "Thankur College",
    year: "3rd",
    city: "Mumbai",
    telegram: "PragneshDu",
    x: "",
    email: "pragneshdubey08@gmail.com",
  },
  {
    name: "Soham Sawant",
    college: "SAKEC",
    year: "2nd",
    city: "Mumbai",
    telegram: "Soham7126",
    x: "SawantSoham7126",
    email: "sohamsawant7126@gmail.com",
  },
  {
    name: "Arudra Gamidi",
    college: "SIES College",
    year: "2nd",
    city: "Mumbai",
    telegram: "@aru_ck",
    x: "aruck2006",
    email: "arudragamidi2006@gmail.com",
  },
  {
    name: "Wahid Shaikh",
    college: "Vidyavardhni's College of Engineering and Technology",
    year: "4th",
    city: "Mumbai",
    telegram: "fs0c13ty00",
    x: "0xsoydev",
    email: "yuknomebrawh@gmail.com",
  },
  {
    name: "Yash Baing",
    college: "Indian Institute of Technology Madras",
    year: "2nd",
    city: "Mumbai",
    telegram: "yashbaing",
    x: "YashBaing1",
    email: "yashbaing07@gmail.com",
  },
  {
    name: "Shishir Shetty",
    college: "Vidyavardhini's College of Engineering and Technology",
    year: "4th",
    city: "Mumbai",
    telegram: "Borax0x0",
    x: "0xborax",
    email: "shishirshetty26@gmail.com",
  },
  {
    name: "Chinmay Rajesh Bolinjkar",
    college: "Vidyavardhini's College of Engineering / Mumbai University",
    year: "3rd",
    city: "Mumbai",
    telegram: "chinmayyy28",
    x: "chinmayyy_28",
    email: "rbolinjkar@gmail.com",
  },
  {
    name: "Tanzil Sayed",
    college: "Mumbai University",
    year: "4th",
    city: "Mumbai",
    telegram: "Tanzzz12",
    x: "tanzil_sayed22",
    email: "dragts99@gmail.com",
  },
  {
    name: "Vishal Tiwari",
    college: "Mumbai University",
    year: "3rd",
    city: "Mumbai",
    telegram: "vishaltiwari_9",
    x: "VishalT12094272",
    email: "vishal.urban.wheels@gmail.com",
  },
  {
    name: "Jainam Oswal",
    college: "Bharati Vidyapeeth College of Engineering, Pune",
    year: "3rd",
    city: "Pune",
    telegram: "JainamOP",
    x: "Jainam1811",
    email: "jainamoswal1811@gmail.com",
  },
  {
    name: "Parag Sanyasi",
    college: "DY Patil Pimpri, Pune",
    year: "MSc",
    city: "Pune",
    telegram: "Parag_sany",
    x: "Parag_twits",
    email: "parag.sanyasi@gmail.com",
  },
  {
    name: "Hariprasad Sakhare",
    college: "Savitribai Phule Pune University",
    year: "4th",
    city: "Pune",
    telegram: "hprasadsakhare",
    x: "hprasadsakhare",
    email: "hprasad.sakhare@gmail.com",
  },
  {
    name: "Mahesh Rakte",
    college: "TSSM's BSCOER",
    year: "2nd",
    city: "Pune",
    telegram: "maheshrakte0",
    x: "Raone00234h",
    email: "maheshrakate242@gmail.com",
  },
  {
    name: "Swanandi Bhende",
    college: "Vishwakarma Institute of Technology, Pune",
    year: "2nd",
    city: "Pune",
    telegram: "swanandibhende",
    x: "swanandibhende",
    email: "swanandibhende@gmail.com",
  },
  {
    name: "Ishaan Chepurwar",
    college: "Vishwakarma Institute of Technology, Pune",
    year: "3rd",
    city: "Pune",
    telegram: "Ish8118",
    x: "is81__",
    email: "ichepurwar02@gmail.com",
  },
  {
    name: "Tanishka Singh",
    college: "Vishwakarma Institute of Technology, Pune",
    year: "3rd",
    city: "Pune",
    telegram: "tanishka_2911",
    x: "tanishkaah_here",
    email: "tanishka.singh.here@gmail.com",
  },
  {
    name: "Vedang Limaye",
    college: "MITWPU",
    year: "4th",
    city: "Pune",
    telegram: "vedang21",
    x: "vedanglimay_eth",
    email: "vedanglimaye@gmail.com",
  },
  {
    name: "Mohit Dad",
    college: "Arya College of Engineering",
    year: "4th",
    city: "Jaipur",
    telegram: "CypherPunk8",
    x: "0xmohitxyz",
    email: "dadmohit90@gmail.com",
  },
  {
    name: "Arijit Roy",
    college: "The LNM Institute of Information Technology",
    year: "2nd",
    city: "Jaipur",
    telegram: "Ariz_space7453",
    x: "ARIJITROY115058",
    email: "arijitroy0445@gmail.com",
  },
  {
    name: "Vaibhav Rawat",
    college: "The LNM Institute of Information Technology",
    year: "2nd",
    city: "Jaipur",
    telegram: "Vaibhav8727",
    x: "vibhu4905",
    email: "vibhu4905@gmail.com",
  },
  {
    name: "Mahamad Zaid",
    college: "Atria Institute of Technology",
    year: "3rd",
    city: "Bangalore",
    telegram: "zaid69zaid",
    x: "mdzaid2969",
    email: "mahamad9243@gmail.com",
  },
];

function getRegion(city: string): string {
  const regionMap: Record<string, string> = {
    Mumbai: "Maharashtra",
    Pune: "Maharashtra",
    Jaipur: "Rajasthan",
    Bangalore: "Karnataka",
  };
  return regionMap[city] || "";
}

async function importUsers() {
  console.log(`Importing ${spreadsheetUsers.length} users...\n`);

  const credentials: { email: string; password: string; name: string }[] = [];

  for (const u of spreadsheetUsers) {
    // Check if user already exists
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, u.email.toLowerCase()));

    if (existing) {
      console.log(`  SKIP: ${u.email} (already exists)`);
      continue;
    }

    const password = generatePassword(10);
    const passwordHash = await bcrypt.hash(password, 10);
    const referralCode = `REF_${Date.now().toString(36).toUpperCase()}`;

    const [created] = await db
      .insert(users)
      .values({
        email: u.email.toLowerCase(),
        passwordHash,
        username: u.name,
        bio: `${u.year} year student at ${u.college}`,
        telegramHandle: u.telegram.replace(/^@/, ""),
        xHandle: u.x.replace(/^@/, ""),
        isOnboarded: false,
        tier: "explorer",
        role: "contributor",
        region: getRegion(u.city),
        city: u.city,
        referralCode,
        college: u.college,
      })
      .returning();

    // Create activity for new contributor
    await db.insert(activities).values({
      type: "new_contributor",
      userId: created.id,
      metadata: { username: created.username, tier: "explorer" },
    });

    credentials.push({ email: u.email.toLowerCase(), password, name: u.name });
    console.log(`  OK: ${u.name} (${u.email})`);
  }

  // --- Add Event Announcements ---
  console.log("\nAdding event announcements...");

  // Find the announcements and events categories
  const allCategories = await db.select().from(forumCategories);
  const announcementsCat = allCategories.find(
    (c) => c.slug === "announcements"
  );
  const eventsCat = allCategories.find((c) => c.slug === "events");

  // Use the admin user as author
  const [adminUser] = await db
    .select()
    .from(users)
    .where(eq(users.role, "admin"))
    .limit(1);

  if (!adminUser) {
    console.log(
      "  WARNING: No admin user found, skipping event announcements."
    );
  } else {
    const eventAnnouncements = [
      {
        categoryId: announcementsCat?.id || eventsCat?.id || allCategories[0].id,
        title: "Hashed Vibe Haus - Gurgaon, Delhi NCR",
        content: `Join us at Hashed Vibe Haus, a week-long immersive experience during India's biggest AI summit!\n\nDate: February 16-21, 2026\nTime: 3:00 PM (Feb 16) to 10:00 AM (Feb 21)\nLocation: Gurgaon, Delhi NCR\n\nThis event brings together founders and the Hashed Emergent team at a villa to build, ship, and experience the AI wave in India. Stay, meals, mentorship, and networking included.\n\nLimited spots - apply now!\n\nEvent link: https://luma.com/t22r07ce`,
        authorId: adminUser.id,
        isPinned: true,
      },
      {
        categoryId: announcementsCat?.id || eventsCat?.id || allCategories[0].id,
        title: "Hashed Haus Farewell - Bangalore",
        content: `Farewell gathering at Hashed Haus, marking the closure after three years as a hub for Bangalore's Web3 and startup ecosystem.\n\nDate: January 18, 2026\nTime: 7:00 PM - 11:00 PM IST\nLocation: Hashed Haus, 231 3rd Main Road, Defence Colony, Indiranagar, Bengaluru 560038\n\nCome reconnect, reflect, and acknowledge what this space enabled over the last three years. No formal agenda - just great vibes.\n\nFree event, approval required.\n\nEvent link: https://luma.com/16070nzu`,
        authorId: adminUser.id,
        isPinned: true,
      },
    ];

    for (const event of eventAnnouncements) {
      const [topic] = await db
        .insert(forumTopics)
        .values(event)
        .returning();
      await db
        .update(forumCategories)
        .set({
          topicCount: sql`${forumCategories.topicCount} + 1`,
        })
        .where(eq(forumCategories.id, event.categoryId));

      await db.insert(activities).values({
        type: "event_organized",
        userId: adminUser.id,
        metadata: {
          username: adminUser.username,
          eventName: event.title,
          topicId: topic.id,
          contentPreview: event.content.substring(0, 150),
        },
      });

      console.log(`  OK: Event "${event.title}" added`);
    }
  }

  // --- Write credentials file ---
  const outputPath = path.join(__dirname, "credentials.txt");
  let output = "=== Insidr Community Hub - User Credentials ===\n";
  output += `Generated: ${new Date().toISOString()}\n`;
  output += `Total users imported: ${credentials.length}\n`;
  output += "=".repeat(50) + "\n\n";

  for (const cred of credentials) {
    output += `Name:     ${cred.name}\n`;
    output += `Email:    ${cred.email}\n`;
    output += `Password: ${cred.password}\n`;
    output += "-".repeat(40) + "\n";
  }

  fs.writeFileSync(outputPath, output, "utf-8");
  console.log(`\nCredentials written to: ${outputPath}`);
  console.log(`Total imported: ${credentials.length} users`);
}

importUsers().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
