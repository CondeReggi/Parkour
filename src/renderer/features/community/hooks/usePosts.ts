import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PostDto, PostType } from '@shared/types/post'
import type {
  CreatePostInput,
  GetFeedInput,
  UpdatePostInput
} from '@shared/schemas/post.schemas'

export const postKeys = {
  all: ['posts'] as const,
  feed: (filters?: GetFeedInput) =>
    [...postKeys.all, 'feed', filters ?? null] as const,
  mine: () => [...postKeys.all, 'mine'] as const,
  byId: (id: string) => [...postKeys.all, 'byId', id] as const,
  byAuthor: (accountId: string) =>
    [...postKeys.all, 'byAuthor', accountId] as const
}

export function useCommunityFeed(filters?: { type?: PostType }) {
  const input: GetFeedInput = filters?.type
    ? { type: filters.type, limit: 50 }
    : undefined
  return useQuery<PostDto[]>({
    queryKey: postKeys.feed(input),
    queryFn: () => window.parkourApi.posts.getFeed(input)
  })
}

export function useMyPosts() {
  return useQuery<PostDto[]>({
    queryKey: postKeys.mine(),
    queryFn: () => window.parkourApi.posts.getMine()
  })
}

export function usePost(id: string | undefined) {
  return useQuery<PostDto | null>({
    queryKey: postKeys.byId(id ?? ''),
    queryFn: () => window.parkourApi.posts.getById({ id: id ?? '' }),
    enabled: !!id
  })
}

export function usePostsByAuthor(accountId: string | undefined) {
  return useQuery<PostDto[]>({
    queryKey: postKeys.byAuthor(accountId ?? ''),
    queryFn: () =>
      window.parkourApi.posts.getByAuthor({
        authorAccountId: accountId ?? '',
        limit: 50
      }),
    enabled: !!accountId
  })
}

function invalidateAllPosts(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: postKeys.all })
}

export function useCreatePost() {
  const qc = useQueryClient()
  return useMutation<PostDto, Error, CreatePostInput>({
    mutationFn: (input) => window.parkourApi.posts.create(input),
    onSuccess: () => invalidateAllPosts(qc)
  })
}

export function useUpdatePost() {
  const qc = useQueryClient()
  return useMutation<PostDto, Error, UpdatePostInput>({
    mutationFn: (input) => window.parkourApi.posts.update(input),
    onSuccess: () => invalidateAllPosts(qc)
  })
}

export function useDeletePost() {
  const qc = useQueryClient()
  return useMutation<void, Error, { id: string }>({
    mutationFn: (input) => window.parkourApi.posts.delete(input),
    onSuccess: () => invalidateAllPosts(qc)
  })
}
