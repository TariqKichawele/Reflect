'use client';

import { deleteJournalEntry } from '@/actions/journal';
import useFetch from '@/hooks/useFetch';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

const DeleteDialog = ({ entryId }) => {
    const router = useRouter();
    const [ deleteDialogOpen, setDeleteDialogOpen ] = useState(false);

    const {
        loading: deleteLoading,
        fn: deleteFn,
        data: deleteResult
    } = useFetch(deleteJournalEntry)

    useEffect(() => {
        if (deleteResult && !deleteLoading) {
            setDeleteDialogOpen(false);
            toast.success("Journal entry deleted successfully");
            router.push(`/collection/${deleteResult.collectionId ? deleteResult.collectionId : "unorganized"}`);
        }
    }, [deleteResult, deleteLoading]);

    const handleDelete = async () => {
        await deleteFn(entryId);
    }
  return (
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
            </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your
                    journal entry.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button
                    onClick={handleDelete}
                    className="bg-red-500 hover:bg-red-600"
                    disabled={deleteLoading}
                >
                    {deleteLoading ? "Deleting..." : "Delete"}
                </Button>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
  )
}

export default DeleteDialog