
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const NewLead = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    source: "",
    initialMessage: ""
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.phone) {
      alert("Please fill in required fields (Name and Phone)");
      return;
    }

    // Create new lead object
    const newLead = {
      id: Date.now().toString(),
      name: formData.name,
      phone: formData.phone,
      source: formData.source || "Manual Entry",
      message: formData.initialMessage,
      status: "pending" as const,
      timestamp: new Date().toISOString()
    };

    console.log("Creating new lead:", newLead);
    
    // Here you would save to JSON file or API
    // For demo, we'll just navigate to the chat
    alert("Lead created successfully!");
    navigate(`/chat/${newLead.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New Lead</h1>
              <p className="text-gray-600">Create a new lead and start qualification chat</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lead Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter lead's full name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+91-9876543210"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="source">Lead Source</Label>
              <Select 
                value={formData.source} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, source: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select lead source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Website inquiry">Website Inquiry</SelectItem>
                  <SelectItem value="Facebook Ad">Facebook Ad</SelectItem>
                  <SelectItem value="Google Ad">Google Ad</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Phone Call">Phone Call</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="Walk-in">Walk-in</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="message">Initial Message (Optional)</Label>
              <Textarea
                id="message"
                value={formData.initialMessage}
                onChange={(e) => setFormData(prev => ({ ...prev, initialMessage: e.target.value }))}
                placeholder="Any initial message from the lead..."
                rows={4}
              />
              <p className="text-sm text-gray-500 mt-1">
                If the lead has already sent a message, include it here to start the conversation naturally.
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700 flex-1">
                <MessageSquare className="w-4 h-4 mr-2" />
                Create Lead & Start Chat
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview Card */}
        {formData.name && (
          <Card className="mt-6 border-emerald-200">
            <CardHeader>
              <CardTitle className="text-emerald-700">Lead Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Name:</strong> {formData.name}</p>
                <p><strong>Phone:</strong> {formData.phone}</p>
                <p><strong>Source:</strong> {formData.source || "Manual Entry"}</p>
                {formData.initialMessage && (
                  <div>
                    <strong>Initial Message:</strong>
                    <p className="bg-gray-50 p-2 rounded mt-1 text-sm">
                      {formData.initialMessage}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default NewLead;
