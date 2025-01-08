'use server';

import { getMoodById, MOODS } from "@/app/lib/moods";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getPixabayImage } from "./public";
import { revalidatePath } from "next/cache";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";

export async function createJournalEntry(data) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const req = await request();

        const decision = await aj.protect(req, {
            userId,
            requested: 1
        });

        if (decision.isDenied()) {
            if (decision.reason.isRateLimit()) {
                const { remaining, reset } = decision.reason;
                console.error({
                    code: "RATE_LIMIT_EXCEEDED",
                    details: {
                        remaining,
                        resetInSeconds: reset,
                    }
                });

                throw new Error("Rate limit exceeded");
            }

            throw new Error("Unauthorized");
        }

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });
        if (!user) throw new Error("User not found");

        const mood = MOODS[data.mood.toUpperCase()];
        if (!mood) throw new Error("Invalid mood");

        const moodImageUrl = await getPixabayImage(data.moodQuery);

        const entry = await db.entry.create({
            data: {
                title: data.title,
                content: data.content,
                mood: mood.id,
                moodScore: mood.score,
                moodImageUrl,
                userId: user.id,
                collectionId: data.collectionId || null,
            },
        });

        console.log(entry);

        await db.draft.deleteMany({
            where: { userId},
        });

        revalidatePath("/dashboard");

        return entry;
    } catch (error) {
        throw new Error(error.message);
    }
}

export async function getJournalEntry(id) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });
        if (!user) throw new Error("User not found");

        const entry = await db.entry.findFirst({
            where: { id, userId: user.id },
            include: {
                collection: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            }
        });
        if (!entry) throw new Error("Entry not found");

        return entry;
    } catch (error) {
        throw new Error(error.message);
    }
}

export async function deleteJournalEntry(id) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });
        if (!user) throw new Error("User not found");

        const entry = await db.entry.findFirst({
            where: { id, userId: user.id },
        });
        if (!entry) throw new Error("Entry not found");

        await db.entry.delete({
            where: { id },
        });


        revalidatePath("/dashboard");
        return true;
    } catch (error) {
        throw new Error(error.message);
    }
}

export async function updateJournalEntry(data) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });
        if (!user) throw new Error("User not found");

        const exisitingEntry = await db.entry.findFirst({
            where: { id: data.id, userId: user.id },
        });
        if (!exisitingEntry) throw new Error("Entry not found");

        const mood = MOODS[data.mood.toUpperCase()];
        if (!mood) throw new Error("Invalid mood");

        let moodImageUrl = exisitingEntry.moodImageUrl;
        if (exisitingEntry.mood !== mood.id) {
            moodImageUrl = await getPixabayImage(data.moodQuery);
        };

        const updatedEntry = await db.entry.update({
            where: { id: data.id },
            data: {
                title: data.title,
                content: data.content,
                mood: mood.id,
                moodScore: mood.score,
                moodImageUrl,
                collectionId: data.collectionId || null,
            },
        });

        revalidatePath("/dashboard");
        revalidatePath(`/journal/${data.id}`);

        return updatedEntry;
    } catch (error) {
        throw new Error(error.message);
    }
};

export async function getJournalEntries({ collectionId, orderBy = 'desc' } = {}) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });
        if (!user) throw new Error("User not found");

        const where = {
            userId: user.id,
            ...(collectionId === 'unorganized'
                ? { collectionId: null }
                : collectionId
                ? { collectionId }
                : {}
            ),
        };

        const entries = await db.entry.findMany({
            where,
            orderBy: { createdAt: orderBy },
            include: {
                collection: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            }
        });

        const entriesWithMoodData = entries.map((entry) => ({
            ...entry,
            moodData: getMoodById(entry.mood),
        }));

        return {
            success: true,
            data: {
                entries: entriesWithMoodData
            }
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        }
    }
}

export async function getDraft() {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });
        if (!user) throw new Error("User not found");

        const draft = await db.draft.findUnique({
            where: { userId: user.id },
        });

        return { success: true, data: draft };
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export async function saveDraft(data) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });
        if (!user) throw new Error("User not found");

        const draft = await db.draft.upsert({
            where: { userId: user.id },
            create: {
                userId: user.id,
                title: data.title,
                content: data.content,
                mood: data.mood,
            },
            update: {
                title: data.title,
                content: data.content,
                mood: data.mood,
            }
        });

        revalidatePath("/dashboard");
        return { success: true, data: draft };
    } catch (error) {
        return { success: false, error: error.message }
    }
}