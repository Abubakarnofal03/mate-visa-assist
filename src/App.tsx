import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "./hooks/useAuth";
import { ThemeProvider } from "./components/ThemeProvider";
import AppSidebar from "./components/AppSidebar";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import VisaProgress from "./pages/VisaProgress";
import SOP from "./pages/SOP";
import Resume from "./pages/Resume";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="visamate-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="min-h-screen flex w-full">
                      <AppSidebar />
                      <main className="flex-1 flex flex-col">
                        <div className="p-4 border-b md:hidden">
                          <SidebarTrigger />
                        </div>
                        <div className="flex-1 p-6">
                          <Dashboard />
                        </div>
                      </main>
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="min-h-screen flex w-full">
                      <AppSidebar />
                      <main className="flex-1 flex flex-col">
                        <div className="p-4 border-b md:hidden">
                          <SidebarTrigger />
                        </div>
                        <div className="flex-1 p-6">
                          <Dashboard />
                        </div>
                      </main>
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/documents" 
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="min-h-screen flex w-full">
                      <AppSidebar />
                      <main className="flex-1 flex flex-col">
                        <div className="p-4 border-b md:hidden">
                          <SidebarTrigger />
                        </div>
                        <div className="flex-1 p-6">
                          <Documents />
                        </div>
                      </main>
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/visa-progress" 
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="min-h-screen flex w-full">
                      <AppSidebar />
                      <main className="flex-1 flex flex-col">
                        <div className="p-4 border-b md:hidden">
                          <SidebarTrigger />
                        </div>
                        <div className="flex-1 p-6">
                          <VisaProgress />
                        </div>
                      </main>
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/sop" 
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="min-h-screen flex w-full">
                      <AppSidebar />
                      <main className="flex-1 flex flex-col">
                        <div className="p-4 border-b md:hidden">
                          <SidebarTrigger />
                        </div>
                        <div className="flex-1 p-6">
                          <SOP />
                        </div>
                      </main>
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/resume" 
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="min-h-screen flex w-full">
                      <AppSidebar />
                      <main className="flex-1 flex flex-col">
                        <div className="p-4 border-b md:hidden">
                          <SidebarTrigger />
                        </div>
                        <div className="flex-1 p-6">
                          <Resume />
                        </div>
                      </main>
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="min-h-screen flex w-full">
                      <AppSidebar />
                      <main className="flex-1 flex flex-col">
                        <div className="p-4 border-b md:hidden">
                          <SidebarTrigger />
                        </div>
                        <div className="flex-1 p-6">
                          <Profile />
                        </div>
                      </main>
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
