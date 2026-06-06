import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import {
  Users,
  Wallet,
  BookOpen,
  ShieldCheck,
  Palette,
  Zap,
} from "lucide-react";

const FEATURES = [
  { icon: Users, title: "Student Management", desc: "Complete student profiles and enrollment tracking." },
  { icon: Wallet, title: "Financial Management", desc: "Invoicing, payments, and financial reporting." },
  { icon: BookOpen, title: "Academic Management", desc: "Subjects, classes, attendance, and grades." },
  { icon: ShieldCheck, title: "Secure & Private", desc: "Complete data isolation between schools." },
  { icon: Palette, title: "Custom Branding", desc: "Your own subdomain with custom colors and logos." },
  { icon: Zap, title: "Easy Setup", desc: "Get started in minutes with an intuitive setup." },
];

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 text-white">
      {/* Top bar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="rounded-lg bg-white/95 px-3 py-1.5">
          <Logo />
        </div>
        <Button
          variant="ghost"
          className="text-white hover:bg-white/15 hover:text-white"
          onClick={() => setLocation("/login")}
          data-testid="link-sign-in"
        >
          Sign In
        </Button>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-6 pb-20">
        <section className="mx-auto max-w-3xl pt-10 text-center sm:pt-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            The Complete School<br className="hidden sm:block" /> Management Platform
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/85">
            Everything your school needs in one place — student management, billing,
            attendance, grades, and more.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="w-full bg-white px-8 text-violet-700 hover:bg-white/90 sm:w-auto"
              onClick={() => setLocation("/register")}
              data-testid="button-start-trial"
            >
              Start Free Trial
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full border-white/40 bg-transparent px-8 text-white hover:bg-white/15 hover:text-white sm:w-auto"
              onClick={() => setLocation("/login")}
              data-testid="button-view-demo"
            >
              View Demo
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-sm transition hover:bg-white/15"
            >
              <Icon className="mb-3 h-7 w-7 text-white" />
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-white/80">{desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
