'use client'

import { createCollection } from '@/actions/collection';
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner';
import CollectionPreview from './CollectionPreview';
import CollectionForm from '@/components/CollectionForm';
import useFetch from '@/hooks/useFetch';

const Collections = ({ collections = [], entriesByCollection }) => {
    const [ isCollectionDialogOpen, setIsCollectionDialogOpen ] = useState(false);

    const {
        loading: createCollectionLoading,
        fn: createCollectionFn,
        data: createdCollection
    } = useFetch(createCollection);

    useEffect(() => {
        if (createdCollection) {
            setIsCollectionDialogOpen(false);
            fetchCollections();
            toast.success(`Collection ${createdCollection.name} created successfully`);
        }
    }, [createdCollection, createCollectionLoading]);

    const handleCreateCollection = async (data) => {
        await createCollectionFn(data);
    };

    if (collections.length === 0) return <></>;
  return (
    <section id="collections" className="space-y-6">
        <h2 className="text-3xl font-bold gradient-title">Collections</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Create New Collection Button */}
            <CollectionPreview
                isCreateNew={true}
                onCreateNew={() => setIsCollectionDialogOpen(true)}
            />

            {/* Unorganized Collection */}
            {entriesByCollection?.unorganized?.length > 0 && (
                <CollectionPreview
                    name="Unorganized"
                    entries={entriesByCollection.unorganized}
                    isUnorganized={true}
                />
            )}

            {/* User Collections */}
            {collections?.map((collection) => (
                <CollectionPreview
                    key={collection.id}
                    id={collection.id}
                    name={collection.name}
                    entries={entriesByCollection[collection.id] || []}
                />
            ))}

            <CollectionForm
                loading={createCollectionLoading}
                onSuccess={handleCreateCollection}
                open={isCollectionDialogOpen}
                setOpen={setIsCollectionDialogOpen}
            />
        </div>
    </section>
  )
}

export default Collections