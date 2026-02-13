import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAdmin, AdminConfig } from '@/contexts/AdminContext';
import { adminLoginSchema, AdminLoginData } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, Settings, Code, Mail, Video, Calendar, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Admin: React.FC = () => {
  const { config, setConfig, isAuthenticated, login, logout } = useAdmin();
  const { toast } = useToast();
  const [localConfig, setLocalConfig] = useState<AdminConfig>(config);

  const loginForm = useForm<AdminLoginData>({
    resolver: zodResolver(adminLoginSchema),
  });

  const handleLogin = (data: AdminLoginData) => {
    const success = login(data.password);
    if (!success) {
      toast({
        title: 'Invalid password',
        description: 'Please enter the correct admin password.',
        variant: 'destructive',
      });
    }
  };

  const handleSave = () => {
    setConfig(localConfig);
    toast({
      title: 'Settings saved',
      description: 'Your configuration has been updated successfully.',
    });
  };

  const updateConfig = <K extends keyof AdminConfig>(key: K, value: AdminConfig[K]) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-primary-foreground" />
            </div>
            <CardTitle>Admin Dashboard</CardTitle>
            <CardDescription>Enter your password to access the configuration panel</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...loginForm.register('password')}
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Admin Configuration</h1>
          </div>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>

        <Tabs defaultValue="tracking" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tracking">Tracking</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="delays">Delays</TabsTrigger>
          </TabsList>

          <TabsContent value="tracking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Global Meta Tracking
                </CardTitle>
                <CardDescription>Configure your Meta Pixel ID and custom header scripts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="metaPixelId">Meta Pixel ID</Label>
                  <Input
                    id="metaPixelId"
                    value={localConfig.metaPixelId}
                    onChange={(e) => updateConfig('metaPixelId', e.target.value)}
                    placeholder="Enter your Meta Pixel ID"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="headerCodeBlock">Header Code Block</Label>
                  <Textarea
                    id="headerCodeBlock"
                    value={localConfig.headerCodeBlock}
                    onChange={(e) => updateConfig('headerCodeBlock', e.target.value)}
                    placeholder="Paste custom scripts to be added to <head>"
                    className="mt-1 font-mono text-sm"
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lead Event (Opt-In)</CardTitle>
                <CardDescription>Configure CAPI settings for the Lead event</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="leadCapiAccessToken">Lead CAPI Access Token</Label>
                  <Input
                    id="leadCapiAccessToken"
                    type="password"
                    value={localConfig.leadCapiAccessToken}
                    onChange={(e) => updateConfig('leadCapiAccessToken', e.target.value)}
                    placeholder="Enter CAPI Access Token"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="leadCapiTestEventCode">CAPI Test Event Code</Label>
                  <Input
                    id="leadCapiTestEventCode"
                    value={localConfig.leadCapiTestEventCode}
                    onChange={(e) => updateConfig('leadCapiTestEventCode', e.target.value)}
                    placeholder="TEST12345"
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="leadCapiTestEnabled">Enable Test Mode</Label>
                  <Switch
                    id="leadCapiTestEnabled"
                    checked={localConfig.leadCapiTestEnabled}
                    onCheckedChange={(checked) => updateConfig('leadCapiTestEnabled', checked)}
                  />
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Lead Event Code Reference:</p>
                  <code className="text-xs bg-background p-2 rounded block overflow-x-auto">
                    fbq('track', 'Lead', {'{'} content_name: 'VSL Opt-in' {'}'});
                  </code>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Submit Application Event (Booking)</CardTitle>
                <CardDescription>Configure CAPI settings for the SubmitApplication event</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="applicationCapiAccessToken">Application CAPI Access Token</Label>
                  <Input
                    id="applicationCapiAccessToken"
                    type="password"
                    value={localConfig.applicationCapiAccessToken}
                    onChange={(e) => updateConfig('applicationCapiAccessToken', e.target.value)}
                    placeholder="Enter CAPI Access Token"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="applicationCapiTestEventCode">CAPI Test Event Code</Label>
                  <Input
                    id="applicationCapiTestEventCode"
                    value={localConfig.applicationCapiTestEventCode}
                    onChange={(e) => updateConfig('applicationCapiTestEventCode', e.target.value)}
                    placeholder="TEST12345"
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="applicationCapiTestEnabled">Enable Test Mode</Label>
                  <Switch
                    id="applicationCapiTestEnabled"
                    checked={localConfig.applicationCapiTestEnabled}
                    onCheckedChange={(checked) => updateConfig('applicationCapiTestEnabled', checked)}
                  />
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-2">SubmitApplication Event Code Reference:</p>
                  <code className="text-xs bg-background p-2 rounded block overflow-x-auto">
                    fbq('track', 'SubmitApplication', {'{'} content_name: 'Booking Completed' {'}'});
                  </code>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  MailerLite
                </CardTitle>
                <CardDescription>Configure MailerLite integration for email marketing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="mailerLiteApiKey">MailerLite API Key</Label>
                  <Input
                    id="mailerLiteApiKey"
                    type="password"
                    value={localConfig.mailerLiteApiKey}
                    onChange={(e) => updateConfig('mailerLiteApiKey', e.target.value)}
                    placeholder="Enter MailerLite API Key"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="mailerLiteGroupId">MailerLite Group ID</Label>
                  <Input
                    id="mailerLiteGroupId"
                    value={localConfig.mailerLiteGroupId}
                    onChange={(e) => updateConfig('mailerLiteGroupId', e.target.value)}
                    placeholder="Enter Group ID"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Wistia Video
                </CardTitle>
                <CardDescription>Paste your Wistia embed code for the VSL</CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="wistiaEmbedCode">Wistia Embed Code</Label>
                  <Textarea
                    id="wistiaEmbedCode"
                    value={localConfig.wistiaEmbedCode}
                    onChange={(e) => updateConfig('wistiaEmbedCode', e.target.value)}
                    placeholder="Paste your Wistia embed code here..."
                    className="mt-1 font-mono text-sm"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Homepage Thumbnail
                </CardTitle>
                <CardDescription>Global thumbnail image URL for the homepage hero</CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="homeThumbnailUrl">Thumbnail URL</Label>
                  <Input
                    id="homeThumbnailUrl"
                    value={localConfig.homeThumbnailUrl}
                    onChange={(e) => updateConfig('homeThumbnailUrl', e.target.value)}
                    placeholder="https://example.com/thumbnail.jpg"
                    className="mt-1"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Leave blank to show the default yellow gradient. Use a CDN or cloud storage URL (e.g., Cloudinary, S3).
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Cal.com Booking
                </CardTitle>
                <CardDescription>Configure your Cal.com booking integration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="calComBookingSlug">Cal.com Booking Slug</Label>
                    <Input
                      id="calComBookingSlug"
                      value={localConfig.calComBookingSlug}
                      onChange={(e) => updateConfig('calComBookingSlug', e.target.value)}
                      placeholder="username/event-type"
                      className="mt-1"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Example: the-first-time-ceo/strategy-session
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="calComTextNotificationFieldIdentifier">Text Notifications Field Identifier (Optional)</Label>
                    <Input
                      id="calComTextNotificationFieldIdentifier"
                      value={localConfig.calComTextNotificationFieldIdentifier}
                      onChange={(e) => updateConfig('calComTextNotificationFieldIdentifier', e.target.value)}
                      placeholder="phone_text_notifications"
                      className="mt-1"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Use the Cal.com booking question identifier for the Phone number (Text notifications) field.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="calComWhatsAppFieldIdentifier">WhatsApp Field Identifier (Optional)</Label>
                    <Input
                      id="calComWhatsAppFieldIdentifier"
                      value={localConfig.calComWhatsAppFieldIdentifier}
                      onChange={(e) => updateConfig('calComWhatsAppFieldIdentifier', e.target.value)}
                      placeholder="whatsapp_number"
                      className="mt-1"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Use the Cal.com booking question identifier to prefill a custom WhatsApp field.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="delays" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  System Delays
                </CardTitle>
                <CardDescription>Configure timing delays for popups and buttons</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="popupDelay">Pop-up Delay (Seconds)</Label>
                  <Input
                    id="popupDelay"
                    type="number"
                    min="0"
                    value={localConfig.popupDelay}
                    onChange={(e) => updateConfig('popupDelay', parseInt(e.target.value) || 0)}
                    className="mt-1 w-32"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Time before the opt-in popup appears on the landing page
                  </p>
                </div>
                <div>
                  <Label htmlFor="vslButtonDelay">VSL Button Delay (Seconds)</Label>
                  <Input
                    id="vslButtonDelay"
                    type="number"
                    min="0"
                    value={localConfig.vslButtonDelay}
                    onChange={(e) => updateConfig('vslButtonDelay', parseInt(e.target.value) || 0)}
                    className="mt-1 w-32"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Time before the "Apply Now" button appears on the training page
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex justify-end">
          <Button onClick={handleSave} className="executive-button">
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Admin;
