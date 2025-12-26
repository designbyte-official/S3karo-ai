import Sidebar from "@/components/layout/Sidebar";
import MobileNavigation from "@/components/layout/MobileNavigation";
import Header from "@/components/layout/Header";
import { getCurrentUser } from "@/features/auth/actions/user.actions";
import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";
import { SyncAuth } from "@/components/wrappers/SyncAuth";
import Search from "@/components/common/Search";
import StorageModeToggle from "@/components/common/StorageModeToggle";

export const dynamic = "force-dynamic";

const PrivateLayout = async ({ children }: { children: React.ReactNode }) => {
    const currentUser = await getCurrentUser();

    if (!currentUser) return redirect("/sign-in");

    const privateNavItems = [
        { name: "S3 Explorer", url: "/private/explorer", icon: "/assets/icons/dashboard.svg" },
        { name: "S3 Settings", url: "/private/settings", icon: "/assets/icons/others.svg" },
        { name: "Profile", url: "/profile", icon: "/assets/icons/others.svg" },
    ];

    return (
        <main className="flex h-screen">
            <SyncAuth user={currentUser} />
            <Sidebar
                fullName={currentUser.fullName || ''}
                avatar={currentUser.avatar || ''}
                email={currentUser.email || ''}
                mode="private"
                navItems={privateNavItems}
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
                    avatar={currentUser.avatar || ''}
                    searchSlot={<Search mode="private" />}
                    toggleSlot={<StorageModeToggle />}
                />
                <div className="main-content">{children}</div>
            </section>

            <Toaster />
        </main>
    );
};

export default PrivateLayout;
