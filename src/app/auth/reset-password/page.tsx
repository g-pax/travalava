"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, KeyRound, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
/**
 * Password reset page with two modes:
 * - request: send the recovery email
 * - update: shown when the user arrives via the recovery link (Supabase fires
 *   PASSWORD_RECOVERY after the browser client exchanges the URL code);
 *   sets the new password via auth.updateUser
 */
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import {
  type ResetPasswordInput,
  ResetPasswordSchema,
  type UpdatePasswordInput,
  UpdatePasswordSchema,
} from "@/schemas";

export default function ResetPasswordPage() {
  const { resetPassword, updatePassword } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    // Arriving via the email link puts a recovery code in the URL; the browser
    // client exchanges it and emits PASSWORD_RECOVERY. Also check for the
    // code param directly in case the event fired before this page mounted.
    const params = new URLSearchParams(window.location.search);
    if (params.has("code")) {
      setRecoveryMode(true);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const requestForm = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  const updateForm = useForm<UpdatePasswordInput>({
    resolver: zodResolver(UpdatePasswordSchema),
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onRequestSubmit = async (data: ResetPasswordInput) => {
    setIsLoading(true);
    try {
      await resetPassword(data.email);
      setEmailSent(true);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send reset email",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onUpdateSubmit = async (data: UpdatePasswordInput) => {
    setIsLoading(true);
    try {
      await updatePassword(data.password);
      toast.success("Password updated! You're signed in.");
      router.replace("/trips");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update password",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (recoveryMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4 text-center pb-6">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary flex items-center justify-center">
              <KeyRound className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl">Set a new password</CardTitle>
              <CardDescription className="text-base mt-2">
                Choose a new password for your account
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={updateForm.handleSubmit(onUpdateSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  {...updateForm.register("password")}
                  disabled={isLoading}
                />
                {updateForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {updateForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat new password"
                  {...updateForm.register("confirmPassword")}
                  disabled={isLoading}
                />
                {updateForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {updateForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  "Updating..."
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    Update Password
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4 text-center pb-6">
            <div className="mx-auto h-16 w-16 rounded-full bg-success-muted flex items-center justify-center">
              <Mail className="h-8 w-8 text-success-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl">Check your email</CardTitle>
              <CardDescription className="text-base mt-2">
                We've sent a password reset link to
                <br />
                <span className="font-medium text-foreground">
                  {requestForm.getValues("email")}
                </span>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2 text-center">
                <p className="text-sm text-foreground/70">
                  Click the link in the email to reset your password.
                </p>
                <p className="text-xs text-muted-foreground">
                  Didn't receive the email? Check your spam folder.
                </p>
              </div>
              <div className="space-y-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEmailSent(false)}
                  className="w-full"
                >
                  Try another email
                </Button>
                <Link href="/auth/login" className="w-full block">
                  <Button variant="ghost" className="w-full gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to login
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary flex items-center justify-center">
            <Mail className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl">Reset password</CardTitle>
            <CardDescription className="text-base mt-2">
              Enter your email and we'll send you a reset link
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={requestForm.handleSubmit(onRequestSubmit)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...requestForm.register("email")}
                disabled={isLoading}
              />
              {requestForm.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {requestForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full gap-2" disabled={isLoading}>
              {isLoading ? (
                "Sending..."
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Send Reset Link
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="text-sm text-primary-deep hover:text-primary-deep/80 inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
