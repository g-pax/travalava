"use client";

import {
  Calendar,
  Clock,
  DollarSign,
  Edit,
  Link2,
  Save,
  Tag,
  X,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDuration } from "@/lib/utils";
import type { Activity } from "../hooks/use-activities";

const ACTIVITY_CATEGORIES = [
  "sightseeing",
  "restaurant",
  "entertainment",
  "shopping",
  "outdoor",
  "cultural",
  "transportation",
  "accommodation",
  "other",
] as const;

interface ActivityMetadata {
  title: string;
  category: string | null;
  cost_amount: number | null;
  cost_currency: string | null;
  duration_min: number | null;
  link: string | null;
}

interface InlineMetadataEditorProps {
  activity: Activity;
  onMetadataUpdate: (metadata: Partial<ActivityMetadata>) => Promise<void>;
  isUpdating?: boolean;
  tripCurrency?: string;
  className?: string;
}

export function InlineMetadataEditor({
  activity,
  onMetadataUpdate,
  isUpdating = false,
  tripCurrency = "USD",
  className,
}: InlineMetadataEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: activity.title,
    category: activity.category || "",
    cost_amount: activity.cost_amount?.toString() || "",
    cost_currency: activity.cost_currency || tripCurrency,
    duration_min: activity.duration_min?.toString() || "",
    link: activity.link || "",
  });

  const handleSave = async () => {
    const metadata: Partial<ActivityMetadata> = {
      title: formData.title.trim(),
      category: formData.category || null,
      cost_amount: formData.cost_amount ? parseFloat(formData.cost_amount) : null,
      cost_currency: formData.cost_currency || null,
      duration_min: formData.duration_min ? parseInt(formData.duration_min) : null,
      link: formData.link.trim() || null,
    };

    await onMetadataUpdate(metadata);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      title: activity.title,
      category: activity.category || "",
      cost_amount: activity.cost_amount?.toString() || "",
      cost_currency: activity.cost_currency || tripCurrency,
      duration_min: activity.duration_min?.toString() || "",
      link: activity.link || "",
    });
    setIsEditing(false);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Activity Details</CardTitle>
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
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isUpdating}
                >
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
                Edit Details
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isEditing ? (
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Activity Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateFormData("title", e.target.value)}
                placeholder="e.g., Visit the Louvre Museum"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => updateFormData("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cost */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost_amount">Cost Amount</Label>
                <Input
                  id="cost_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost_amount}
                  onChange={(e) => updateFormData("cost_amount", e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost_currency">Currency</Label>
                <Input
                  id="cost_currency"
                  maxLength={3}
                  value={formData.cost_currency}
                  onChange={(e) => updateFormData("cost_currency", e.target.value.toUpperCase())}
                  placeholder={tripCurrency}
                  className="uppercase"
                />
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration_min">Duration (minutes)</Label>
              <Input
                id="duration_min"
                type="number"
                min="0"
                step="15"
                value={formData.duration_min}
                onChange={(e) => updateFormData("duration_min", e.target.value)}
                placeholder="e.g., 120"
              />
            </div>

            {/* External Link */}
            <div className="space-y-2">
              <Label htmlFor="link">External Link</Label>
              <Input
                id="link"
                type="url"
                value={formData.link}
                onChange={(e) => updateFormData("link", e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Title Display */}
            <div>
              <h3 className="text-2xl font-bold mb-2">{activity.title}</h3>
              {activity.category && (
                <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                  <Tag className="h-3 w-3" />
                  {activity.category.charAt(0).toUpperCase() + activity.category.slice(1)}
                </Badge>
              )}
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activity.cost_amount !== null && activity.cost_amount !== undefined && (
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Cost</p>
                    <p className="font-medium">
                      {formatCurrency(
                        activity.cost_amount,
                        activity.cost_currency || tripCurrency,
                      )}
                    </p>
                  </div>
                </div>
              )}

              {activity.duration_min && (
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-medium">
                      {formatDuration(activity.duration_min)}
                    </p>
                  </div>
                </div>
              )}

              {activity.link && (
                <div className="flex items-center gap-3 sm:col-span-2">
                  <Link2 className="h-5 w-5 text-gray-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-600">External Link</p>
                    <a
                      href={activity.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 truncate block"
                    >
                      View Details
                    </a>
                  </div>
                </div>
              )}

              {activity.created_at && (
                <div className="flex items-center gap-3 sm:col-span-2">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-medium text-sm">
                      {new Date(activity.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Missing Information Prompts */}
            <div className="space-y-2">
              {!activity.category && (
                <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                  <Tag className="h-4 w-4 inline mr-2" />
                  Consider adding a category to help organize this activity
                </div>
              )}
              {!activity.cost_amount && activity.cost_amount !== 0 && (
                <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                  <DollarSign className="h-4 w-4 inline mr-2" />
                  Add cost information to help with trip budgeting
                </div>
              )}
              {!activity.duration_min && (
                <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                  <Clock className="h-4 w-4 inline mr-2" />
                  Specify duration to better plan your itinerary
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}