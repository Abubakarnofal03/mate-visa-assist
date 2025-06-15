import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "./hooks/useAuth";
import { ThemeProvider } from "./components/ThemeProvider";
import { TutorialProvider } from "./hooks/useTutorial";
import AppSidebar from "./components/AppSidebar";
import Tutorial from "./components/Tutorial";
import { ThemeToggle } from "./components/ThemeToggle";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import VisaProgress from "./pages/VisaProgress";
import SOP from "./pages/SOP";
import Resume from "./pages/Resume";
import Profile from "./pages/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="visamate-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <TutorialProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="min-h-screen flex w-full">
                      <AppSidebar />
                       <main className="flex-1 flex flex-col overflow-hidden">
                         <div className="flex items-center justify-between p-2 border-b">
                           <div className="md:hidden">
                             <SidebarTrigger />
                           </div>
                           <div className="ml-auto">
                             <ThemeToggle />
                           </div>
                         </div>
                         <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
                           <Dashboard />
                         </div>
                       </main>
                    </div>
                    <Tutorial />
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
                       <main className="flex-1 flex flex-col overflow-hidden">
                         <div className="flex items-center justify-between p-2 border-b">
                           <div className="md:hidden">
                             <SidebarTrigger />
                           </div>
                           <div className="ml-auto">
                             <ThemeToggle />
                           </div>
                         </div>
                         <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
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
                       <main className="flex-1 flex flex-col overflow-hidden">
                         <div className="flex items-center justify-between p-2 border-b">
                           <div className="md:hidden">
                             <SidebarTrigger />
                           </div>
                           <div className="ml-auto">
                             <ThemeToggle />
                           </div>
                         </div>
                         <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
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
                       <main className="flex-1 flex flex-col overflow-hidden">
                         <div className="flex items-center justify-between p-2 border-b">
                           <div className="md:hidden">
                             <SidebarTrigger />
                           </div>
                           <div className="ml-auto">
                             <ThemeToggle />
                           </div>
                         </div>
                         <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
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
                       <main className="flex-1 flex flex-col overflow-hidden">
                         <div className="flex items-center justify-between p-2 border-b">
                           <div className="md:hidden">
                             <SidebarTrigger />
                           </div>
                           <div className="ml-auto">
                             <ThemeToggle />
                           </div>
                         </div>
                         <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
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
                       <main className="flex-1 flex flex-col overflow-hidden">
                         <div className="flex items-center justify-between p-2 border-b">
                           <div className="md:hidden">
                             <SidebarTrigger />
                           </div>
                           <div className="ml-auto">
                             <ThemeToggle />
                           </div>
                         </div>
                         <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
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
                       <main className="flex-1 flex flex-col overflow-hidden">
                         <div className="flex items-center justify-between p-2 border-b">
                           <div className="md:hidden">
                             <SidebarTrigger />
                           </div>
                           <div className="ml-auto">
                             <ThemeToggle />
                           </div>
                         </div>
                         <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
                           <Profile />
                         </div>
                       </main>
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={
              <ProtectedRoute>
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                     <main className="flex-1 flex flex-col overflow-hidden">
                       <div className="flex items-center justify-between p-2 border-b">
                         <div className="md:hidden">
                           <SidebarTrigger />
                         </div>
                         <div className="ml-auto">
                           <ThemeToggle />
                         </div>
                       </div>
                       <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
                         <Dashboard />
                       </div>
                     </main>
                  </div>
                </SidebarProvider>
              </ProtectedRoute>
            } />
          </Routes>
          <Tutorial />
          </TutorialProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
