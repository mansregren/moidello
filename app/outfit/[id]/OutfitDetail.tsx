"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Heart, Bookmark, MessageCircle } from "lucide-react";
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
import type { Outfit, Region } from "@/lib/types";
import { toggleLike, toggleSave, postComment } from "@/app/actions/engagement";
import {
  getLocalLike,
  getLocalSave,
  setLocalLike,
  setLocalSave,
} from "@/lib/local-engagement";
import { TrackView } from "@/components/outfit/TrackView";
import { AddToBoardButton } from "@/components/outfit/AddToBoardButton";
import { ShareButton } from "@/components/shared/ShareButton";

export default function OutfitDetail({
  outfit,
  similar,
  similarLikedIds = [],
  similarSavedIds = [],
  initiallyLiked,
  initiallySaved,
  initiallyFollowingCreator = false,
  isPersisted,
  viewerRegion,
}: {
  outfit: Outfit;
  similar: Outfit[];
  similarLikedIds?: string[];
  similarSavedIds?: string[];
  initiallyLiked: boolean;
  initiallySaved: boolean;
  initiallyFollowingCreator?: boolean;
  isPersisted: boolean;
  viewerRegion?: Region;
}) {
  const { isLoggedIn, requireAuth, user } = useAuth();
  const [, startTransition] = useTransition();
  const similarLiked = useMemo(() => new Set(similarLikedIds), [similarLikedIds]);
  const similarSaved = useMemo(() => new Set(similarSavedIds), [similarSavedIds]);

  // Plain useState — see OutfitCard for why useOptimistic was wrong here.
  const [liked, setLiked] = useState(initiallyLiked);
  const [likeCount, setLikeCount] = useState(outfit.likes);
  const [saved, setSaved] = useState(initiallySaved);
  const [saveCount, setSaveCount] = useState(outfit.saves);

  useEffect(() => {
    if (isPersisted) {
      setLiked(initiallyLiked);
      setSaved(initiallySaved);
    } else {
      setLiked(getLocalLike(outfit.id));
      setSaved(getLocalSave(outfit.id));
    }
    setLikeCount(outfit.likes);
    setSaveCount(outfit.saves);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outfit.id]);

  const handleLike = () => {
    if (!isLoggedIn) {
      requireAuth("like");
      return;
    }
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    if (!isPersisted) {
      setLocalLike(outfit.id, next);
      return;
    }
    startTransition(async () => {
      const res = await toggleLike(outfit.id);
      if (!res.ok) {
        setLiked(!next);
        setLikeCount((c) => c + (next ? -1 : 1));
      }
    });
  };

  const handleSave = () => {
    if (!isLoggedIn) {
      requireAuth("save");
      return;
    }
    const next = !saved;
    setSaved(next);
    setSaveCount((c) => c + (next ? 1 : -1));
    if (!isPersisted) {
      setLocalSave(outfit.id, next);
      return;
    }
    startTransition(async () => {
      const res = await toggleSave(outfit.id);
      if (!res.ok) {
        setSaved(!next);
        setSaveCount((c) => c + (next ? -1 : 1));
      }
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
                <OutfitTag
                  key={tag.id}
                  tag={tag}
                  outfitId={isPersisted ? outfit.id : undefined}
                  region={viewerRegion}
                />
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
                  className={liked ? "bg-white/10" : ""}
                  aria-label={liked ? "Ta bort gillning" : "Gilla"}
                  aria-pressed={liked}
                >
                  <Heart
                    className={`h-5 w-5 ${liked ? "fill-white text-white" : ""}`}
                  />
                </IconButton>
                <span className="text-sm text-foreground-muted mr-2">
                  {likeCount}
                </span>

                <IconButton
                  size="lg"
                  onClick={handleSave}
                  className={saved ? "bg-white/10" : ""}
                  aria-label={saved ? "Ta bort sparad" : "Spara"}
                  aria-pressed={saved}
                >
                  <Bookmark
                    className={`h-5 w-5 ${saved ? "fill-white text-white" : ""}`}
                  />
                </IconButton>
                <span className="text-sm text-foreground-muted mr-2">
                  {saveCount}
                </span>

                <ShareButton
                  url={`/outfit/${outfit.id}`}
                  title={outfit.title}
                  text={outfit.description || `Outfit av ${outfit.creator.displayName}`}
                  label="Dela"
                  variant="outline"
                />
              </div>

              {isPersisted && (
                <div className="mb-8">
                  <AddToBoardButton outfitId={outfit.id} />
                </div>
              )}

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
                        region={viewerRegion}
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
