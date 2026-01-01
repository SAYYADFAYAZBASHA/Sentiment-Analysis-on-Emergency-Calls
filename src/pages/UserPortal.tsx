import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/dashboard/Header';
import { AddEmergencyCallForm } from '@/components/dashboard/AddEmergencyCallForm';
import { UserCallHistory } from '@/components/dashboard/UserCallHistory';
import { EmergencyContacts } from '@/components/dashboard/EmergencyContacts';
import { useEmergencyCallNotifications } from '@/hooks/useEmergencyCallNotifications';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Phone, 
  PhoneIncoming, 
  PhoneOutgoing, 
  Loader2, 
  Users,
  User,
  PlusCircle,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  CheckCheck
} from 'lucide-react';

interface EmergencyCall {
  id: string;
  transcript: string;
  urgency: string;
  sentiment: string;
  sentiment_score: number;
  emotional_tone: string;
  incident_type: string | null;
  location: string | null;
  keywords: string[] | null;
  created_at: string;
  user_id: string;
  recipient_id: string | null;
  status: string;
  caller_email?: string;
  recipient_email?: string;
}

const UserPortal = () => {
  const { user, userRole, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dialedCalls, setDialedCalls] = useState<EmergencyCall[]>([]);
  const [receivedCalls, setReceivedCalls] = useState<EmergencyCall[]>([]);
  const [loadingCalls, setLoadingCalls] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('my-calls');

  useEmergencyCallNotifications(true);

  const handleCallAdded = () => {
    setRefreshTrigger(prev => prev + 1);
    fetchCalls();
  };

  // Listen for navigation events from notifications
  useEffect(() => {
    const handleNavigateToReceived = () => {
      setActiveTab('received');
      fetchCalls();
    };
    
    window.addEventListener('navigate-to-received', handleNavigateToReceived);
    return () => {
      window.removeEventListener('navigate-to-received', handleNavigateToReceived);
    };
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth?portal=user');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchCalls();
    }
  }, [user, refreshTrigger]);

  // Real-time subscription for received calls
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-portal-calls')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergency_calls',
        },
        (payload) => {
          console.log('Call update received:', payload);
          fetchCalls();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchCalls = useCallback(async () => {
    if (!user) return;
    setLoadingCalls(true);
    try {
      // Fetch user's dialed calls (where user_id = current user)
      const { data: myDialedCalls, error: dialedError } = await supabase
        .from('emergency_calls')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (dialedError) throw dialedError;

      // Enrich dialed calls with recipient info
      if (myDialedCalls && myDialedCalls.length > 0) {
        const recipientIds = [...new Set(myDialedCalls.filter(c => c.recipient_id).map(c => c.recipient_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, email')
          .in('user_id', recipientIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.email]) || []);
        
        const enrichedDialed = myDialedCalls.map(call => ({
          ...call,
          status: (call as any).status || 'pending',
          recipient_email: call.recipient_id ? profileMap.get(call.recipient_id) || 'Unknown' : undefined
        })) as EmergencyCall[];
        
        setDialedCalls(enrichedDialed);
      } else {
        setDialedCalls([]);
      }

      // Fetch calls received by user (where recipient_id = current user)
      const { data: myReceivedCalls, error: receivedError } = await supabase
        .from('emergency_calls')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

      if (receivedError) throw receivedError;

      // Fetch caller information for received calls
      if (myReceivedCalls && myReceivedCalls.length > 0) {
        const callerIds = [...new Set(myReceivedCalls.map(c => c.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, email')
          .in('user_id', callerIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.email]) || []);
        
        const enrichedCalls = myReceivedCalls.map(call => ({
          ...call,
          status: (call as any).status || 'pending',
          caller_email: profileMap.get(call.user_id) || 'Unknown'
        })) as EmergencyCall[];
        
        setReceivedCalls(enrichedCalls);
      } else {
        setReceivedCalls([]);
      }
    } catch (error) {
      console.error('Error fetching calls:', error);
    } finally {
      setLoadingCalls(false);
    }
  }, [user]);

  const handleStatusUpdate = async (callId: string, newStatus: string) => {
    setUpdatingStatus(callId);
    try {
      const { error } = await supabase
        .from('emergency_calls')
        .update({ status: newStatus } as any)
        .eq('id', callId);

      if (error) throw error;

      toast.success(`Call marked as ${newStatus}`);
      fetchCalls();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  const getUrgencyColor = (urgency: string) => {
    const colors: Record<string, string> = {
      low: 'bg-urgency-low/20 text-urgency-low',
      medium: 'bg-urgency-medium/20 text-urgency-medium',
      high: 'bg-urgency-high/20 text-urgency-high',
      critical: 'bg-urgency-critical/20 text-urgency-critical'
    };
    return colors[urgency] || 'bg-muted text-muted-foreground';
  };

  const getSentimentColor = (sentiment: string) => {
    const colors: Record<string, string> = {
      positive: 'bg-sentiment-positive/20 text-sentiment-positive',
      neutral: 'bg-sentiment-neutral/20 text-sentiment-neutral',
      negative: 'bg-sentiment-negative/20 text-sentiment-negative'
    };
    return colors[sentiment] || 'bg-muted text-muted-foreground';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'acknowledged':
        return <CheckCircle className="h-4 w-4" />;
      case 'resolved':
        return <CheckCheck className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/50';
      case 'acknowledged':
        return 'bg-blue-500/20 text-blue-600 border-blue-500/50';
      case 'resolved':
        return 'bg-green-500/20 text-green-600 border-green-500/50';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Calculate stats
  const totalDialed = dialedCalls.length;
  const totalReceived = receivedCalls.length;
  const pendingReceived = receivedCalls.filter(c => c.status === 'pending').length;
  const criticalDialed = dialedCalls.filter(c => c.urgency === 'critical').length;
  const criticalReceived = receivedCalls.filter(c => c.urgency === 'critical').length;
  const avgSentiment = dialedCalls.length > 0 
    ? dialedCalls.reduce((sum, c) => sum + c.sentiment_score, 0) / dialedCalls.length 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header userEmail={user.email} userRole={userRole} onSignOut={handleSignOut} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Portal Title */}
        <div className="mb-8 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">User Portal</h1>
            <p className="text-muted-foreground">Manage your emergency calls, contacts, and view call history</p>
          </div>
          {pendingReceived > 0 && (
            <Badge variant="destructive" className="ml-auto animate-pulse">
              {pendingReceived} Pending Call{pendingReceived > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="my-calls" className="flex items-center gap-1">
              <PlusCircle className="h-4 w-4" />
              My Calls
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="received" className="flex items-center gap-1 relative">
              <PhoneIncoming className="h-4 w-4" />
              Received
              {pendingReceived > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                  {pendingReceived}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="dialed" className="flex items-center gap-1">
              <PhoneOutgoing className="h-4 w-4" />
              Dialed
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              Analysis
            </TabsTrigger>
          </TabsList>

          {/* My Calls Tab */}
          <TabsContent value="my-calls" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <AddEmergencyCallForm onCallAdded={handleCallAdded} />
              <UserCallHistory refreshTrigger={refreshTrigger} />
            </div>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-6">
            <EmergencyContacts />
          </TabsContent>

          {/* Received Calls Tab */}
          <TabsContent value="received" className="space-y-6">
            <Card className="glass border-border/40 border-l-4 border-l-green-500">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <PhoneIncoming className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <CardTitle>Received Emergency Calls</CardTitle>
                    <CardDescription>Emergency calls directed to you - update status to notify callers</CardDescription>
                  </div>
                  <Badge variant="outline" className="ml-auto border-green-500 text-green-500">
                    {receivedCalls.length} call{receivedCalls.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {loadingCalls ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : receivedCalls.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No emergency calls received yet. Users must add you as a contact first.
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4 pr-4">
                      {receivedCalls.map((call) => (
                        <div key={call.id} className={`p-4 rounded-xl bg-background/50 border ${call.status === 'pending' ? 'border-yellow-500/50 shadow-yellow-500/10 shadow-lg' : 'border-border/40'}`}>
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <Badge variant="secondary" className="text-xs">
                              From: {call.caller_email}
                            </Badge>
                            <Badge className={getUrgencyColor(call.urgency)}>{call.urgency}</Badge>
                            <Badge className={getSentimentColor(call.sentiment)}>{call.sentiment}</Badge>
                            <Badge variant="outline" className={`flex items-center gap-1 ${getStatusColor(call.status)}`}>
                              {getStatusIcon(call.status)}
                              {call.status}
                            </Badge>
                            {call.incident_type && (
                              <Badge variant="outline">{call.incident_type.replace(/_/g, ' ')}</Badge>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto">
                              {new Date(call.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed mb-3">{call.transcript}</p>
                          {call.location && (
                            <p className="text-xs text-muted-foreground mb-3">Location: {call.location}</p>
                          )}
                          
                          {/* Status Update Controls */}
                          <div className="flex items-center gap-2 pt-3 border-t border-border/40">
                            <span className="text-sm text-muted-foreground">Update status:</span>
                            <Select
                              value={call.status}
                              onValueChange={(value) => handleStatusUpdate(call.id, value)}
                              disabled={updatingStatus === call.id}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">
                                  <span className="flex items-center gap-2">
                                    <Clock className="h-3 w-3" /> Pending
                                  </span>
                                </SelectItem>
                                <SelectItem value="acknowledged">
                                  <span className="flex items-center gap-2">
                                    <CheckCircle className="h-3 w-3" /> Acknowledged
                                  </span>
                                </SelectItem>
                                <SelectItem value="resolved">
                                  <span className="flex items-center gap-2">
                                    <CheckCheck className="h-3 w-3" /> Resolved
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {updatingStatus === call.id && (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dialed Calls Tab */}
          <TabsContent value="dialed" className="space-y-6">
            <Card className="glass border-border/40 border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <PhoneOutgoing className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle>Dialed Emergency Calls</CardTitle>
                    <CardDescription>Emergency calls you have made to your contacts</CardDescription>
                  </div>
                  <Badge variant="outline" className="ml-auto border-blue-500 text-blue-500">
                    {dialedCalls.length} call{dialedCalls.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {loadingCalls ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : dialedCalls.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    You haven't made any emergency calls yet. Add contacts first, then make a call.
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4 pr-4">
                      {dialedCalls.map((call) => (
                        <div key={call.id} className="p-4 rounded-xl bg-background/50 border border-border/40">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            {call.recipient_email && (
                              <Badge variant="secondary" className="text-xs">
                                To: {call.recipient_email}
                              </Badge>
                            )}
                            <Badge className={getUrgencyColor(call.urgency)}>{call.urgency}</Badge>
                            <Badge className={getSentimentColor(call.sentiment)}>{call.sentiment}</Badge>
                            <Badge variant="outline" className={`flex items-center gap-1 ${getStatusColor(call.status)}`}>
                              {getStatusIcon(call.status)}
                              {call.status}
                            </Badge>
                            {call.incident_type && (
                              <Badge variant="outline">{call.incident_type.replace(/_/g, ' ')}</Badge>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto">
                              {new Date(call.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed mb-2">{call.transcript}</p>
                          {call.location && (
                            <p className="text-xs text-muted-foreground">Location: {call.location}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="glass border-border/40">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <PhoneOutgoing className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{totalDialed}</p>
                      <p className="text-sm text-muted-foreground">Dialed Calls</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-border/40">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <PhoneIncoming className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{totalReceived}</p>
                      <p className="text-sm text-muted-foreground">Received Calls</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-border/40">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{criticalDialed + criticalReceived}</p>
                      <p className="text-sm text-muted-foreground">Critical Calls</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-border/40">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{pendingReceived}</p>
                      <p className="text-sm text-muted-foreground">Pending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="glass border-border/40">
                <CardHeader>
                  <CardTitle>Your Dialed Calls Analysis</CardTitle>
                  <CardDescription>Breakdown of your emergency calls by urgency</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['critical', 'high', 'medium', 'low'].map(level => {
                      const count = dialedCalls.filter(c => c.urgency === level).length;
                      const percentage = totalDialed > 0 ? (count / totalDialed) * 100 : 0;
                      return (
                        <div key={level} className="flex items-center gap-4">
                          <Badge className={getUrgencyColor(level)} variant="outline">{level}</Badge>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${level === 'critical' ? 'bg-urgency-critical' : level === 'high' ? 'bg-urgency-high' : level === 'medium' ? 'bg-urgency-medium' : 'bg-urgency-low'}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-12">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-border/40">
                <CardHeader>
                  <CardTitle>Received Calls Analysis</CardTitle>
                  <CardDescription>Breakdown of received emergency calls by urgency</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['critical', 'high', 'medium', 'low'].map(level => {
                      const count = receivedCalls.filter(c => c.urgency === level).length;
                      const percentage = totalReceived > 0 ? (count / totalReceived) * 100 : 0;
                      return (
                        <div key={level} className="flex items-center gap-4">
                          <Badge className={getUrgencyColor(level)} variant="outline">{level}</Badge>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${level === 'critical' ? 'bg-urgency-critical' : level === 'high' ? 'bg-urgency-high' : level === 'medium' ? 'bg-urgency-medium' : 'bg-urgency-low'}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-12">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status Distribution */}
            <Card className="glass border-border/40">
              <CardHeader>
                <CardTitle>Call Status Overview</CardTitle>
                <CardDescription>Distribution of received calls by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {['pending', 'acknowledged', 'resolved'].map(status => {
                    const count = receivedCalls.filter(c => c.status === status).length;
                    return (
                      <div key={status} className={`p-4 rounded-xl border ${getStatusColor(status)}`}>
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(status)}
                          <span className="font-medium capitalize">{status}</span>
                        </div>
                        <p className="text-2xl font-bold">{count}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default UserPortal;