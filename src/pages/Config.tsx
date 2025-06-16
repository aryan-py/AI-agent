import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

interface BusinessConfig {
  id: string;
  name: string;
  industry: string;
  location: string;
  greeting: string;
  qualifyingQuestions: string[];
  hotCriteria: string[];
  coldCriteria: string[];
  invalidCriteria: string[];
  // apiKey field not stored here
}

const API_KEY_LOCALSTORAGE_KEY = "openai_api_key";

const Config = () => {
  // Add state for API key with reading from localStorage
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem(API_KEY_LOCALSTORAGE_KEY) || "");
  const [apiKeyFormatWarning, setApiKeyFormatWarning] = useState(false);

  const [config, setConfig] = useState<BusinessConfig>({
    id: "1",
    name: "GrowEasy Realtors",
    industry: "real-estate",
    location: "Mumbai, India",
    greeting: "Hi {name}! Thanks for reaching out. I'm your GrowEasy real estate assistant.",
    qualifyingQuestions: [
      "Which city/location are you looking for?",
      "Are you looking for a flat, villa, or plot?",
      "Is this for investment or personal use?",
      "What's your budget range?",
      "What's your timeline for purchase/move?"
    ],
    hotCriteria: [
      "Specific location mentioned",
      "Clear budget range provided",
      "Urgent timeline (within 3-6 months)",
      "Ready for site visit",
      "Responsive to follow-up questions"
    ],
    coldCriteria: [
      "Vague requirements",
      "No clear timeline",
      "Budget not disclosed",
      "Just browsing",
      "Unresponsive to closing questions"
    ],
    invalidCriteria: [
      "Gibberish or non-meaningful responses",
      "Test entries",
      "Spam or bot activity",
      "Abusive language",
      "Completely irrelevant queries"
    ]
  });

  const [newQuestion, setNewQuestion] = useState("");
  const [newHotCriteria, setNewHotCriteria] = useState("");
  const [newColdCriteria, setNewColdCriteria] = useState("");
  const [newInvalidCriteria, setNewInvalidCriteria] = useState("");
  const [showApiKeyWarning, setShowApiKeyWarning] = useState(false);

  useEffect(() => {
    // On mount, sync apiKey from localStorage
    const savedApiKey = localStorage.getItem(API_KEY_LOCALSTORAGE_KEY) || "";
    setApiKey(savedApiKey);
  }, []);

  useEffect(() => {
    // Live feedback for format
    if (apiKey && !apiKey.trim().startsWith("sk-")) {
      setApiKeyFormatWarning(true);
    } else {
      setApiKeyFormatWarning(false);
    }
  }, [apiKey]);

  const handleSave = () => {
    // Save API key to localStorage
    if (!apiKey.trim()) {
      setShowApiKeyWarning(true);
      alert("Please enter your OpenAI API key to enable LLM features.");
      return;
    }
    // Optionally check format
    if (!apiKey.trim().startsWith("sk-")) {
      setApiKeyFormatWarning(true);
      alert("API key seems invalid. Please check and try again.");
      return;
    }
    setShowApiKeyWarning(false);
    setApiKeyFormatWarning(false);
    localStorage.setItem(API_KEY_LOCALSTORAGE_KEY, apiKey.trim());
    // Optionally, also store config in localStorage if future usage expected
    // localStorage.setItem("business_config", JSON.stringify(config));
    toast({ title: "Success", description: "API key saved. You can now start chatting." });
    alert("Configuration and API key saved successfully!");
  };

  const addQuestion = () => {
    if (newQuestion.trim()) {
      setConfig(prev => ({
        ...prev,
        qualifyingQuestions: [...prev.qualifyingQuestions, newQuestion.trim()]
      }));
      setNewQuestion("");
    }
  };

  const removeQuestion = (index: number) => {
    setConfig(prev => ({
      ...prev,
      qualifyingQuestions: prev.qualifyingQuestions.filter((_, i) => i !== index)
    }));
  };

  const addCriteria = (type: 'hot' | 'cold' | 'invalid', value: string) => {
    if (value.trim()) {
      const key = `${type}Criteria` as keyof BusinessConfig;
      setConfig(prev => ({
        ...prev,
        [key]: [...(prev[key] as string[]), value.trim()]
      }));
      
      if (type === 'hot') setNewHotCriteria("");
      if (type === 'cold') setNewColdCriteria("");
      if (type === 'invalid') setNewInvalidCriteria("");
    }
  };

  const removeCriteria = (type: 'hot' | 'cold' | 'invalid', index: number) => {
    const key = `${type}Criteria` as keyof BusinessConfig;
    setConfig(prev => ({
      ...prev,
      [key]: (prev[key] as string[]).filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
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
              <h1 className="text-3xl font-bold text-gray-900">Business Configuration</h1>
              <p className="text-gray-600">Configure your AI agent for different industries</p>
            </div>
          </div>
          <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
            <Save className="w-4 h-4 mr-2" />
            Save Configuration
          </Button>
        </div>

        {/* API Key Config */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              OpenAI API Key
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="api-key">Paste your OpenAI API key</Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={e => {
                setApiKey(e.target.value);
                if (showApiKeyWarning) setShowApiKeyWarning(false);
              }}
              placeholder="sk-..."
              autoComplete="off"
            />
            {apiKeyFormatWarning && apiKey && (
              <div className="text-sm text-yellow-600 mt-2">
                Key format seems invalid (should start with "sk-..."). Please check.
              </div>
            )}
            {showApiKeyWarning && (
              <div className="text-sm text-red-600 mt-2">
                Please enter your OpenAI API key to enable AI assistant features.
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Your OpenAI API key is stored securely in your browser and is never sent to our servers. 
              <a
                href="https://platform.openai.com/account/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="underline ml-1"
              >
                Get your API key.
              </a>
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={config.name}
                    onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Select 
                    value={config.industry} 
                    onValueChange={(value) => setConfig(prev => ({ ...prev, industry: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="real-estate">Real Estate</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="automotive">Automotive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={config.location}
                  onChange={(e) => setConfig(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="greeting">Greeting Message</Label>
                <Textarea
                  id="greeting"
                  value={config.greeting}
                  onChange={(e) => setConfig(prev => ({ ...prev, greeting: e.target.value }))}
                  placeholder="Use {name} for dynamic name insertion"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Qualifying Questions */}
          <Card>
            <CardHeader>
              <CardTitle>Qualifying Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {config.qualifyingQuestions.map((question, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input value={question} readOnly className="flex-1" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeQuestion(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex space-x-2">
                  <Input
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Add new qualifying question..."
                    onKeyPress={(e) => e.key === 'Enter' && addQuestion()}
                  />
                  <Button onClick={addQuestion}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Classification Criteria */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Hot Criteria */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Hot Lead Criteria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {config.hotCriteria.map((criteria, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input value={criteria} readOnly className="flex-1 text-sm" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeCriteria('hot', index)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <Input
                      value={newHotCriteria}
                      onChange={(e) => setNewHotCriteria(e.target.value)}
                      placeholder="Add hot criteria..."
                      className="text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && addCriteria('hot', newHotCriteria)}
                    />
                    <Button size="sm" onClick={() => addCriteria('hot', newHotCriteria)}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cold Criteria */}
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">Cold Lead Criteria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {config.coldCriteria.map((criteria, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input value={criteria} readOnly className="flex-1 text-sm" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeCriteria('cold', index)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <Input
                      value={newColdCriteria}
                      onChange={(e) => setNewColdCriteria(e.target.value)}
                      placeholder="Add cold criteria..."
                      className="text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && addCriteria('cold', newColdCriteria)}
                    />
                    <Button size="sm" onClick={() => addCriteria('cold', newColdCriteria)}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invalid Criteria */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-600">Invalid Lead Criteria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {config.invalidCriteria.map((criteria, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input value={criteria} readOnly className="flex-1 text-sm" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeCriteria('invalid', index)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <Input
                      value={newInvalidCriteria}
                      onChange={(e) => setNewInvalidCriteria(e.target.value)}
                      placeholder="Add invalid criteria..."
                      className="text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && addCriteria('invalid', newInvalidCriteria)}
                    />
                    <Button size="sm" onClick={() => addCriteria('invalid', newInvalidCriteria)}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Config;
