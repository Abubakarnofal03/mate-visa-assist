import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Bot, User, Send, MessageCircle, Loader2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  message: string;
  response: string;
  created_at: string;
}

interface ChatConversation {
  id: string;
  title: string;
  updated_at: string;
}

const VisaConsultantChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    "What documents do I need for a student visa?",
    "How long does the visa process take?",
    "What should I do next based on my current progress?",
    "How do I prepare for a visa interview?",
    "What are the financial requirements?"
  ];

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages();
    }
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
      
      if (data && data.length > 0 && !activeConversation) {
        setActiveConversation(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const fetchMessages = async () => {
    if (!activeConversation) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', activeConversation)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (messageText: string = currentMessage) => {
    if (!messageText.trim() || !user || isLoading) return;

    setIsLoading(true);
    const tempMessage = messageText;
    setCurrentMessage('');

    try {
      const { data, error } = await supabase.functions.invoke('visa-consultant-chat', {
        body: {
          message: tempMessage,
          conversationId: activeConversation,
          userId: user.id
        }
      });

      if (error) throw error;

      if (data.success) {
        // If this is a new conversation, update the conversation ID
        if (!activeConversation && data.conversationId) {
          setActiveConversation(data.conversationId);
          await fetchConversations();
        } else {
          await fetchMessages();
        }

        toast({
          title: "Response received",
          description: "The visa consultant has provided guidance",
        });
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = () => {
    setActiveConversation(null);
    setMessages([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoadingConversations) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">Visa Consultant</h2>
        </div>
        <Button onClick={startNewConversation} variant="outline" size="sm">
          <MessageCircle className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Conversations Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Chat History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-64">
                {conversations.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4">No conversations yet</p>
                ) : (
                  <div className="space-y-1 p-2">
                    {conversations.map((conv) => (
                      <Button
                        key={conv.id}
                        variant={activeConversation === conv.id ? "secondary" : "ghost"}
                        className="w-full justify-start text-left h-auto p-2"
                        onClick={() => setActiveConversation(conv.id)}
                      >
                        <div className="truncate">
                          <div className="text-xs font-medium truncate">
                            {conv.title || 'Untitled Chat'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(conv.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">
                Ask me anything about visa processes, requirements, or next steps
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                  <div className="space-y-4">
                    <div className="text-center text-muted-foreground">
                      <Bot className="h-12 w-12 mx-auto mb-2 text-primary" />
                      <p className="text-sm">Hi! I'm your visa consultant assistant.</p>
                      <p className="text-xs">Ask me about visa requirements, processes, or your next steps.</p>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Quick questions:</p>
                      {quickQuestions.map((question, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="w-full text-left justify-start h-auto p-2 text-xs"
                          onClick={() => sendMessage(question)}
                          disabled={isLoading}
                        >
                          {question}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div key={msg.id} className="space-y-3">
                        {/* User Message */}
                        <div className="flex items-start gap-3">
                          <User className="h-6 w-6 mt-1 text-muted-foreground" />
                          <div className="flex-1 bg-muted p-3 rounded-lg">
                            <p className="text-sm">{msg.message}</p>
                          </div>
                        </div>
                        
                        {/* AI Response */}
                        <div className="flex items-start gap-3">
                          <Bot className="h-6 w-6 mt-1 text-primary" />
                          <div className="flex-1 bg-primary/5 p-3 rounded-lg">
                            <p className="text-sm whitespace-pre-wrap">{msg.response}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex items-start gap-3">
                        <Bot className="h-6 w-6 mt-1 text-primary" />
                        <div className="flex-1 bg-primary/5 p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Consulting...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder="Ask about visa requirements, next steps, or any questions..."
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => sendMessage()} 
                    disabled={!currentMessage.trim() || isLoading}
                    size="sm"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VisaConsultantChat;