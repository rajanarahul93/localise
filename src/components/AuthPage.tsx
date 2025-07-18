import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { FormInput } from "./ui/FormInput";
import { LoadingSpinner } from "./ui/LoadingSpinner";

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn, signUp } = useAuth();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  if (!email || !password) {
    setError("Email and password must not be empty.");
    setLoading(false);
    return;
  }

  try {
    if (isLogin) {
      await signIn(email, password);
    } else {
      await signUp(email, password);
      setError("Check your email for verification link!");
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      setError(err.message);
    } else {
      setError("An unexpected error occurred.");
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="card p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {isLogin ? "Welcome Back" : "Join Localize"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isLogin ? "Sign in to your account" : "Create your account"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormInput
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              icon={<Mail className="w-5 h-5 text-gray-400" />}
              required
              disabled={loading}
            />

            <FormInput
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              icon={<Lock className="w-5 h-5 text-gray-400" />}
              required
              disabled={loading}
            />

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center p-3 rounded-xl text-sm ${
                  error.includes("Check your email")
                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                    : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                }`}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full btn-primary py-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  {isLogin ? "Signing In..." : "Creating Account..."}
                </div>
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              {isLogin
                ? "Don't have an account? Sign Up"
                : "Already have an account? Sign In"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}