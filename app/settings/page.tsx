import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { WebhooksSettings } from "@/components/settings/webhooks";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/auth/user-menu";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings and preferences.",
};

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen items-center justify-center font-sans">
      <div className="relative flex min-h-screen w-full max-w-4xl flex-col items-center justify-start py-16 md:px-8 px-4">
        <div className="absolute top-4 right-4 md:top-8 md:right-8 flex items-center gap-2">
          <ThemeToggle />
          <UserMenu />
        </div>
        <div className="w-full space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Return to home</span>
              </Link>
            </Button>
            <div>
              <h3 className="text-2xl font-medium">Settings</h3>
              <p className="text-sm text-muted-foreground">
                Manage your account settings and preferences.
              </p>
            </div>
          </div>
          <div className="border rounded-lg p-6">
            <WebhooksSettings />
          </div>
        </div>
      </div>
    </div>
  );
}
