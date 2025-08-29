import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
    onSuccess: (user) => {
      toast({
        title: "Login Successful",
        description: "Welcome to Primax School Management System!",
      });
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center pb-2">
            {/* Logo Section */}
            <div className="mx-auto mb-6 w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">PMX</span>
            </div>
            
            <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to Primax
            </CardTitle>
            <p className="text-gray-600 text-sm">
              School Management System
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="h-11"
                  {...loginForm.register("email")}
                  data-testid="input-email"
                />
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-red-600">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="h-11 pr-10"
                    {...loginForm.register("password")}
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
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
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? "Signing In..." : "Sign In"}
              </Button>

              {/* Forgot Password Link */}
              <div className="text-center">
                <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="link"
                      className="text-sm text-blue-600 hover:text-blue-800 p-0 h-auto"
                      data-testid="button-forgot-password"
                    >
                      Forgot your password?
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
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
                        <Label htmlFor="forgot-email" className="text-sm font-medium">
                          Email Address
                        </Label>
                        <Input
                          id="forgot-email"
                          type="email"
                          placeholder="Enter your email"
                          {...forgotPasswordForm.register("email")}
                          data-testid="input-forgot-email"
                        />
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
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>© 2025 Primax Institute. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}