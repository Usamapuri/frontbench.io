import React, { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { 
  School, 
  Users, 
  BookOpen, 
  BarChart3, 
  Shield, 
  Globe,
  CheckCircle,
  ArrowRight,
  Star
} from 'lucide-react';

export default function Landing() {
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    subdomain: ''
  });

  const [registerForm, setRegisterForm] = useState({
    schoolName: '',
    subdomain: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    phone: '',
    address: ''
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to subdomain
    if (loginForm.subdomain) {
      window.location.href = `http://${loginForm.subdomain}.frontbench.io/login`;
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle tenant registration
    console.log('Registering new tenant:', registerForm);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <School className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Frontbench.io</span>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary">Multi-Tenant SaaS</Badge>
            <Button variant="outline" asChild>
              <Link href="#demo">Demo</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            The Complete School
            <span className="text-blue-600"> Management Platform</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Everything your school needs in one place. Student management, billing, 
            attendance, grades, and more. Built for modern schools.
          </p>
          
          {/* Subdomain Login Form */}
          <Card className="max-w-md mx-auto mb-12">
            <CardHeader>
              <CardTitle>Access Your School</CardTitle>
              <CardDescription>
                Enter your school's subdomain to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="flex">
                  <Input
                    type="text"
                    placeholder="your-school"
                    value={loginForm.subdomain}
                    onChange={(e) => setLoginForm({...loginForm, subdomain: e.target.value})}
                    className="rounded-r-none"
                  />
                  <span className="flex items-center px-3 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500">
                    .frontbench.io
                  </span>
                </div>
                <Button type="submit" className="w-full" disabled={!loginForm.subdomain}>
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="#register">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">View Features</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything Your School Needs
            </h2>
            <p className="text-lg text-gray-600">
              Comprehensive tools designed specifically for educational institutions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Users className="h-8 w-8 text-blue-600" />,
                title: "Student Management",
                description: "Complete student profiles, enrollment tracking, and parent communication"
              },
              {
                icon: <BookOpen className="h-8 w-8 text-green-600" />,
                title: "Academic Management",
                description: "Subjects, classes, attendance, grades, and assessment tracking"
              },
              {
                icon: <BarChart3 className="h-8 w-8 text-purple-600" />,
                title: "Financial Management",
                description: "Invoicing, payments, expense tracking, and financial reporting"
              },
              {
                icon: <Shield className="h-8 w-8 text-red-600" />,
                title: "Secure & Private",
                description: "Complete data isolation between schools with bank-level security"
              },
              {
                icon: <Globe className="h-8 w-8 text-indigo-600" />,
                title: "Custom Branding",
                description: "Your own subdomain with custom colors, logos, and branding"
              },
              {
                icon: <Star className="h-8 w-8 text-yellow-600" />,
                title: "Easy Setup",
                description: "Get started in minutes with our intuitive setup process"
              }
            ].map((feature, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  {feature.icon}
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                </div>
                <p className="text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Section */}
      <section id="register" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Start Your School's Digital Journey
              </h2>
              <p className="text-lg text-gray-600">
                Join hundreds of schools already using Frontbench.io
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Create Your School Account</CardTitle>
                <CardDescription>
                  Get your own subdomain and start managing your school today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="register" className="w-full">
                  <TabsList className="grid w-full grid-cols-1">
                    <TabsTrigger value="register">Register New School</TabsTrigger>
                  </TabsList>
                  <TabsContent value="register">
                    <form onSubmit={handleRegister} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="schoolName">School Name *</Label>
                          <Input
                            id="schoolName"
                            type="text"
                            placeholder="Your School Name"
                            value={registerForm.schoolName}
                            onChange={(e) => setRegisterForm({...registerForm, schoolName: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subdomain">Subdomain *</Label>
                          <div className="flex">
                            <Input
                              id="subdomain"
                              type="text"
                              placeholder="your-school"
                              value={registerForm.subdomain}
                              onChange={(e) => setRegisterForm({...registerForm, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                              className="rounded-r-none"
                              required
                            />
                            <span className="flex items-center px-3 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500">
                              .frontbench.io
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="adminName">Administrator Name *</Label>
                        <Input
                          id="adminName"
                          type="text"
                          placeholder="Your Full Name"
                          value={registerForm.adminName}
                          onChange={(e) => setRegisterForm({...registerForm, adminName: e.target.value})}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="adminEmail">Administrator Email *</Label>
                          <Input
                            id="adminEmail"
                            type="email"
                            placeholder="admin@yourschool.edu"
                            value={registerForm.adminEmail}
                            onChange={(e) => setRegisterForm({...registerForm, adminEmail: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            value={registerForm.phone}
                            onChange={(e) => setRegisterForm({...registerForm, phone: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="adminPassword">Password *</Label>
                          <Input
                            id="adminPassword"
                            type="password"
                            placeholder="Choose a strong password"
                            value={registerForm.adminPassword}
                            onChange={(e) => setRegisterForm({...registerForm, adminPassword: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm Password *</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Confirm your password"
                            value={registerForm.confirmPassword}
                            onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">School Address</Label>
                        <Input
                          id="address"
                          type="text"
                          placeholder="123 School Street, City, State, ZIP"
                          value={registerForm.address}
                          onChange={(e) => setRegisterForm({...registerForm, address: e.target.value})}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm text-gray-600">
                          By registering, you agree to our Terms of Service and Privacy Policy
                        </span>
                      </div>

                      <Button type="submit" className="w-full" size="lg">
                        Create School Account
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <School className="h-6 w-6" />
                <span className="text-xl font-bold">Frontbench.io</span>
              </div>
              <p className="text-gray-400">
                The complete school management platform for modern educational institutions.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-white">Features</Link></li>
                <li><Link href="#demo" className="hover:text-white">Demo</Link></li>
                <li><Link href="#pricing" className="hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="#contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link href="#docs" className="hover:text-white">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#about" className="hover:text-white">About</Link></li>
                <li><Link href="#privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="#terms" className="hover:text-white">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Frontbench.io. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
