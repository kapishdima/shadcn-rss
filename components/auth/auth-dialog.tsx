"use client";

import { useState } from "react";
import { GalleryVerticalEnd } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { LoginForm } from "./login-form";
import { SignupForm } from "./signup-form";

import { signIn } from "@/lib/auth-client";

export function AuthDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"login" | "signup">("login");

  const handleGithubSignIn = async () => {
    try {
      await signIn.social({
        provider: "github",
        callbackURL: "/",
      });
    } catch (error) {
      toast.error("Failed to sign in with GitHub");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Sign In
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0 md:max-w-[450px] overflow-hidden bg-background">
        <div className="flex flex-col gap-6 p-6 md:p-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-6" />
            </div>
            <h1 className="text-2xl font-bold">Welcome to shadcn/rss</h1>
            <p className="text-balance text-sm text-muted-foreground">
              {view === "login"
                ? "Enter your email below to login to your account"
                : "Enter your details below to create an account"}
            </p>
          </div>

          <div className="grid gap-6">
            {view === "login" ? (
              <LoginForm onSuccess={() => setIsOpen(false)} />
            ) : (
              <SignupForm onSuccess={() => setIsOpen(false)} />
            )}

            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
              <span className="relative z-10 bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleGithubSignIn}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="mr-2 h-4 w-4 fill-current"
              >
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              GitHub
            </Button>

            <div className="text-center text-sm">
              {view === "login" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={() => setView("signup")}
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => setView("login")}
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    Login
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
