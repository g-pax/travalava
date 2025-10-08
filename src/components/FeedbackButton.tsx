"use client";

import { Camera, CameraOff, MessageSquare, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { uploadScreenshotToR2 } from "@/lib/image-upload";
import { supabase } from "@/lib/supabase";

type FeedbackType = "bug" | "idea" | "other";

interface FeedbackFormData {
  type: FeedbackType;
  message: string;
  includeScreenshot: boolean;
}

// Screenshot capture using native Web APIs
async function captureScreenshot(
  hideDialog: () => void,
): Promise<string | undefined> {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    return undefined;
  }

  try {
    // Hide dialog before capturing screenshot
    hideDialog();

    // Small delay to ensure dialog is hidden
    await new Promise((resolve) => setTimeout(resolve, 100));

    const stream = await navigator.mediaDevices.getDisplayMedia({
      // @ts-expect-error - mediaSource is not typed in the mediaDevices type
      video: { mediaSource: "screen" },
    });

    const video = document.createElement("video");
    video.srcObject = stream;
    video.play();

    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          for (const track of stream.getTracks()) {
            track.stop();
          }
          resolve(undefined);
          return;
        }

        ctx.drawImage(video, 0, 0);
        for (const track of stream.getTracks()) {
          track.stop();
        }

        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
    });
  } catch (error) {
    console.warn("Screenshot capture failed:", error);
    return undefined;
  }
}

// Declare global window properties
declare global {
  interface Window {
    __USER_ID__?: string;
    __FF__?: Record<string, unknown>;
    __BREADCRUMBS__?: unknown[];
  }
}

// Gather browser context
function gatherContext(userId: string | null) {
  return {
    url: window.location.href,
    route: window.location.pathname,
    userId: userId,
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION || "unknown",
    gitSha: process.env.NEXT_PUBLIC_GIT_SHA || "unknown",
    env: process.env.NODE_ENV || "production",
    userAgent: navigator.userAgent,
    viewport: {
      w: window.innerWidth,
      h: window.innerHeight,
      dpr: window.devicePixelRatio || 1,
    },
    locale: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    featureFlags: window.__FF__ || {},
    breadcrumbs: window.__BREADCRUMBS__?.slice(-50) || [],
  };
}

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FeedbackFormData>({
    type: "bug",
    message: "",
    includeScreenshot: true,
  });

  // Get authenticated user
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };

    getUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async () => {
    if (!formData.message.trim()) {
      toast.error("Please provide a message with your feedback.");
      return;
    }

    if (!userId) {
      toast.error("You must be logged in to submit feedback.");
      return;
    }

    setIsSubmitting(true);

    try {
      let screenshotUrl: string | undefined;

      if (formData.includeScreenshot) {
        // Temporarily hide dialog for screenshot
        const wasOpen = isOpen;
        const screenshotDataURL = await captureScreenshot(() =>
          setIsOpen(false),
        );

        // Restore dialog state if it was open
        if (wasOpen) {
          setIsOpen(true);
        }

        // Upload screenshot to R2 if captured
        if (screenshotDataURL) {
          try {
            const uploadResult = await uploadScreenshotToR2(
              screenshotDataURL,
              userId,
            );
            screenshotUrl = uploadResult.url;
          } catch (uploadError) {
            console.error("Screenshot upload failed:", uploadError);
            toast.warning(
              "Screenshot upload failed, submitting feedback without it.",
            );
            // Continue without screenshot
          }
        }
      }

      const context = gatherContext(userId);

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: formData.type,
          message: formData.message,
          context,
          screenshotUrl,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit feedback");
      }

      toast.success("Thank you for your feedback! We'll review it soon.");

      // Reset form and close dialog
      setFormData({
        type: "bug",
        message: "",
        includeScreenshot: true,
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Feedback submission failed:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit feedback. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't show feedback button if user is not authenticated
  if (!userId) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 z-50 shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Feedback
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: FeedbackType) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">Bug Report</SelectItem>
                <SelectItem value="idea">Feature Request</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Describe your feedback..."
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              rows={4}
              maxLength={2000}
            />
            <div className="text-xs text-muted-foreground text-right">
              {formData.message.length}/2000
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="screenshot"
              checked={formData.includeScreenshot}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, includeScreenshot: !!checked })
              }
            />
            <Label
              htmlFor="screenshot"
              className="flex items-center cursor-pointer"
            >
              {formData.includeScreenshot ? (
                <Camera className="h-4 w-4 mr-2" />
              ) : (
                <CameraOff className="h-4 w-4 mr-2" />
              )}
              Attach screenshot
            </Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                "Sending..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Feedback
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
