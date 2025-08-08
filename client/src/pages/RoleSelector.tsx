import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RoleSelector() {
  const [, setLocation] = useLocation();

  const roles = [
    {
      id: 'finance',
      title: 'Finance / Front Desk',
      description: 'Handle enrollments, invoicing, payments, and daily operations',
      icon: '💰',
      color: 'from-blue-500 to-blue-700'
    },
    {
      id: 'teacher',
      title: 'Teacher',
      description: 'Manage attendance, grades, and view earnings',
      icon: '📚',
      color: 'from-green-500 to-green-700'
    },
    {
      id: 'parent',
      title: 'Parent',
      description: 'View child attendance, grades, and fee information',
      icon: '👨‍👩‍👧‍👦',
      color: 'from-purple-500 to-purple-700'
    },
    {
      id: 'management',
      title: 'Management',
      description: 'Track expenses, teacher payouts, and generate reports',
      icon: '📊',
      color: 'from-orange-500 to-orange-700'
    }
  ];

  const selectRole = (roleId: string) => {
    localStorage.setItem('selectedRole', roleId);
    setLocation('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Primax School Management
          </h1>
          <p className="text-xl text-gray-600">
            Select your role to access the appropriate dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {roles.map((role) => (
            <Card key={role.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className={`h-3 bg-gradient-to-r ${role.color}`} />
              <CardHeader className="text-center pb-4">
                <div className="text-5xl mb-4">{role.icon}</div>
                <CardTitle className="text-2xl font-bold">{role.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-6">{role.description}</p>
                <Button 
                  onClick={() => selectRole(role.id)}
                  className="w-full py-3 text-lg"
                  data-testid={`button-select-${role.id}`}
                >
                  Enter {role.title} Dashboard
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">
            This is a demo version. In production, role access would be controlled by authentication.
          </p>
        </div>
      </div>
    </div>
  );
}