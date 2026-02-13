import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { apiClient } from "../client";
import { queryKeys } from "./query-keys";
import type {
  CreateStatusDTO,
  StatusWithUser,
  StatusListResponse,
} from "@repo/shared/types";

/**
 * Query hook to get user's own statuses
 */
export function useUserStatuses() {
  return useQuery({
    queryKey: queryKeys.statuses.user(),
    queryFn: async (): Promise<StatusListResponse> => {
      const response = await apiClient.get("/api/v1/statuses/my");
      return response.data as StatusListResponse;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Query hook to get all statuses from all users
 */
export function useAllStatuses() {
  return useQuery({
    queryKey: queryKeys.statuses.all,
    queryFn: async (): Promise<StatusListResponse> => {
      const response = await apiClient.get("/api/v1/statuses");
      return response.data as StatusListResponse;
    },
    staleTime: 30 * 1000, // 30 seconds - keep fresh for expiry
    refetchInterval: 60 * 1000, // Poll every 60 seconds to catch expired statuses
  });
}

/**
 * Mutation hook to create a new status
 */
export function useCreateStatus(
  options?: Omit<
    UseMutationOptions<StatusWithUser, Error, CreateStatusDTO, unknown>,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStatusDTO): Promise<StatusWithUser> => {
      const response = await apiClient.post("/api/v1/statuses", data);
      return (response.data as { status: StatusWithUser }).status;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.statuses.user() });
      queryClient.invalidateQueries({ queryKey: queryKeys.statuses.all });
    },
    ...options,
  });
}

/**
 * Query hook to get a specific user's statuses
 */
export function useUserStatusesById(userId: string) {
  return useQuery({
    queryKey: queryKeys.statuses.list({ userId }),
    queryFn: async (): Promise<StatusListResponse> => {
      const response = await apiClient.get(`/api/v1/statuses?userId=${userId}`);
      return response.data as StatusListResponse;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Mutation hook to delete a status
 */
export function useDeleteStatus(
  options?: Omit<
    UseMutationOptions<void, Error, string, unknown>,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (statusId: string): Promise<void> => {
      await apiClient.delete(`/api/v1/statuses/${statusId}`);
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.statuses.user() });
      queryClient.invalidateQueries({ queryKey: queryKeys.statuses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.statuses.list() });
    },
    ...options,
  });
}
