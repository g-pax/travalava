"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { nanoid } from "nanoid";

interface UpdateBlockLabelInput {
  blockId: string;
  tripId: string;
  label: string;
}

export function useUpdateBlockLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ blockId, tripId, label }: UpdateBlockLabelInput) => {
      const clientMutationId = nanoid();

      const { data, error } = await supabase
        .from("blocks")
        .update({ label })
        .eq("id", blockId)
        .select()
        .single();

      if (error) throw error;

      return { block: data, clientMutationId };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["days", variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ["blocks", variables.tripId] });
    },
  });
}
