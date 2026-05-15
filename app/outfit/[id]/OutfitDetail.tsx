"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Heart, Bookmark, MessageCircle, X } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { OutfitTag } from "@/components/outfit/OutfitTag";
import { TaggedItemCard } from "@/components/outfit/TaggedItem";
import { OutfitCard } from "@/components/outfit/OutfitCard";
import { UserAvatar } from "@/components/user/UserAvatar";
import { FollowButton } from "@/components/user/FollowButton";
import { IconButton } from "@/components/shared/IconButton";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { Outfit, Region } from "@/lib/types";
import {
  toggleLike,
  toggleSave,
  postComment,
  deleteComment,
} from "@/app/actions/engagement";
import { TrackView } from "@/components/outfit/TrackView";
import { AddToBoardButton } from "@/components/outfit/AddToBoardButton";
import { ShareButton } from "@/components/shared/ShareButton";
import { ShareToDmSheet } from "@/components/shared/ShareToDmSheet";
import { ReportButton } from "@/components/shared/ReportButton";
import { JsonLd } from "@/components/seo/JsonLd";
import { outfitPageJsonLd } from "@/lib/json-ld";
import { outfitPath } from "@/lib/outfit-url";
import { OutfitOwnerActions } from "@/components/outfit/OutfitOwnerActions";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Send } from "lucide-react";

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
  savedItemIds = [],
  viewerIsAdmin = false,
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
  savedItemIds?: string[];
  viewerIsAdmin?: boolean;
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
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    setLiked(initiallyLiked);
    setSaved(initiallySaved);
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
    if (!isPersisted) return;
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
    if (!isPersisted) return;
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
      {isPersisted && <JsonLd data={outfitPageJsonLd(outfit)} />}
      {isPersisted && (
        <ShareToDmSheet
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          type="outfit_share"
          refId={outfit.id}
          title={outfit.title}
        />
      )}
      <main id="main" tabIndex={-1} className="flex-1 pt-20 md:pt-24">
        <Container>
          <nav
            aria-label="Brödsmulor"
            className="mb-6 text-[11px] uppercase tracking-[0.18em] text-foreground-subtle"
          >
            <ol className="flex items-center gap-2 flex-wrap">
              <li>
                <Link
                  href="/"
                  className="hover:text-foreground transition-colors"
                >
                  Moidello
                </Link>
              </li>
              <li aria-hidden="true" className="text-foreground-subtle/60">
                /
              </li>
              <li>
                <Link
                  href="/upptack"
                  className="hover:text-foreground transition-colors"
                >
                  Outfits
                </Link>
              </li>
              {outfit.category && (
                <>
                  <li aria-hidden="true" className="text-foreground-subtle/60">
                    /
                  </li>
                  <li className="text-foreground-muted">{outfit.category}</li>
                </>
              )}
            </ol>
          </nav>
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-2xl bg-background-tertiary"
            >
              <Image
                src={outfit.image}
                alt={(() => {
                  // Auto-alt: "{category}-outfit med {brand1 name1}, ... av {creator}"
                  // mirrors the meta description pattern so screen readers and
                  // image-search crawlers see consistent copy.
                  const top = outfit.tags
                    .slice(0, 3)
                    .map((t) => `${t.brand} ${t.name}`)
                    .join(", ");
                  const cat = outfit.category?.trim();
                  if (top && cat) {
                    return `${cat}-outfit med ${top} av ${outfit.creator.displayName}`;
                  }
                  if (top) {
                    return `Outfit med ${top} av ${outfit.creator.displayName}`;
                  }
                  return `${outfit.title} av ${outfit.creator.displayName}`;
                })()}
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
                  aria-label={outfit.creator.displayName}
                  className="flex items-center gap-3 group min-w-0"
                >
                  <UserAvatar
                    src={outfit.creator.avatar}
                    alt=""
                    size="lg"
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground group-hover:underline truncate">
                      {outfit.creator.displayName}
                    </p>
                    <p className="text-sm text-foreground-subtle truncate">
                      @{outfit.creator.username}
                    </p>
                  </div>
                </Link>
                <FollowButton
                  userId={outfit.creator.id}
                  initiallyFollowing={initiallyFollowingCreator}
                />
              </div>

              <h1 className="font-heading text-[32px] md:text-[48px] leading-[0.95] uppercase tracking-[-0.02em] text-foreground mb-1.5">
                {outfit.title}
              </h1>
              {outfit.code && (
                <p className="mb-4">
                  <span className="inline-flex items-center rounded-full bg-background-tertiary px-3 py-1 text-sm font-semibold tracking-wide text-foreground">
                    ID = ({outfit.code})
                  </span>
                </p>
              )}

              {isPersisted && (user?.id === outfit.creator.id || viewerIsAdmin) && (
                <div className="mb-5">
                  <OutfitOwnerActions
                    outfitId={outfit.id}
                    isHidden={!!outfit.isHidden}
                    isAdmin={viewerIsAdmin}
                    editHref={viewerIsAdmin ? `/admin/inlagg/${outfit.id}` : `/profil/inlagg/${outfit.id}`}
                  />
                </div>
              )}

              <p className="text-foreground-muted mb-8">
                {outfit.description}
              </p>

              <div className="flex flex-wrap items-center gap-2 mb-8">
                <button
                  type="button"
                  onClick={handleLike}
                  aria-label={liked ? "Ta bort gillning" : "Gilla"}
                  aria-pressed={liked}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    liked
                      ? "bg-foreground/10 border-foreground/40 text-foreground"
                      : "border-border text-foreground hover:border-foreground/30",
                  )}
                >
                  <Heart
                    className={cn("h-4 w-4", liked && "fill-foreground text-foreground")}
                  />
                  <span className="tabular-nums">{likeCount}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  aria-label={saved ? "Ta bort sparad" : "Spara"}
                  aria-pressed={saved}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    saved
                      ? "bg-foreground/10 border-foreground/40 text-foreground"
                      : "border-border text-foreground hover:border-foreground/30",
                  )}
                >
                  <Bookmark
                    className={cn("h-4 w-4", saved && "fill-foreground text-foreground")}
                  />
                  <span className="tabular-nums">{saveCount}</span>
                </button>

                {isPersisted && (
                  <button
                    type="button"
                    onClick={() => setShareOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-border text-foreground px-4 py-2 text-sm font-medium hover:border-foreground/30 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                    Skicka till vän
                  </button>
                )}
                <ShareButton
                  url={outfitPath(outfit)}
                  title={outfit.title}
                  text={outfit.description || `Outfit av ${outfit.creator.displayName}`}
                  label="Dela länk"
                  variant="outline"
                />
                {isPersisted && user?.id !== outfit.creator.id && (
                  <ReportButton targetType="outfit" targetId={outfit.id} />
                )}
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
                        initiallySaved={savedItemIds.includes(tag.id)}
                      />
                    ))
                  )}
                </div>
              </div>

              <CommentsSection
                outfitId={outfit.id}
                outfitOwnerId={outfit.creator.id}
                comments={outfit.comments}
                isPersisted={isPersisted}
                isLoggedIn={isLoggedIn}
                viewerId={user?.id ?? null}
                requireAuth={() => requireAuth("comment")}
                viewerAvatar={user?.user_metadata?.avatar_url ?? ""}
              />
            </motion.div>
          </div>

          <section className="mt-16 md:mt-24 mb-16">
            <h2 className="font-heading text-[28px] md:text-[40px] leading-[0.95] uppercase tracking-[-0.02em] text-foreground mb-8">
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
  outfitOwnerId,
  comments: initialComments,
  isPersisted,
  isLoggedIn,
  viewerId,
  requireAuth,
  viewerAvatar,
}: {
  outfitId: string;
  outfitOwnerId: string;
  comments: Outfit["comments"];
  isPersisted: boolean;
  isLoggedIn: boolean;
  viewerId: string | null;
  requireAuth: () => void;
  viewerAvatar: string;
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [comments, setComments] = useState(initialComments);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

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
        {comments.map((comment) => {
          const canDelete =
            viewerId !== null &&
            (viewerId === comment.user.id || viewerId === outfitOwnerId);
          const canReport =
            viewerId !== null && viewerId !== comment.user.id;
          return (
            <div key={comment.id} className="flex gap-3 group">
              <UserAvatar
                src={comment.user.avatar}
                alt={comment.user.displayName}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium text-foreground">
                    {comment.user.displayName}
                  </span>{" "}
                  <span className="text-foreground-muted">{comment.text}</span>
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-xs text-foreground-subtle">
                    {new Date(comment.createdAt).toLocaleString("sv-SE", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  {canReport && (
                    <ReportButton
                      targetType="comment"
                      targetId={comment.id}
                      variant="menuitem"
                    />
                  )}
                </div>
              </div>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(comment.id)}
                  aria-label="Radera kommentar"
                  className="shrink-0 self-start text-foreground-subtle hover:text-red-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        })}

        <AlertDialog.Root
          open={confirmDelete !== null}
          onOpenChange={(open) => {
            if (!open) setConfirmDelete(null);
          }}
        >
          <AlertDialog.Portal>
            <AlertDialog.Backdrop className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 transition-opacity" />
            <AlertDialog.Popup className="fixed inset-0 z-[60] flex items-center justify-center p-6 outline-none">
              <div className="w-full max-w-sm rounded-3xl bg-background-secondary border border-foreground/10 p-6">
                <AlertDialog.Title className="font-heading text-2xl uppercase tracking-tight text-foreground">
                  Radera kommentar?
                </AlertDialog.Title>
                <AlertDialog.Description className="mt-3 text-sm text-foreground-muted">
                  Detta går inte att ångra.
                </AlertDialog.Description>
                <div className="mt-6 flex gap-3">
                  <AlertDialog.Close
                    type="button"
                    className="flex-1 rounded-full border border-border text-foreground py-3 text-sm font-medium hover:border-foreground/30"
                  >
                    Avbryt
                  </AlertDialog.Close>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      const targetId = confirmDelete;
                      if (!targetId) return;
                      setConfirmDelete(null);
                      setComments((prev) =>
                        prev.filter((c) => c.id !== targetId),
                      );
                      startTransition(async () => {
                        const res = await deleteComment(targetId, outfitId);
                        if (!res.ok) {
                          // Restore on failure
                          const restored = initialComments.find(
                            (c) => c.id === targetId,
                          );
                          if (restored) {
                            setComments((prev) =>
                              prev.some((c) => c.id === restored.id)
                                ? prev
                                : [...prev, restored],
                            );
                          }
                          setError(res.error ?? "Kunde inte radera.");
                        }
                      });
                    }}
                    className="flex-1 rounded-full bg-red-500 text-white py-3 text-sm font-semibold hover:bg-red-600 disabled:opacity-60"
                  >
                    Radera
                  </button>
                </div>
              </div>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>

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
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground-subtle outline-none disabled:cursor-not-allowed"
          />
          {body && isPersisted && (
            <button
              type="submit"
              disabled={pending}
              className="text-sm text-foreground font-semibold disabled:opacity-50"
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
