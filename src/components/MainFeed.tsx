import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Plus, RotateCcw } from "lucide-react";
import { PostCard } from "./PostCard";
import { FilterTabs } from "./FilterTabs";
import { EmptyState } from "./EmptyState";
import { SettingsButton } from "./ui/SettingsButton";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { deletePost, fetchPosts, subscribeToNewPosts } from "../lib/posts";
import { filterPostsWithinRadius, calculateDistance } from "../utils/location";
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
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");
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
  }, []);

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
      const fetchedPosts = await fetchPosts();
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Failed to load posts:", error);
      toast.error("Failed to load posts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
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
      toast.success("Post deleted successfully");
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast.error("Failed to delete post");
    }
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
                  />
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
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