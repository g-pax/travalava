"use client";

import { Edit, FileText, Save, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface InlineNotesEditorProps {
  notes: string | null;
  onNotesUpdate: (notes: string | null) => Promise<void>;
  isUpdating?: boolean;
  className?: string;
}

export function InlineNotesEditor({
  notes,
  onNotesUpdate,
  isUpdating = false,
  className,
}: InlineNotesEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempNotes, setTempNotes] = useState(notes || "");

  const hasNotes = notes && notes.trim().length > 0;

  const handleSave = async () => {
    const finalNotes = tempNotes.trim();
    await onNotesUpdate(finalNotes.length > 0 ? finalNotes : null);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempNotes(notes || "");
    setIsEditing(false);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notes
            </CardTitle>
            <CardDescription>
              {hasNotes
                ? "Additional information and tips for this activity"
                : "Add notes, tips, or important information about this activity"}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isUpdating}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isUpdating}>
                  <Save className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={isUpdating}
              >
                <Edit className="h-4 w-4" />
                {hasNotes ? "Edit" : "Add"} Notes
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <Textarea
              placeholder="Add any notes, tips, booking requirements, or other useful information about this activity..."
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <div className="text-xs text-gray-500">
              {tempNotes.length} characters
            </div>
          </div>
        ) : hasNotes ? (
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{notes}</p>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notes added yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Click "Add Notes" to include tips or important information
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
