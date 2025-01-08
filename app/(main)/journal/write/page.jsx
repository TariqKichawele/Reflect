'use client'

import React, { useEffect } from 'react'
import 'react-quill-new/dist/quill.snow.css';
import dynamic from 'next/dynamic';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { journalSchema } from '@/app/lib/schema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarLoader } from "react-spinners";
import { getMoodById, MOODS } from "@/app/lib/moods";
import useFetch from '@/hooks/useFetch';
import { createJournalEntry } from '@/actions/journal';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';


const ReactQuill = dynamic(() => import('react-quill-new'), {
    ssr: false
})

const JournalEntry = () => {
    const router = useRouter();
    const {
        loading: actionLoading,
        fn: actionFn,
        data: actionResult
    } = useFetch(createJournalEntry);

    const {
        register,
        handleSubmit,
        control,
        setValue,
        getValues,
        watch,
        reset,
        formState: { errors, isDirty },
    } = useForm({
        resolver: zodResolver(journalSchema),
        defaultValues: {
          title: "",
          content: "",
          mood: "",
          collectionId: "",
        },
    });

    useEffect(() => {
        if (actionResult && !actionLoading) {
            router.push(`/collection/${actionResult.collectionId ? actionResult.collectionId : "unorganized"}`);
        }
        toast.success("Entry saved successfully");
    }, [actionResult, actionLoading]);

    const onSubmit = async (data) => {
        const mood = getMoodById(data.mood);
        actionFn({ 
            ...data, 
            moodScore: mood.score,
            moodQuery: mood.pixabayQuery,
        });
    };

    const isEditMode = false;
    const isLoading = actionLoading;
    const savingDraft = false;
    const collections = [];
    const handleSaveDraft = () => {};

  return (
    <div className="container mx-auto px-4 py-8">
        <form onSubmit={onSubmit} className="space-y-2  mx-auto">
            <h1 className="text-5xl md:text-6xl gradient-title">
                {isEditMode ? "Edit Entry" : "What's on your mind?"}
            </h1>

            {isLoading && (
                <BarLoader className="mb-4" width={"100%"} color="orange" />
            )}

            <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                    disabled={isLoading}
                    {...register("title")}
                    placeholder="Give your entry a title..."
                    className={`py-5 md:text-md ${errors.title ? "border-red-500" : ""}`}
                />
                {errors.title && (
                    <p className="text-red-500 text-sm">{errors.title.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">How are you feeling?</label>
                <Controller
                    name="mood"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className={errors.mood ? "border-red-500" : ""}>
                                <SelectValue placeholder="Select a mood..." />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.values(MOODS).map((mood) => (
                                    <SelectItem key={mood.id} value={mood.id}>
                                        <span className="flex items-center gap-2">
                                            {mood.emoji} {mood.label}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.mood && (
                    <p className="text-red-500 text-sm">{errors.mood.message}</p>
                )}
            </div>

            <div className="space-y-2">
            <label className="text-sm font-medium">
                {getMoodById(getValues("mood"))?.prompt ?? "Write your thoughts..."}
            </label>
            <Controller
                name="content"
                control={control}
                render={({ field }) => (
                    <ReactQuill
                        readOnly={isLoading}
                        theme="snow"
                        value={field.value}
                        onChange={field.onChange}
                        modules={{
                        toolbar: [
                            [{ header: [1, 2, 3, false] }],
                            ["bold", "italic", "underline", "strike"],
                            [{ list: "ordered" }, { list: "bullet" }],
                            ["blockquote", "code-block"],
                            ["link"],
                            ["clean"],
                        ],
                        }}
                    />
                )}
            />
            {errors.content && (
                <p className="text-red-500 text-sm">{errors.content.message}</p>
            )}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">
                    Add to Collection (Optional)
                </label>
                <Controller
                    name="collectionId"
                    control={control}
                    render={({ field }) => (
                        <Select
                            onValueChange={(value) => {
                                if (value === "new") {
                                    setIsCollectionDialogOpen(true);
                                } else {
                                    field.onChange(value);
                                }
                            }}
                            value={field.value}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a collection..." />
                            </SelectTrigger>
                            <SelectContent>
                                {collections?.map((collection) => (
                                    <SelectItem key={collection.id} value={collection.id}>
                                        {collection.name}
                                    </SelectItem>
                                ))}
                                <SelectItem value="new">
                                    <span className="text-orange-600">
                                    + Create New Collection
                                    </span>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
            </div>

            <div className="space-x-4 flex">
                {!isEditMode && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleSaveDraft}
                        disabled={savingDraft || !isDirty}
                    >
                        {savingDraft && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save as Draft
                    </Button>
                )}
                <Button
                    type="submit"
                    variant="journal"
                    disabled={actionLoading || !isDirty}
                >
                    {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditMode ? "Update" : "Publish"}
                </Button>
                {isEditMode && (
                    <Button
                        onClick={(e) => {
                            e.preventDefault();
                            router.push(`/journal/${existingEntry.id}`);
                        }}
                        variant="destructive"
                    >
                        Cancel
                    </Button>
                )}
            </div>
        </form>

        CollectionForm
    </div>
  )
}

export default JournalEntry