

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  FileEdit, 
  User, 
  LogOut,
  Briefcase,
  Bot,
  Mail,
  Coffee
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

const AppSidebar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const { setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, tutorial: 'dashboard' },
    { path: '/documents', label: 'Documents', icon: FileText, tutorial: 'documents' },
    { path: '/visa-progress', label: 'Visa Progress', icon: Calendar, tutorial: 'visa-progress' },
    { path: '/visa-consultant', label: 'Visa Consultant', icon: Bot, tutorial: 'visa-consultant' },
    { path: '/sop', label: 'SOPs', icon: FileEdit, tutorial: 'sop' },
    { path: '/resume', label: 'Resume', icon: Briefcase, tutorial: 'resume' },
    { path: '/profile', label: 'Profile', icon: User, tutorial: 'profile' },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center justify-center py-4">
          <Link to="/dashboard" className="flex-shrink-0" onClick={handleNavClick}>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              VisaMate
            </h1>
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path} data-tutorial={item.tutorial}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.path}
                  >
                    <Link to={item.path} onClick={handleNavClick}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Contact Us Section */}
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="px-2 py-4 space-y-3">
              {/* Motivational Quote */}
              <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-start space-x-2">
                  <Coffee className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground italic leading-relaxed">
                    "Your visa journey starts with a single step. Stay focused, stay motivated!"
                  </p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="p-3 bg-muted/50 rounded-lg border">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Contact Developer</span>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">M. Abubakar Nofal</p>
                    <p className="text-primary">
                      email at : visamateservice@gmail.com
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="p-4 space-y-2">
          {/* User info */}
          <div className="flex items-center space-x-2 text-sm">
            <Avatar className="h-6 w-6">
              <AvatarImage src="" alt="User" />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{user?.email}</span>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center justify-center">
            {/* Mobile-friendly logout button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="flex items-center space-x-1"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;

