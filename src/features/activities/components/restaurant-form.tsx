"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Star, Utensils } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ActionButton } from "@/components/loading";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type RestaurantInput, RestaurantSchema } from "@/schemas";

interface RestaurantFormProps {
  restaurant?: RestaurantInput;
  onSave: (restaurant: RestaurantInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const priceRangeOptions = [
  { value: "$", label: "$ (Budget-friendly)" },
  { value: "$$", label: "$$ (Moderate)" },
  { value: "$$$", label: "$$$ (Upscale)" },
  { value: "$$$$", label: "$$$$ (Fine dining)" },
];

export function RestaurantForm({
  restaurant,
  onSave,
  onCancel,
  isLoading = false,
}: RestaurantFormProps) {
  const form = useForm<RestaurantInput>({
    resolver: zodResolver(RestaurantSchema),
    mode: "all",
    reValidateMode: "onBlur",
    defaultValues: restaurant || {
      name: "",
      cuisine_type: "",
      description: "",
      address: "",
      phone: "",
      website: "",
      image_url: "",
      rating: undefined,
      review_count: undefined,
    },
  });

  const onSubmit = async (data: RestaurantInput) => {
    try {
      await onSave(data);
      toast.success("Restaurant saved successfully!");
    } catch (error) {
      toast.error("Failed to save restaurant");
      console.error("Restaurant save error:", error);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Utensils className="h-5 w-5" />
          {restaurant ? "Edit Restaurant" : "Add Restaurant"}
        </CardTitle>
        <CardDescription>
          Add restaurant recommendations near your activity location
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Restaurant Name *</Label>
              <Input
                id="name"
                placeholder="Enter restaurant name"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cuisine_type">Cuisine Type</Label>
              <Input
                id="cuisine_type"
                placeholder="e.g., Italian, Mexican, Asian"
                {...form.register("cuisine_type")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price_range">Price Range</Label>
              <Select
                value={form.watch("price_range") || ""}
                onValueChange={(value) =>
                  form.setValue(
                    "price_range",
                    value as "$" | "$$" | "$$$" | "$$$$",
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select price range" />
                </SelectTrigger>
                <SelectContent>
                  {priceRangeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">Rating</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  placeholder="0.0"
                  {...form.register("rating", { valueAsNumber: true })}
                />
                <Star className="h-4 w-4 text-yellow-500" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the restaurant"
              rows={3}
              {...form.register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <Input
                id="address"
                placeholder="Restaurant address"
                {...form.register("address")}
                className="flex-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="Phone number"
                {...form.register("phone")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://..."
                {...form.register("website")}
              />
              {form.formState.errors.website && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.website.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              type="url"
              placeholder="https://..."
              {...form.register("image_url")}
            />
            {form.formState.errors.image_url && (
              <p className="text-sm text-red-600">
                {form.formState.errors.image_url.message}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <ActionButton
              type="submit"
              className="flex-1"
              isPending={isLoading}
              pendingText="Saving..."
            >
              Save Restaurant
            </ActionButton>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
