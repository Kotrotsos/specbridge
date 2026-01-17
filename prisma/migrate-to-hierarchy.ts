import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Migration script to convert existing Interview data to new Project hierarchy
 * 
 * This script:
 * 1. Creates a default "Legacy Interviews" project for each user
 * 2. For each Interview:
 *    - Creates a Feature with the interview's title
 *    - Creates a Specification linked to that Feature
 *    - Migrates all Messages and Artifacts to the new Specification
 * 3. Drops the old Interview table
 */

async function migrate() {
    console.log("Starting migration...\n");

    try {
        // Check if Interview table still exists
        const hasInterviewTable = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Interview'
      );
    `.then((result: any) => result[0].exists);

        if (!hasInterviewTable) {
            console.log("✓ Interview table does not exist. Migration may have already run.");
            console.log("✓ Current schema appears to be up to date.");
            return;
        }

        // Get all interviews
        const interviews: any[] = await prisma.$queryRaw`
      SELECT * FROM "Interview" ORDER BY "createdAt" ASC;
    `;

        console.log(`Found ${interviews.length} interviews to migrate.\n`);

        if (interviews.length === 0) {
            console.log("No interviews to migrate. Proceeding to drop Interview table...\n");
        } else {
            // Group interviews by userId
            const interviewsByUser = interviews.reduce((acc: any, interview: any) => {
                const userId = interview.userId || "null";
                if (!acc[userId]) acc[userId] = [];
                acc[userId].push(interview);
                return {};
            }, {});

            // Process each user's interviews
            for (const [userId, userInterviews] of Object.entries(interviewsByUser) as any) {
                console.log(`Processing ${userInterviews.length} interviews for user: ${userId === "null" ? "(no user)" : userId}`);

                // Create "Legacy Interviews" project for this user
                const project = await prisma.project.create({
                    data: {
                        userId: userId === "null" ? null : userId,
                        name: "Legacy Interviews",
                        description: "Interviews migrated from previous schema",
                        order: 0,
                    },
                });

                console.log(`  ✓ Created project: ${project.name} (${project.id})`);

                // Process each interview
                for (let i = 0; i < userInterviews.length; i++) {
                    const interview = userInterviews[i];

                    // Create Feature for this interview
                    const feature = await prisma.feature.create({
                        data: {
                            projectId: project.id,
                            name: interview.title || `Feature ${i + 1}`,
                            description: interview.initialDescription || null,
                            order: i,
                        },
                    });

                    // Create Specification
                    const specification = await prisma.specification.create({
                        data: {
                            id: interview.id, // Keep same ID for easier tracking
                            featureId: feature.id,
                            name: interview.title || `Specification ${i + 1}`,
                            initialDescription: interview.initialDescription || "",
                            status: interview.status || "in_progress",
                            extractedKnowledge: interview.extractedKnowledge || null,
                            order: 0, // Single spec per feature
                            createdAt: interview.createdAt,
                            updatedAt: interview.updatedAt,
                        },
                    });

                    // Migrate messages
                    await prisma.$executeRaw`
            UPDATE "Message" 
            SET "specificationId" = ${specification.id}
            WHERE "interviewId" = ${interview.id};
          `;

                    // Migrate artifacts
                    await prisma.$executeRaw`
            UPDATE "Artifact" 
            SET "specificationId" = ${specification.id}
            WHERE "interviewId" = ${interview.id};
          `;

                    console.log(`    ✓ Migrated: "${interview.title}" → Feature → Specification`);
                }

                console.log("");
            }
        }

        // Drop old Interview table and columns
        console.log("Cleaning up old schema...");

        await prisma.$executeRaw`ALTER TABLE "Message" DROP COLUMN IF EXISTS "interviewId";`;
        console.log("  ✓ Dropped Message.interviewId column");

        await prisma.$executeRaw`ALTER TABLE "Artifact" DROP COLUMN IF EXISTS "interviewId";`;
        console.log("  ✓ Dropped Artifact.interviewId column");

        await prisma.$executeRaw`DROP TABLE IF EXISTS "Interview";`;
        console.log("  ✓ Dropped Interview table");

        console.log("\n✅ Migration completed successfully!");
    } catch (error) {
        console.error("\n❌ Migration failed:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

migrate()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
