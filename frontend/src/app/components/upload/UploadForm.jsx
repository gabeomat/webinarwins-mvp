import { useState } from 'react';
import { parseAttendanceCSV, parseChatCSV, createWebinarWithData } from '../../../services/csvParserService';
import { supabase } from '../../../contexts/AuthContext';
import { Alert, Button, Card, Input, Textarea, FileUpload } from '../ui';

export default function UploadForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    offerName: '',
    offerDescription: '',
    price: '',
    deadline: '',
    replayUrl: '',
  });
  
  const [attendanceFile, setAttendanceFile] = useState(null);
  const [chatFile, setChatFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
      if (type === 'attendance') {
        setAttendanceFile(file);
      } else {
        setChatFile(file);
      }
      setError('');
    } else {
      setError('Please select a valid CSV file');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title) {
      setError('Webinar title is required');
      return;
    }

    if (!attendanceFile || !chatFile) {
      setError('Both CSV files are required');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to create a webinar');
      }

      const attendees = await parseAttendanceCSV(attendanceFile);
      const messages = await parseChatCSV(chatFile);

      const webinarData = {
        title: formData.title,
        topic: formData.topic,
        offer_name: formData.offerName,
        offer_description: formData.offerDescription,
        price: formData.price,
        deadline: formData.deadline,
        replay_url: formData.replayUrl,
      };

      const result = await createWebinarWithData(webinarData, attendees, messages, user.id);

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload files. Please check your CSV format and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-8 text-center">
        <h2 className="text-5xl md:text-6xl font-black text-brutal-black mb-4 uppercase" style={{ fontFamily: 'monospace' }}>
          Upload Webinar Data
        </h2>
        <div className="inline-block bg-brutal-yellow border-brutal border-brutal-black shadow-brutal px-6 py-3">
          <p className="text-brutal-black font-bold text-lg">
            Transform 3-5 hours → 15 minutes ⚡
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-brutal-cyan border-brutal border-brutal-black p-4 shadow-brutal-sm">
            <div className="text-3xl font-black">1</div>
            <div className="font-bold uppercase text-sm mt-1">Upload CSVs</div>
          </div>
          <div className="bg-brutal-lime border-brutal border-brutal-black p-4 shadow-brutal-sm">
            <div className="text-3xl font-black">2</div>
            <div className="font-bold uppercase text-sm mt-1">AI Analyzes</div>
          </div>
          <div className="bg-brutal-pink text-white border-brutal border-brutal-black p-4 shadow-brutal-sm">
            <div className="text-3xl font-black">3</div>
            <div className="font-bold uppercase text-sm mt-1">Get Emails</div>
          </div>
        </div>
      </Card>

      {error && (
        <Alert type="error" className="mb-6">
          <div className="flex items-start">
            <span className="text-2xl mr-3">⚠️</span>
            <span>{error}</span>
          </div>
        </Alert>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Webinar Details */}
          <div>
            <div className="bg-brutal-black text-brutal-yellow px-4 py-2 mb-6 inline-block">
              <h3 className="text-xl font-black uppercase">📊 Webinar Details</h3>
            </div>
            
            <div className="space-y-4">
              <Input
                label="Webinar Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Building Custom GPTs for Your Business"
                required
              />

              <Textarea
                label="Topic / Description"
                name="topic"
                value={formData.topic}
                onChange={handleInputChange}
                rows={3}
                placeholder="Brief description of what the webinar covered..."
              />
            </div>
          </div>

          {/* Offer Details */}
          <div>
            <div className="bg-brutal-black text-brutal-pink px-4 py-2 mb-6 inline-block">
              <h3 className="text-xl font-black uppercase">💰 Offer Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Offer Name"
                name="offerName"
                value={formData.offerName}
                onChange={handleInputChange}
                placeholder="e.g., AI Evolution Lab"
              />

              <Input
                label="Price ($)"
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                placeholder="97.00"
              />
            </div>

            <div className="mt-4">
              <Textarea
                label="Offer Description"
                name="offerDescription"
                value={formData.offerDescription}
                onChange={handleInputChange}
                rows={2}
                placeholder="What's included in the offer..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Input
                label="Deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleInputChange}
                placeholder="e.g., 48 hours, 3 days"
              />

              <Input
                label="Replay URL"
                type="url"
                name="replayUrl"
                value={formData.replayUrl}
                onChange={handleInputChange}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* CSV Uploads */}
          <div>
            <div className="bg-brutal-black text-brutal-cyan px-4 py-2 mb-6 inline-block">
              <h3 className="text-xl font-black uppercase">📁 Upload CSV Files</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FileUpload
                label="Attendance CSV"
                name="attendanceFile"
                file={attendanceFile}
                onChange={(e) => handleFileChange(e, 'attendance')}
                required
                icon="📊"
                successColor="lime"
                infoColor="yellow"
                infoText="Required: Name, Email, Attendance %, Focus %"
              />

              <FileUpload
                label="Chat CSV"
                name="chatFile"
                file={chatFile}
                onChange={(e) => handleFileChange(e, 'chat')}
                required
                icon="💬"
                successColor="cyan"
                infoColor="pink"
                infoText="Required: Timestamp, Name, Email, Message"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-6">
            <Button
              type="submit"
              disabled={loading}
              loading={loading}
              variant="primary"
              size="lg"
              className="min-w-xs"
            >
              {loading ? 'ANALYZING DATA...' : '🚀 UPLOAD & ANALYZE'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

