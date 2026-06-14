import { useState, FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router";

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        navigate("/profile");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName
            }
          }
        });
        if (error) throw error;
        // Profile system should auto-create based on triggers
        alert("Registration successful. Please check your email to verify your account if required, or login.");
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-20 flex justify-center">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-editorial font-medium">{isLogin ? "Sign In" : "Create Account"}</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {isLogin ? "Welcome back to Luxe" : "Join the Luxe premium experience"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <input 
                type="text" 
                required 
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full h-12 border border-border px-4 focus:outline-none focus:border-black transition-colors"
                placeholder="Jane Doe"
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full h-12 border border-border px-4 focus:outline-none focus:border-black transition-colors"
              placeholder="jane@example.com"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Password</label>
              {isLogin && (
                 <button type="button" className="text-xs text-muted-foreground underline">Forgot password?</button>
              )}
            </div>
            <input 
              type="password" 
              required 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full h-12 border border-border px-4 focus:outline-none focus:border-black transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-destructive text-sm font-medium">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full rounded-none tracking-widest uppercase">
            {loading ? "Processing..." : (isLogin ? "Sign In" : "Sign Up")}
          </Button>
        </form>

        <div className="text-center pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-foreground font-medium underline"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
