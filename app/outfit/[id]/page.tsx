"use client";

import { use, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Bookmark, Share2, MessageCircle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { OutfitTag } from "@/components/outfit/OutfitTag";
import { TaggedItemCard } from "@/components/outfit/TaggedItem";
import { OutfitCard } from "@/components/outfit/OutfitCard";
import { UserAvatar } from "@/components/user/UserAvatar";
import { FollowButton } from "@/components/user/FollowButton";
import { IconButton } from "@/components/shared/IconButton";
import { outfits } from "@/lib/data";
import { motion } from "framer-motion";

export default function OutfitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const outfit = outfits.find((o) => o.id === id) ?? outfits[0];
  const similar = outfits.filter((o) => o.id !== outfit.id).slice(0, 3);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <>
      <Header />
      <main className="flex-1 pt-20 md:pt-24">
        <Container>
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left — Image with tags */}
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
              />
              {/* Tag dots on image */}
              {outfit.tags.map((tag) => (
                <OutfitTag key={tag.id} tag={tag} />
              ))}
            </motion.div>

            {/* Right — Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {/* Creator */}
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
                <FollowButton />
              </div>

              {/* Title & description */}
              <h1 className="font-heading text-[32px] md:text-[48px] leading-[0.95] uppercase tracking-[-0.02em] text-white mb-4">
                {outfit.title}
              </h1>
              <p className="text-foreground-muted mb-8">
                {outfit.description}
              </p>

              {/* Action buttons */}
              <div className="flex items-center gap-3 mb-8">
                <IconButton
                  size="lg"
                  onClick={() => setLiked(!liked)}
                  className={liked ? "bg-white/10" : ""}
                >
                  <Heart
                    className={`h-5 w-5 ${liked ? "fill-white text-white" : ""}`}
                  />
                </IconButton>
                <span className="text-sm text-foreground-muted mr-2">
                  {liked ? outfit.likes + 1 : outfit.likes}
                </span>

                <IconButton
                  size="lg"
                  onClick={() => setSaved(!saved)}
                  className={saved ? "bg-white/10" : ""}
                >
                  <Bookmark
                    className={`h-5 w-5 ${saved ? "fill-white text-white" : ""}`}
                  />
                </IconButton>
                <span className="text-sm text-foreground-muted mr-2">
                  {saved ? outfit.saves + 1 : outfit.saves}
                </span>

                <IconButton size="lg">
                  <Share2 className="h-5 w-5" />
                </IconButton>
              </div>

              {/* Tagged items */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-4">
                  Taggade plagg
                </h3>
                <div className="rounded-2xl border border-border bg-background-secondary p-4">
                  {outfit.tags.map((tag) => (
                    <TaggedItemCard key={tag.id} item={tag} />
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div>
                <h3 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Kommentarer ({outfit.comments.length})
                </h3>
                <div className="space-y-4">
                  {outfit.comments.length === 0 && (
                    <p className="text-sm text-foreground-subtle">
                      Inga kommentarer än. Var först med att kommentera!
                    </p>
                  )}
                  {outfit.comments.map((comment) => (
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
                          <span className="text-foreground-muted">
                            {comment.text}
                          </span>
                        </p>
                        <p className="text-xs text-foreground-subtle mt-1">
                          {comment.createdAt}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Comment input (non-functional) */}
                  <div className="flex gap-3 mt-6 pt-4 border-t border-border">
                    <UserAvatar
                      src="https://i.pravatar.cc/300?img=20"
                      alt="Du"
                      size="sm"
                    />
                    <input
                      type="text"
                      placeholder="Skriv en kommentar..."
                      className="flex-1 bg-transparent text-sm text-foreground-muted placeholder:text-foreground-subtle outline-none"
                      disabled
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Similar outfits */}
          <section className="mt-16 md:mt-24 mb-16">
            <h2 className="font-heading text-[28px] md:text-[40px] leading-[0.95] uppercase tracking-[-0.02em] text-white mb-8">
              Liknande <span className="text-foreground-subtle">outfits</span>
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {similar.map((o) => (
                <OutfitCard key={o.id} outfit={o} />
              ))}
            </div>
          </section>
        </Container>
      </main>
    </>
  );
}
