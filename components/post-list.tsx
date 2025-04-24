"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Smile, Trash } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Post = Database["public"]["Tables"]["posts"]["Row"];
type Reaction = Database["public"]["Tables"]["reactions"]["Row"];
type User = Database["public"]["Tables"]["users"]["Row"];

const EMOJI_OPTIONS = ["👍", "❤️", "😄", "🎉", "🤔", "👀"];

export function PostList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Get current user
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        setCurrentUser(userData);
      }
    };

    // Fetch initial posts
    const fetchPosts = async () => {
      const { data: postsData } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (postsData) setPosts(postsData);
    };

    // Fetch initial reactions
    const fetchReactions = async () => {
      const { data: reactionsData } = await supabase
        .from("reactions")
        .select("*");
      if (reactionsData) setReactions(reactionsData);
    };

    fetchCurrentUser();
    fetchPosts();
    fetchReactions();

    // Subscribe to new posts
    const postsSubscription = supabase
      .channel("posts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => {
          setPosts((current) => [payload.new as Post, ...current]);
        }
      )
      .subscribe();

    // Subscribe to reactions
    const reactionsSubscription = supabase
      .channel("reactions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reactions" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setReactions((current) => [...current, payload.new as Reaction]);
          } else if (payload.eventType === "DELETE") {
            setReactions((current) =>
              current.filter((r) => r.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      postsSubscription.unsubscribe();
      reactionsSubscription.unsubscribe();
    };
  }, [supabase]);

  const handleReaction = async (postId: string, reactionType: string) => {
    if (!currentUser) return;

    const existingReaction = reactions.find(
      (r) =>
        r.post_id === postId &&
        r.user_id === currentUser.id &&
        r.reaction_type === reactionType
    );

    if (existingReaction) {
      await supabase
        .from("reactions")
        .delete()
        .match({ id: existingReaction.id });
    } else {
      await supabase.from("reactions").insert({
        post_id: postId,
        user_id: currentUser.id,
        reaction_type: reactionType,
      });
    }
  };

  const handleDelete = async (postId: string) => {
    if (!currentUser) return;
    
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (!currentUser.is_admin && post.user_id !== currentUser.id) return;

    const { error } = await supabase
      .from("posts")
      .delete()
      .match({ id: postId });

    if (!error) {
      setPosts(posts.filter(p => p.id !== postId));
    }
  };

  const getReactionCount = (postId: string, reactionType: string) => {
    return reactions.filter(
      (r) => r.post_id === postId && r.reaction_type === reactionType
    ).length;
  };

  const getTotalReactionCount = (postId: string) => {
    return reactions.filter((r) => r.post_id === postId).length;
  };

  // 投稿をリアクション数で並び替え
  const sortedPosts = [...posts].sort((a, b) => {
    const aCount = getTotalReactionCount(a.id);
    const bCount = getTotalReactionCount(b.id);
    if (bCount !== aCount) {
      return bCount - aCount; // リアクション数の降順
    }
    // リアクション数が同じ場合は投稿日時の降順
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const canModifyPost = (post: Post) => {
    if (!currentUser) return false;
    return currentUser.is_admin || post.user_id === currentUser.id;
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {sortedPosts.map((post) => (
        <Card key={post.id}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {new Date(post.created_at).toLocaleString()}
              </div>
              {canModifyPost(post) && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(post.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <div className="flex gap-2">
              {EMOJI_OPTIONS.map((emoji) => {
                const count = getReactionCount(post.id, emoji);
                return (
                  <Button
                    key={emoji}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReaction(post.id, emoji)}
                    className={count > 0 ? "bg-accent" : ""}
                  >
                    {emoji} {count > 0 && count}
                  </Button>
                );
              })}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-2">
                <div className="grid grid-cols-6 gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReaction(post.id, emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}