"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Temporary admin endpoint to clean up orphaned projects
// DELETE /api/admin/cleanup?secret=specbridge-cleanup-2024
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  // Simple secret check
  if (secret !== "specbridge-cleanup-2024") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await auth();

  try {
    // Get all projects to see what's in the database
    const allProjects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        userId: true,
        organizationId: true,
        createdAt: true,
      },
    });

    console.log("[cleanup] All projects in database:", allProjects);

    // Delete all projects (this will cascade to features, specs, etc.)
    const deleted = await prisma.project.deleteMany({});

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleted.count} projects`,
      currentUserId: userId,
      projectsBeforeDelete: allProjects,
    });
  } catch (error) {
    console.error("[cleanup] Error:", error);
    return NextResponse.json(
      { error: "Failed to cleanup", details: String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint to just see what's in the database without deleting
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== "specbridge-cleanup-2024") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId, orgId } = await auth();

  try {
    const allProjects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        userId: true,
        organizationId: true,
        createdAt: true,
        features: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
        },
        _count: {
          select: { features: true },
        },
      },
    });

    const allFeatures = await prisma.feature.findMany({
      select: {
        id: true,
        name: true,
        projectId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      currentAuth: { userId, orgId },
      totalProjects: allProjects.length,
      totalFeatures: allFeatures.length,
      projects: allProjects,
      features: allFeatures,
    });
  } catch (error) {
    console.error("[cleanup] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch", details: String(error) },
      { status: 500 }
    );
  }
}
