"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useClerk } from "@clerk/nextjs";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { deleteMerchantData } from "@/actions/user-account";

const DeleteAccount = () => {
  const router = useRouter();
  const { signOut } = useClerk();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);

      // First, soft delete in our database
      const result = await deleteMerchantData();
      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Account deleted successfully.");

      // Sign out the user from Clerk
      // Note: Clerk user deletion should be handled via webhook or admin action
      await signOut();

      // Close dialog and redirect
      setIsDialogOpen(false);
      router.push("/");
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes("Unauthorized")) {
          toast.error("You are not authorized to perform this action.");
        } else {
          toast.error("Failed to delete account. Please try again.");
        }
      } else {
        toast.error("Failed to delete account. Please try again.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger
        className={buttonVariants({
          variant: "destructive",
        })}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Deleting...
          </>
        ) : (
          "Delete Account"
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-left">Delete Account</DialogTitle>
              <DialogDescription className="mt-1 text-left">
                This action cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Are you absolutely sure you want to delete your account? This will:
          </p>
          <ul className="text-muted-foreground ml-2 list-inside list-disc space-y-1 text-sm">
            <li>Permanently remove your profile and data</li>
            <li>Cancel any active subscriptions</li>
            <li>Remove access to all your content</li>
            <li>Sign you out of all devices</li>
          </ul>
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            This action cannot be reversed.
          </p>
        </div>

        <DialogFooter className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting Account...
              </>
            ) : (
              "Yes, Delete My Account"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAccount;
