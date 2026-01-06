// src/components/AdminPanel.tsx
import { useState, useEffect, type FormEvent } from 'react';
import { Upload, Trash2, Loader2, CheckCircle, AlertCircle, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { supabase, type Event } from '../lib/supabase';
import imageCompression from 'browser-image-compression';

const AdminPanel = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    description: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileSizes, setFileSizes] = useState<{ original: number; compressed: number } | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      showMessage('error', 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1, // Maximum file size in MB
      maxWidthOrHeight: 1920, // Maximum width or height
      useWebWorker: true, // Use web worker for better performance
      fileType: 'image/jpeg', // Convert to JPEG for better compression
    };

    try {
      const compressed = await imageCompression(file, options);
      return compressed;
    } catch (error) {
      console.error('Compression error:', error);
      throw error;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Please select an image file');
      return;
    }

    // Validate file size (max 10MB for original)
    if (file.size > 10 * 1024 * 1024) {
      showMessage('error', 'Image size should be less than 10MB');
      return;
    }

    try {
      setCompressing(true);
      setSelectedFile(file);
      
      // Compress the image
      const compressed = await compressImage(file);
      setCompressedFile(compressed);
      
      // Store file sizes
      setFileSizes({
        original: file.size,
        compressed: compressed.size
      });

      // Create preview from compressed image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(compressed);

      const reduction = ((file.size - compressed.size) / file.size * 100).toFixed(1);
      showMessage('success', `Image compressed! Size reduced by ${reduction}%`);
    } catch (error) {
      console.error('Error processing image:', error);
      showMessage('error', 'Failed to compress image');
    } finally {
      setCompressing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = 'jpg'; // Always use jpg after compression
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('events-images')
      .upload(filePath, file, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('events-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.date || !formData.description || !compressedFile) {
      showMessage('error', 'Please fill all fields and select an image');
      return;
    }

    try {
      setUploading(true);

      // Upload compressed image to Supabase Storage
      const imageUrl = await uploadImage(compressedFile);

      // Insert event data to database
      const { error: insertError } = await supabase
        .from('events')
        .insert([
          {
            title: formData.title,
            date: formData.date,
            description: formData.description,
            image_url: imageUrl,
          },
        ]);

      if (insertError) throw insertError;

      showMessage('success', 'Event added successfully!');
      
      // Reset form
      setFormData({ title: '', date: '', description: '' });
      setSelectedFile(null);
      setCompressedFile(null);
      setPreviewUrl(null);
      setFileSizes(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Refresh events list
      fetchEvents();
    } catch (err) {
      console.error('Error adding event:', err);
      showMessage('error', 'Failed to add event. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (eventId: number, imageUrl: string) => {
    if (!confirm('Are you sure you want to delete this event? This will also remove the image.')) return;

    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('events-images')
        .remove([fileName]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        showMessage('error', 'Failed to delete image from storage');
        return;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (dbError) throw dbError;

      showMessage('success', 'Event and image deleted successfully');
      fetchEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
      showMessage('error', 'Failed to delete event');
    }
  };

  const clearImageSelection = () => {
    setSelectedFile(null);
    setCompressedFile(null);
    setPreviewUrl(null);
    setFileSizes(null);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 py-12">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Website
          </a>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Manage your events and uploads</p>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
            role="alert"
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p>{message.text}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Event Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Event</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Image * {compressing && <span className="text-blue-600">(Compressing...)</span>}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors relative">
                  {previewUrl ? (
                    <div className="p-4">
                      <div className="relative">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-h-64 mx-auto rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={clearImageSelection}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {fileSizes && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <ImageIcon className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">Compression Info</span>
                          </div>
                          <div className="text-sm text-gray-700 space-y-1">
                            <div className="flex justify-between">
                              <span>Original size:</span>
                              <span className="font-medium">{formatFileSize(fileSizes.original)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Compressed size:</span>
                              <span className="font-medium text-green-600">{formatFileSize(fileSizes.compressed)}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-blue-200">
                              <span>Saved:</span>
                              <span className="font-bold text-green-600">
                                {formatFileSize(fileSizes.original - fileSizes.compressed)} 
                                ({((fileSizes.original - fileSizes.compressed) / fileSizes.original * 100).toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      {compressing ? (
                        <div className="flex flex-col items-center">
                          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                          <p className="text-gray-600">Compressing image...</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                          <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
                          <p className="text-xs text-blue-600 mt-2">Images will be automatically compressed</p>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    type="file"
                    id="file-upload"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={compressing}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Tech Conference 2024"
                  required
                />
              </div>

              {/* Date */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  Event Date *
                </label>
                <input
                  type="text"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., March 15, 2024"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Brief description of the event..."
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={uploading || compressing || !compressedFile}
                className={`w-full py-4 px-6 rounded-lg font-medium text-white transition-all duration-300 flex items-center justify-center gap-2 ${
                  uploading || compressing || !compressedFile
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Add Event
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Events List */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Existing Events</h2>
              <span className="text-sm text-gray-600">{events.length} event(s)</span>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No events yet. Add your first event!</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow group"
                  >
                    <div className="flex gap-4">
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 mb-1 truncate">{event.title}</h3>
                        <p className="text-sm text-gray-600 mb-1">{event.date}</p>
                        <p className="text-sm text-gray-500 line-clamp-2">{event.description}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(event.id, event.image_url)}
                        className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors h-fit opacity-0 group-hover:opacity-100"
                        aria-label="Delete event"
                        title="Delete event and image"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;