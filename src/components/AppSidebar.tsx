import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
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
} from '@/components/ui/sidebar';
import { 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  FileEdit, 
  User, 
  LogOut,
  Briefcase
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

const AppSidebar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/documents', label: 'Documents', icon: FileText },
    { path: '/visa-progress', label: 'Visa Progress', icon: Calendar },
    { path: '/sop', label: 'SOPs', icon: FileEdit },
    { path: '/resume', label: 'Resume', icon: Briefcase },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center justify-center py-4">
          <Link to="/dashboard" className="flex-shrink-0">
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
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.path}
                  >
                    <Link to={item.path}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center justify-between p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;