import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Users, TrendingUp, Settings, Upload, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  message?: string;
  status: "pending" | "hot" | "cold" | "invalid";
  timestamp: string;
}

interface Conversation {
  leadId: string;
  messages: Array<{
    sender: "agent" | "user";
    text: string;
    timestamp: string;
  }>;
  classification: {
    status: "hot" | "cold" | "invalid";
    metadata: any;
  };
}

const Index = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load sample data
  useEffect(() => {
    const sampleLeads: Lead[] = [
      {
        id: "1",
        name: "Rohit Sharma",
        phone: "+91-9876543210",
        source: "Website inquiry",
        message: "Hi, I'm interested in buying a property.",
        status: "hot",
        timestamp: new Date().toISOString()
      },
      {
        id: "2",
        name: "Priya Patel",
        phone: "+91-9876543211",
        source: "Facebook Ad",
        status: "cold",
        timestamp: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: "3",
        name: "Test User",
        phone: "+91-1234567890",
        source: "Website form",
        status: "invalid",
        timestamp: new Date(Date.now() - 172800000).toISOString()
      }
    ];
    setLeads(sampleLeads);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/json") {
      toast({
        title: "Invalid file type",
        description: "Please select a JSON file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        
        if (!Array.isArray(jsonData)) {
          throw new Error("JSON file must contain an array of leads");
        }

        const newLeads: Lead[] = jsonData.map((item: any, index: number) => ({
          id: item.id || `imported-${Date.now()}-${index}`,
          name: item.name || "Unknown",
          phone: item.phone || "",
          source: item.source || "JSON Import",
          message: item.message,
          status: item.status || "pending",
          timestamp: item.timestamp || new Date().toISOString()
        }));

        setLeads(prevLeads => [...prevLeads, ...newLeads]);
        
        toast({
          title: "Success",
          description: `Imported ${newLeads.length} leads from JSON file.`,
        });
      } catch (error) {
        toast({
          title: "Error parsing JSON",
          description: "Invalid JSON file format. Please check your file.",
          variant: "destructive",
        });
      }
    };
    
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadReports = () => {
    // Generate sample conversation data for demo
    const sampleConversations = leads.map(lead => ({
      leadId: lead.id,
      leadName: lead.name,
      leadPhone: lead.phone,
      transcript: [
        {
          sender: "agent",
          text: `Hi ${lead.name}! Thanks for reaching out. I'm your GrowEasy real estate assistant. Could you share which city/location you're looking for?`,
          timestamp: new Date().toISOString()
        },
        {
          sender: "user", 
          text: lead.message || "I'm looking for a 2BHK in Pune",
          timestamp: new Date().toISOString()
        },
        {
          sender: "agent",
          text: "Great choice! Are you looking for a flat, villa, or plot? Also, is this for investment or personal use?",
          timestamp: new Date().toISOString()
        },
        {
          sender: "user",
          text: "2BHK flat for personal use, budget around 75L",
          timestamp: new Date().toISOString()
        }
      ],
      classification: {
        status: lead.status,
        confidence: lead.status === "hot" ? 0.85 : lead.status === "cold" ? 0.65 : 0.3
      },
      extractedMetadata: {
        location: lead.status === "hot" ? "Pune" : lead.status === "cold" ? "Mumbai" : "Unknown",
        propertyType: lead.status === "hot" ? "2BHK Flat" : lead.status === "cold" ? "3BHK Villa" : "Not specified",
        budget: lead.status === "hot" ? "75L" : lead.status === "cold" ? "1.2Cr" : "Not specified",
        timeline: lead.status === "hot" ? "Immediate" : lead.status === "cold" ? "6 months" : "Unknown",
        purpose: lead.status === "hot" ? "Personal use" : lead.status === "cold" ? "Investment" : "Not specified"
      },
      conversationStarted: lead.timestamp,
      lastActivity: new Date().toISOString()
    }));

    const reportData = {
      exportDate: new Date().toISOString(),
      totalLeads: leads.length,
      summary: {
        hot: leads.filter(l => l.status === "hot").length,
        cold: leads.filter(l => l.status === "cold").length,
        invalid: leads.filter(l => l.status === "invalid").length,
        pending: leads.filter(l => l.status === "pending").length
      },
      conversations: sampleConversations
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lead-reports-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Reports Downloaded",
      description: "Chat transcripts and classifications have been exported successfully.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "hot": return "bg-red-500";
      case "cold": return "bg-blue-500";
      case "invalid": return "bg-gray-500";
      case "pending": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const stats = {
    total: leads.length,
    hot: leads.filter(l => l.status === "hot").length,
    cold: leads.filter(l => l.status === "cold").length,
    invalid: leads.filter(l => l.status === "invalid").length,
    pending: leads.filter(l => l.status === "pending").length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              AI Lead Qualification Agent
            </h1>
            <p className="text-lg text-gray-600">
              Intelligent WhatsApp-style lead qualification for real estate
            </p>
          </div>
          <div className="flex gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <Button 
              onClick={handleUploadClick}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Leads JSON
            </Button>
            <Button 
              onClick={handleDownloadReports}
              variant="outline"
              className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Reports
            </Button>
            <Button variant="outline" asChild>
              <Link to="/config">
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="border-l-4 border-l-gray-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Leads</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Hot Leads</p>
                  <p className="text-2xl font-bold text-red-600">{stats.hot}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Cold Leads</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.cold}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-gray-400">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Invalid</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.invalid}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <span className="text-emerald-600 font-semibold">
                        {lead.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{lead.name}</h3>
                      <p className="text-sm text-gray-600">{lead.phone}</p>
                      <p className="text-xs text-gray-500">{lead.source}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={`${getStatusColor(lead.status)} text-white`}>
                      {lead.status.toUpperCase()}
                    </Badge>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/chat/${lead.id}`}>
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Chat
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
