import React from "react";
import Sidebar from "@/features/shared/components/Sidebar";
import MobileNavigation from "@/features/shared/components/MobileNavigation";
import Header from "@/features/shared/components/Header";
import { getCurrentUser } from "@/features/auth/actions/user.actions";
import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";
import { SyncAuth } from "@/features/shared/components/SyncAuth";
import Search from "@/features/shared/components/Search";
import StorageModeToggle from "@/features/shared/components/StorageModeToggle";
import FileUploader from "@/features/shared/components/FileUploader";

export const dynamic = "force-dynamic";

const ManagedLayout = async ({ children }: { children: React.ReactNode }) => {
    const currentUser = await getCurrentUser();

    if (!currentUser) return redirect("/sign-in");

    return (
        <main className="flex h-screen">
            <SyncAuth user={currentUser} />
            <Sidebar
                fullName={currentUser.fullName || ''}
                avatar={currentUser.avatar || ''}
                email={currentUser.email || ''}
                mode="managed"
            />

            <section className="flex h-full flex-1 flex-col">
                <MobileNavigation
                    $id={currentUser.$id || currentUser.id}
                    accountId={currentUser.accountId || currentUser.id}
                    fullName={currentUser.fullName || ''}
                    avatar={currentUser.avatar || ''}
                    email={currentUser.email || ''}
                />
                <Header
                    userId={currentUser.$id || currentUser.id}
                    accountId={currentUser.accountId || currentUser.id}
                    searchSlot={<Search mode="managed" />}
                    toggleSlot={<StorageModeToggle />}
                    actionsSlot={<FileUploader ownerId={currentUser.$id || currentUser.id} accountId={currentUser.accountId || currentUser.id} />}
                />
                <div className="main-content">{children}</div>
            </section>

            <Toaster />
        </main>
    );
};

export default ManagedLayout;
