import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye, EyeOff, Mail, Lock, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import primaxLogoPath from "@assets/primax_logo_1756452842865.png";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type LoginForm = z.infer<typeof loginSchema>;
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const { toast } = useToast();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      return await apiRequest('POST', '/api/auth/login', data);
    },
    onSuccess: async (response) => {
      const user = await response.json();
      
      toast({
        title: "Login Successful",
        description: "Welcome to Primax School Management System!",
      });
      
      // Smart redirect based on user role - skip RoleSelector for non-super admins
      if (!user.isSuperAdmin) {
        let targetDashboard: string;
        
        if (user.role === 'teacher') {
          targetDashboard = 'teacher';
        } else if (user.role === 'finance') {
          targetDashboard = 'finance';
        } else if (user.role === 'management') {
          targetDashboard = 'management';
        } else {
          targetDashboard = 'finance'; // Default fallback
        }
        
        // Set role and redirect directly to dashboard
        localStorage.setItem('selectedRole', targetDashboard);
        window.location.href = '/dashboard';
      } else {
        // Super admins go to role selector
        window.location.href = '/';
      }
      
      onLoginSuccess(user);
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordForm) => {
      return await apiRequest('POST', '/api/auth/forgot-password', data);
    },
    onSuccess: () => {
      toast({
        title: "Password Reset Email Sent",
        description: "If an account exists with this email, you will receive password reset instructions.",
      });
      setForgotPasswordOpen(false);
      forgotPasswordForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onLoginSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  const onForgotPasswordSubmit = (data: ForgotPasswordForm) => {
    forgotPasswordMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Logo and Header Section */}
          <div className="text-center mb-8">
            <img 
              src={primaxLogoPath} 
              alt="Primax Logo" 
              className="h-12 mx-auto mb-6"
            />
            
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Welcome to Primax
            </h1>
            <p className="text-gray-600 text-sm">
              Sign in to access your account
            </p>
          </div>

          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium text-gray-700 block">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="hello@example.com"
                  className="pl-10 h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  {...loginForm.register("email")}
                  data-testid="input-email"
                />
              </div>
              {loginForm.formState.errors.email && (
                <p className="text-sm text-red-600">{loginForm.formState.errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label htmlFor="password" className="text-sm font-medium text-gray-700 block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="........"
                  className="pl-10 pr-10 h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  {...loginForm.register("password")}
                  data-testid="input-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {loginForm.formState.errors.password && (
                <p className="text-sm text-red-600">{loginForm.formState.errors.password.message}</p>
              )}
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full h-12 text-white font-medium text-base rounded-md"
              style={{ backgroundColor: '#253C8D' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e2f6b'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#253C8D'}
              disabled={loginMutation.isPending}
              data-testid="button-login"
            >
              {loginMutation.isPending ? "Signing In..." : "Sign In"}
            </Button>

            {/* Forgot Password Link */}
            <div className="text-center pt-2">
              <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm p-0 h-auto font-medium"
                    style={{ color: '#253C8D' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#1e2f6b'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#253C8D'}
                    data-testid="button-forgot-password"
                  >
                    Forgot Password?
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <KeyRound className="h-5 w-5" />
                      Reset Password
                    </DialogTitle>
                    <DialogDescription>
                      Enter your email address and we'll send you instructions to reset your password.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="forgot-email" className="text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="forgot-email"
                          type="email"
                          placeholder="Enter your email"
                          className="pl-10"
                          {...forgotPasswordForm.register("email")}
                          data-testid="input-forgot-email"
                        />
                      </div>
                      {forgotPasswordForm.formState.errors.email && (
                        <p className="text-sm text-red-600">{forgotPasswordForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setForgotPasswordOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={forgotPasswordMutation.isPending}
                        className="text-white"
                        style={{ backgroundColor: '#253C8D' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e2f6b'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#253C8D'}
                        data-testid="button-send-reset"
                      >
                        {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Email"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}