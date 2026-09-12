"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
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
import { useViewerEngagement } from "@/lib/viewer-engagement-context";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { Outfit } from "@/lib/types";
import {
  toggleLike,
  toggleSave,
  postComment,
  deleteComment,
} from "@/app/actions/engagement";
import { TrackView } from "@/components/outfit/TrackView";
import { AddToBoardButton } from "@/components/outfit/AddToBoardButton";
import { ShareButton } from "@/components/shared/ShareButton";
import { SaveForTikTokButton } from "@/components/outfit/SaveForTikTokButton";
import { ShareToDmSheet } from "@/components/shared/ShareToDmSheet";
import { ReportButton } from "@/components/shared/ReportButton";
import { HIDE_CREATORS } from "@/lib/flags";
import { JsonLd } from "@/components/seo/JsonLd";
import { outfitPageJsonLd } from "@/lib/json-ld";
import { outfitPath } from "@/lib/outfit-url";
import { slugify } from "@/lib/slug";
import { OutfitOwnerActions } from "@/components/outfit/OutfitOwnerActions";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Send } from "lucide-react";

export default function OutfitDetail({
  outfit,
  similar,
  isPersisted,
}: {
  outfit: Outfit;
  similar: Outfit[];
  isPersisted: boolean;
}) {
  const { isLoggedIn, requireAuth, user, profile } = useAuth();
  const engagement = useViewerEngagement();
  const isHome = outfit.vertical === "hem";
  // Admin status is read client-side so this page can be ISR cached.
  const viewerIsAdmin = !!profile?.isAdmin;
  const [, startTransition] = useTransition();

  // Liked/saved membership comes from the client-hydrated engagement context;
  // counts are the cached totals adjusted optimistically on toggle.
  const liked = engagement.isLiked(outfit.id);
  const saved = engagement.isSaved(outfit.id);
  const [likeCount, setLikeCount] = useState(outfit.likes);
  const [saveCount, setSaveCount] = useState(outfit.saves);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    setLikeCount(outfit.likes);
    setSaveCount(outfit.saves);
  }, [outfit.id, outfit.likes, outfit.saves]);

  const handleLike = () => {
    if (!isLoggedIn) {
      requireAuth("like");
      return;
    }
    const next = !liked;
    engagement.markLiked(outfit.id, next);
    setLikeCount((c) => c + (next ? 1 : -1));
    if (!isPersisted) return;
    startTransition(async () => {
      const res = await toggleLike(outfit.id);
      if (!res.ok) {
        engagement.markLiked(outfit.id, !next);
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
    engagement.markSaved(outfit.id, next);
    setSaveCount((c) => c + (next ? 1 : -1));
    if (!isPersisted) return;
    startTransition(async () => {
      const res = await toggleSave(outfit.id);
      if (!res.ok) {
        engagement.markSaved(outfit.id, !next);
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
            aria-label="Breadcrumbs"
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
                  href={isHome ? "/home" : "/upptack"}
                  className="hover:text-foreground transition-colors"
                >
                  {isHome ? "Heminredning" : "Outfits"}
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
              className="relative overflow-hidden rounded-2xl"
              // Matches the upload-padding colour (#F7F6F3 in lib/image-resize.ts)
              // so any cream band around portrait images blends into the background.
              style={{ backgroundColor: "#F7F6F3" }}
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
                  const noun = isHome ? "" : "-outfit";
                  if (top && cat) {
                    return `${cat}${noun} with ${top}`;
                  }
                  if (top) {
                    return `${isHome ? "Room" : "Outfit"} with ${top}`;
                  }
                  return outfit.title;
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
                />
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {!HIDE_CREATORS && (
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
                  <FollowButton userId={outfit.creator.id} />
                </div>
              )}

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
                  aria-label={liked ? "Remove like" : "Like"}
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
                  aria-label={saved ? "Remove from saved" : "Save"}
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
                    Send to a friend
                  </button>
                )}
                <ShareButton
                  url={outfitPath(outfit)}
                  title={outfit.title}
                  text={outfit.description || outfit.title}
                  label="Share link"
                  variant="outline"
                />
                {isPersisted && <SaveForTikTokButton outfitId={outfit.id} />}
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
                  {isHome ? "Tagged items" : "Tagged pieces"}
                </h3>
                <div className="rounded-2xl border border-border bg-background-secondary p-4">
                  {outfit.tags.length === 0 ? (
                    <p className="text-sm text-foreground-subtle">
                      {isHome ? "Inga taggade saker." : "Inga taggade plagg."}
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

          {/* ExploreLinks links garments→/typ and colors→/farg, both mode
              taxonomies — hide for home posts to avoid broken links. */}
          {!isHome && <ExploreLinks outfit={outfit} />}

          {similar.length > 0 && (
          <section className="mt-16 md:mt-24 mb-16">
            <h2 className="font-heading text-[28px] md:text-[40px] leading-[0.95] uppercase tracking-[-0.02em] text-foreground mb-8">
              Liknande{" "}
              <span className="text-foreground-subtle">
                {isHome ? "rum" : "outfits"}
              </span>
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {similar.map((o) => (
                <OutfitCard key={o.id} outfit={o} />
              ))}
            </div>
          </section>
          )}
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
        setError(res.error ?? "Something went wrong");
      }
    });
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-4 flex items-center gap-2">
        <MessageCircle className="h-4 w-4" />
        Comments ({comments.length})
      </h3>
      <div className="space-y-4">
        {comments.length === 0 && (
          <p className="text-sm text-foreground-subtle">
            No comments yet. Be the first to comment!
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
                    {new Date(comment.createdAt).toLocaleString("en-GB", {
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
                  aria-label="Delete comment"
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
                  Delete comment?
                </AlertDialog.Title>
                <AlertDialog.Description className="mt-3 text-sm text-foreground-muted">
                  This cannot be undone.
                </AlertDialog.Description>
                <div className="mt-6 flex gap-3">
                  <AlertDialog.Close
                    type="button"
                    className="flex-1 rounded-full border border-border text-foreground py-3 text-sm font-medium hover:border-foreground/30"
                  >
                    Cancel
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
                    Delete
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
          <UserAvatar src={viewerAvatar} alt="You" size="sm" />
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={
              isPersisted
                ? "Write a comment..."
                : "Comments open once the outfit is published"
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
              Post
            </button>
          )}
        </form>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </div>
  );
}

/**
 * Discreet internal-link strip — distinct colours and categories found
 * in the outfit tags, linked to /farg/<slug> and
 * /typ/<gender>/<garment>. Only renders when there is at least one chip
 * to show, so outfits without backfill don't get an empty heading.
 */
function ExploreLinks({ outfit }: { outfit: Outfit }) {
  const colors = Array.from(
    new Set(
      outfit.tags
        .map((t) => t.color?.toLowerCase().trim())
        .filter((c): c is string => !!c && c.length > 0),
    ),
  ).slice(0, 5);

  const garments = Array.from(
    new Set(
      outfit.tags
        .map((t) => t.garment?.toLowerCase().trim())
        .filter((g): g is string => !!g && g.length > 0),
    ),
  ).slice(0, 5);

  if (colors.length === 0 && garments.length === 0) return null;

  return (
    <section className="mt-16 md:mt-20 pb-2 border-t border-border pt-10">
      <h2 className="text-xs uppercase tracking-[0.25em] text-foreground-subtle mb-4">
        Explore similar
      </h2>
      <div className="space-y-3">
        {garments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {garments.map((g) => (
              <Link
                key={`g-${g}`}
                href={`/typ/${outfit.gender}/${slugify(g)}`}
                className="inline-block rounded-full border border-border bg-background-secondary px-3.5 py-1.5 text-xs text-foreground-muted hover:text-foreground hover:border-foreground/30 transition-colors capitalize"
              >
                {g} {outfit.gender === "herr" ? "men" : "women"}
              </Link>
            ))}
          </div>
        )}
        {colors.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <Link
                key={`c-${c}`}
                href={`/farg/${slugify(c)}`}
                className="inline-block rounded-full border border-border bg-background-secondary px-3.5 py-1.5 text-xs text-foreground-muted hover:text-foreground hover:border-foreground/30 transition-colors capitalize"
              >
                {c} outfits
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
