"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { supabase } from "@/lib/supabase";

interface UpdateBlockLabelInput {
  blockId: string;
  tripId: string;
  label: string;
}

export function useUpdateBlockLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ blockId, label }: UpdateBlockLabelInput) => {
      const clientMutationId = nanoid();

      const { data, error } = await supabase
        .from("blocks")
        .update({ label })
        .eq("id", blockId)
        .select()
        .maybeSingle();

      if (error) throw error;

      return { block: data, clientMutationId };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["days", variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ["blocks", variables.tripId] });
    },
  });
}
