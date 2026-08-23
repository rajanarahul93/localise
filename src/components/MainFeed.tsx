import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Plus, RotateCcw, Archive } from "lucide-react";
import { PostCard } from "./PostCard";
import { FilterTabs } from "./FilterTabs";
import { EmptyState } from "./EmptyState";
import { SettingsButton } from "./ui/SettingsButton";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { deletePost, fetchPosts, subscribeToNewPosts } from "../lib/posts";
import { filterPostsWithinRadius, calculateDistance } from "../utils/location";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import type { Post, FilterCategory, Location } from "../types";
import toast from "react-hot-toast";

interface MainFeedProps {
  userLocation: Location;
  isManualLocation: boolean;
  onCreatePost: () => void;
  onOpenSettings: () => void;
}

export function MainFeed({
  userLocation,
  isManualLocation,
  onCreatePost,
  onOpenSettings,
}: MainFeedProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [archivedPosts, setArchivedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");
  const [showArchive, setShowArchive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filter posts within 1km radius
  const nearbyPosts = useMemo(() => {
    return filterPostsWithinRadius(
      posts,
      userLocation.lat,
      userLocation.lng,
      1
    );
  }, [posts, userLocation]);

  // Filter posts by category
  const filteredPosts = useMemo(() => {
    if (activeFilter === "all") return nearbyPosts;
    return nearbyPosts.filter((post) => post.category === activeFilter);
  }, [nearbyPosts, activeFilter]);

  // Calculate post counts for each category
  const postCounts = useMemo(() => {
    const counts: Record<FilterCategory, number> = {
      all: nearbyPosts.length,
      events: 0,
      "for-sale": 0,
      help: 0,
      recommendations: 0,
    };

    nearbyPosts.forEach((post: Post) => {
      counts[post.category]++;
    });

    return counts;
  }, [nearbyPosts]);

  // Load initial posts
  useEffect(() => {
    loadPosts();
    loadArchivedPosts();
  }, [user]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToNewPosts((newPost: Post) => {
      // Check if post is within 1km radius
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        newPost.lat,
        newPost.lng
      );

      if (distance <= 1) {
        setPosts((prev) => [newPost, ...prev]);
        toast.success("New post in your area!", {
          icon: "📍",
          duration: 3000,
        });
      }
    });

    return unsubscribe;
  }, [userLocation]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const fetchedPosts = await fetchPosts(false);
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Failed to load posts:", error);
      toast.error("Failed to load posts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadArchivedPosts = async () => {
    if (!user?.id) return;
    try {
      const { data: allPosts, error } = await supabase
        .from("posts")
        .select("*")
        .eq("is_archived", true)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching archived posts:", error);
        return;
      }

      setArchivedPosts(allPosts || []);
    } catch (error) {
      console.error("Failed to load archived posts:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    await loadArchivedPosts();
    setRefreshing(false);
    toast.success("Posts refreshed!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading posts in your area...
          </p>
        </div>
      </div>
    );
  }

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((post) => post.id !== postId));
      setArchivedPosts((prev) => prev.filter((post) => post.id !== postId));
      toast.success("Post deleted successfully");
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast.error("Failed to delete post");
    }
  };

  const handlePostArchiveChange = async () => {
    // Reload both lists when archive status changes
    await loadPosts();
    await loadArchivedPosts();
  };
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary-500 rounded-2xl flex items-center justify-center mr-3">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  Localize
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  📍 1km Radius Active {isManualLocation && "(Manual)"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative group">
                <button
                  onClick={() => setShowArchive(!showArchive)}
                  className={`p-2 rounded-xl transition-colors ${
                    showArchive
                      ? "bg-primary-100 dark:bg-primary-900/20"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="relative">
                    <Archive className={`w-5 h-5 ${
                      showArchive
                        ? "text-primary-600 dark:text-primary-400"
                        : "text-gray-600 dark:text-gray-400"
                    }`} />
                    {archivedPosts.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
                        {archivedPosts.length > 9 ? '9+' : archivedPosts.length}
                      </span>
                    )}
                  </div>
                </button>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <RotateCcw
                  className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />
              </button>
              <SettingsButton onClick={onOpenSettings} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {!showArchive ? (
          <>
            {/* Filter Tabs */}
            <FilterTabs
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              postCounts={postCounts}
            />

            {/* Posts List */}
            <AnimatePresence mode="wait">
              {filteredPosts.length === 0 ? (
                <EmptyState filter={activeFilter} onCreatePost={onCreatePost} />
              ) : (
                <motion.div
                  key={activeFilter}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {filteredPosts.map((post) => {
                    const distance = calculateDistance(
                      userLocation.lat,
                      userLocation.lng,
                      post.lat,
                      post.lng
                    );

                    return (
                      <PostCard
                        key={post.id}
                        post={post}
                        distance={distance}
                        onDelete={handleDeletePost}
                        onArchiveChange={handlePostArchiveChange}
                      />
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <>
            {/* Archive Header */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Archive className="w-5 h-5" />
                My Archived Posts
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Posts you've archived. Click "Unarchive" to restore them to the feed.
              </p>
            </div>

            {/* Archived Posts List */}
            <AnimatePresence mode="wait">
              {archivedPosts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12"
                >
                  <Archive className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No archived posts yet
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {archivedPosts.map((post) => {
                    const distance = calculateDistance(
                      userLocation.lat,
                      userLocation.lng,
                      post.lat,
                      post.lng
                    );

                    return (
                      <PostCard
                        key={post.id}
                        post={post}
                        distance={distance}
                        onDelete={handleDeletePost}
                        onArchiveChange={handlePostArchiveChange}
                        isArchived
                      />
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </main>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onCreatePost}
        className="floating-action-btn"
      >
        <Plus className="w-6 h-6" />
      </motion.button>
    </div>
  );
}