import { redirect } from "next/navigation";

import Header from "@/components/layout/Header";
import MobileNavigation from "@/components/layout/MobileNavigation";
import Sidebar from "@/components/layout/Sidebar";
import { Toaster } from "@/components/ui/toaster";
import { SyncAuth } from "@/components/wrappers/SyncAuth";
import { getCurrentUser } from "@/features/auth/actions/user.actions";

const MainLayout = async ({
    children,
}: {
    children: React.ReactNode
}) => {
    const currentUser = await getCurrentUser();

    if (!currentUser) return redirect("/sign-in");

    return (
        <main className="flex h-screen">
            <SyncAuth user={currentUser} />
            <Sidebar
                fullName={currentUser.fullName || ''}
                avatar={currentUser.avatar || ''}
                email={currentUser.email || ''}
            />

            <section className="flex h-full min-w-0 flex-1 flex-col">
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
                    avatar={currentUser.avatar || ''}
                />
                <div className="main-content poeru-content-fade min-w-0">{children}</div>
            </section>

            <Toaster />
        </main>
    );
};

export default MainLayout;
