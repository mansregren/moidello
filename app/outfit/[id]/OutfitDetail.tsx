"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useOptimistic, useState, useTransition } from "react";
import { Heart, Bookmark, Share2, MessageCircle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { OutfitTag } from "@/components/outfit/OutfitTag";
import { TaggedItemCard } from "@/components/outfit/TaggedItem";
import { OutfitCard } from "@/components/outfit/OutfitCard";
import { UserAvatar } from "@/components/user/UserAvatar";
import { FollowButton } from "@/components/user/FollowButton";
import { IconButton } from "@/components/shared/IconButton";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import type { Outfit } from "@/lib/types";
import { toggleLike, toggleSave, postComment } from "@/app/actions/engagement";
import { TrackView } from "@/components/outfit/TrackView";

export default function OutfitDetail({
  outfit,
  similar,
  similarLikedIds = [],
  similarSavedIds = [],
  initiallyLiked,
  initiallySaved,
  initiallyFollowingCreator = false,
  isPersisted,
}: {
  outfit: Outfit;
  similar: Outfit[];
  similarLikedIds?: string[];
  similarSavedIds?: string[];
  initiallyLiked: boolean;
  initiallySaved: boolean;
  initiallyFollowingCreator?: boolean;
  isPersisted: boolean;
}) {
  const { isLoggedIn, requireAuth, user } = useAuth();
  const [, startTransition] = useTransition();
  const similarLiked = useMemo(() => new Set(similarLikedIds), [similarLikedIds]);
  const similarSaved = useMemo(() => new Set(similarSavedIds), [similarSavedIds]);

  const [likeState, setLikeState] = useOptimistic(
    { liked: initiallyLiked, count: outfit.likes },
    (state, next: boolean) => ({
      liked: next,
      count: state.count + (next ? 1 : -1),
    }),
  );
  const [saveState, setSaveState] = useOptimistic(
    { saved: initiallySaved, count: outfit.saves },
    (state, next: boolean) => ({
      saved: next,
      count: state.count + (next ? 1 : -1),
    }),
  );

  const handleLike = () => {
    if (!isPersisted) return; // engagement disabled on mock data
    if (!isLoggedIn) {
      requireAuth("like");
      return;
    }
    startTransition(async () => {
      setLikeState(!likeState.liked);
      const res = await toggleLike(outfit.id);
      if (!res.ok) setLikeState(likeState.liked);
    });
  };

  const handleSave = () => {
    if (!isPersisted) return;
    if (!isLoggedIn) {
      requireAuth("save");
      return;
    }
    startTransition(async () => {
      setSaveState(!saveState.saved);
      const res = await toggleSave(outfit.id);
      if (!res.ok) setSaveState(saveState.saved);
    });
  };

  return (
    <>
      <Header />
      {isPersisted && <TrackView outfitId={outfit.id} />}
      <main id="main" tabIndex={-1} className="flex-1 pt-20 md:pt-24">
        <Container>
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-2xl bg-background-tertiary"
            >
              <Image
                src={outfit.image}
                alt={outfit.title}
                width={800}
                height={1100}
                className="w-full object-cover"
                priority
                unoptimized={outfit.image.startsWith("http")}
              />
              {outfit.tags.map((tag) => (
                <OutfitTag key={tag.id} tag={tag} />
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-6">
                <Link
                  href={`/profile/${outfit.creator.username}`}
                  className="flex items-center gap-3 group"
                >
                  <UserAvatar
                    src={outfit.creator.avatar}
                    alt={outfit.creator.displayName}
                    size="lg"
                  />
                  <div>
                    <p className="font-medium text-white group-hover:underline">
                      {outfit.creator.displayName}
                    </p>
                    <p className="text-sm text-foreground-subtle">
                      @{outfit.creator.username}
                    </p>
                  </div>
                </Link>
                <FollowButton
                  userId={outfit.creator.id}
                  initiallyFollowing={initiallyFollowingCreator}
                />
              </div>

              <h1 className="font-heading text-[32px] md:text-[48px] leading-[0.95] uppercase tracking-[-0.02em] text-white mb-4">
                {outfit.title}
              </h1>
              <p className="text-foreground-muted mb-8">
                {outfit.description}
              </p>

              <div className="flex items-center gap-3 mb-8">
                <IconButton
                  size="lg"
                  onClick={handleLike}
                  className={likeState.liked ? "bg-white/10" : ""}
                  aria-label={likeState.liked ? "Ta bort gillning" : "Gilla"}
                  aria-pressed={likeState.liked}
                >
                  <Heart
                    className={`h-5 w-5 ${likeState.liked ? "fill-white text-white" : ""}`}
                  />
                </IconButton>
                <span className="text-sm text-foreground-muted mr-2">
                  {likeState.count}
                </span>

                <IconButton
                  size="lg"
                  onClick={handleSave}
                  className={saveState.saved ? "bg-white/10" : ""}
                  aria-label={saveState.saved ? "Ta bort sparad" : "Spara"}
                  aria-pressed={saveState.saved}
                >
                  <Bookmark
                    className={`h-5 w-5 ${saveState.saved ? "fill-white text-white" : ""}`}
                  />
                </IconButton>
                <span className="text-sm text-foreground-muted mr-2">
                  {saveState.count}
                </span>

                <IconButton size="lg" aria-label="Dela">
                  <Share2 className="h-5 w-5" />
                </IconButton>
              </div>

              <div className="mb-8">
                <h3 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-4">
                  Taggade plagg
                </h3>
                <div className="rounded-2xl border border-border bg-background-secondary p-4">
                  {outfit.tags.length === 0 ? (
                    <p className="text-sm text-foreground-subtle">
                      Inga taggade plagg.
                    </p>
                  ) : (
                    outfit.tags.map((tag) => (
                      <TaggedItemCard
                        key={tag.id}
                        item={tag}
                        outfitId={isPersisted ? outfit.id : undefined}
                      />
                    ))
                  )}
                </div>
              </div>

              <CommentsSection
                outfitId={outfit.id}
                comments={outfit.comments}
                isPersisted={isPersisted}
                isLoggedIn={isLoggedIn}
                requireAuth={() => requireAuth("comment")}
                viewerAvatar={user?.user_metadata?.avatar_url ?? ""}
              />
            </motion.div>
          </div>

          <section className="mt-16 md:mt-24 mb-16">
            <h2 className="font-heading text-[28px] md:text-[40px] leading-[0.95] uppercase tracking-[-0.02em] text-white mb-8">
              Liknande <span className="text-foreground-subtle">outfits</span>
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {similar.map((o) => (
                <OutfitCard
                  key={o.id}
                  outfit={o}
                  initiallyLiked={similarLiked.has(o.id)}
                  initiallySaved={similarSaved.has(o.id)}
                />
              ))}
            </div>
          </section>
        </Container>
      </main>
    </>
  );
}

function CommentsSection({
  outfitId,
  comments,
  isPersisted,
  isLoggedIn,
  requireAuth,
  viewerAvatar,
}: {
  outfitId: string;
  comments: Outfit["comments"];
  isPersisted: boolean;
  isLoggedIn: boolean;
  requireAuth: () => void;
  viewerAvatar: string;
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPersisted) return;
    if (!isLoggedIn) {
      requireAuth();
      return;
    }
    if (!body.trim()) return;
    startTransition(async () => {
      const res = await postComment(outfitId, body);
      if (res.ok) {
        setBody("");
        setError(null);
      } else {
        setError(res.error ?? "Något gick fel");
      }
    });
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-4 flex items-center gap-2">
        <MessageCircle className="h-4 w-4" />
        Kommentarer ({comments.length})
      </h3>
      <div className="space-y-4">
        {comments.length === 0 && (
          <p className="text-sm text-foreground-subtle">
            Inga kommentarer än. Var först med att kommentera!
          </p>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <UserAvatar
              src={comment.user.avatar}
              alt={comment.user.displayName}
              size="sm"
            />
            <div>
              <p className="text-sm">
                <span className="font-medium text-white">
                  {comment.user.displayName}
                </span>{" "}
                <span className="text-foreground-muted">{comment.text}</span>
              </p>
              <p className="text-xs text-foreground-subtle mt-1">
                {new Date(comment.createdAt).toLocaleString("sv-SE", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>
        ))}

        <form
          onSubmit={submit}
          className="flex gap-3 mt-6 pt-4 border-t border-border"
        >
          <UserAvatar src={viewerAvatar} alt="Du" size="sm" />
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={
              isPersisted
                ? "Skriv en kommentar..."
                : "Kommentarer aktiveras när outfiten är publicerad"
            }
            disabled={!isPersisted || pending}
            maxLength={1000}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-foreground-subtle outline-none disabled:cursor-not-allowed"
          />
          {body && isPersisted && (
            <button
              type="submit"
              disabled={pending}
              className="text-sm text-white font-semibold disabled:opacity-50"
            >
              Posta
            </button>
          )}
        </form>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </div>
  );
}
