// src/components/AdminPanel.tsx
import { useState, useEffect, type FormEvent } from 'react';
import { Upload, Trash2, Loader2, CheckCircle, AlertCircle, ArrowLeft, Image as ImageIcon, Video, Film } from 'lucide-react';
import { supabase } from '../lib/supabase';
import imageCompression from 'browser-image-compression';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

interface Event {
  id: number;
  title: string;
  date: string;
  description: string;
  image_url: string;
  created_at: string;
}

interface Poster {
  id: number;
  media_url: string;
  media_type: 'image' | 'video';
  created_at: string;
}

type TabType = 'events' | 'posters';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<TabType>('events');
  const [events, setEvents] = useState<Event[]>([]);
  const [posters, setPosters] = useState<Poster[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Event form state
  const [eventFormData, setEventFormData] = useState({
    title: '',
    date: '',
    description: '',
  });
  const [_selectedEventFile, setSelectedEventFile] = useState<File | null>(null);
  const [compressedEventFile, setCompressedEventFile] = useState<File | null>(null);
  const [eventPreviewUrl, setEventPreviewUrl] = useState<string | null>(null);
  const [eventFileSizes, setEventFileSizes] = useState<{ original: number; compressed: number } | null>(null);

  // Poster form state
  const [_selectedPosterFile, setSelectedPosterFile] = useState<File | null>(null);
  const [compressedPosterFile, setCompressedPosterFile] = useState<File | null>(null);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState<string | null>(null);
  const [posterFileSizes, setPosterFileSizes] = useState<{ original: number; compressed: number } | null>(null);
  const [posterMediaType, setPosterMediaType] = useState<'image' | 'video' | null>(null);
  
  // FFmpeg state
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [ffmpeg] = useState(() => new FFmpeg());

  useEffect(() => {
    loadFFmpeg();
    fetchEvents();
    fetchPosters();
  }, []);

  const loadFFmpeg = async () => {
    try {
      await ffmpeg.load();
      setFfmpegLoaded(true);
      console.log('FFmpeg loaded successfully');
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      showMessage('error', 'Video compression not available');
    }
  };

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

  const fetchPosters = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosters(data || []);
    } catch (err) {
      console.error('Error fetching posters:', err);
      showMessage('error', 'Failed to load posters');
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
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/jpeg',
    };

    try {
      const compressed = await imageCompression(file, options);
      return compressed;
    } catch (error) {
      console.error('Compression error:', error);
      throw error;
    }
  };

  const compressVideo = async (file: File): Promise<File> => {
    if (!ffmpegLoaded) {
      throw new Error('FFmpeg not loaded');
    }

    try {
      await ffmpeg.writeFile('input.mp4', await fetchFile(file));

      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-vf', 'scale=\'min(1280,iw)\':\'min(720,ih)\':force_original_aspect_ratio=decrease',
        '-c:v', 'libx264',
        '-crf', '28',
        '-preset', 'medium',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        'output.mp4'
      ]);

      const data = await ffmpeg.readFile('output.mp4') as Uint8Array;
      const compressed = new File([new Uint8Array(data)], file.name, { type: 'video/mp4' });

      await ffmpeg.deleteFile('input.mp4');
      await ffmpeg.deleteFile('output.mp4');

      return compressed;
    } catch (error) {
      console.error('Video compression error:', error);
      throw error;
    }
  };

  const handleEventFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showMessage('error', 'Image size should be less than 10MB');
      return;
    }

    try {
      setCompressing(true);
      setSelectedEventFile(file);
      
      const compressed = await compressImage(file);
      setCompressedEventFile(compressed);
      
      setEventFileSizes({
        original: file.size,
        compressed: compressed.size
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        setEventPreviewUrl(reader.result as string);
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

  const handlePosterFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      showMessage('error', 'Please select an image or video file');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      showMessage('error', 'File size should be less than 100MB');
      return;
    }

    try {
      setCompressing(true);
      setSelectedPosterFile(file);
      setPosterMediaType(isVideo ? 'video' : 'image');

      if (isImage) {
        const compressed = await compressImage(file);
        setCompressedPosterFile(compressed);
        
        setPosterFileSizes({
          original: file.size,
          compressed: compressed.size
        });

        const reader = new FileReader();
        reader.onloadend = () => {
          setPosterPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(compressed);

        const reduction = ((file.size - compressed.size) / file.size * 100).toFixed(1);
        showMessage('success', `Image compressed! Size reduced by ${reduction}%`);
      } else if (isVideo) {
        if (!ffmpegLoaded) {
          showMessage('error', 'Video compression not available. Uploading original...');
          setCompressedPosterFile(file);
          setPosterFileSizes({ original: file.size, compressed: file.size });
        } else {
          const compressed = await compressVideo(file);
          setCompressedPosterFile(compressed);
          
          setPosterFileSizes({
            original: file.size,
            compressed: compressed.size
          });

          const reduction = ((file.size - compressed.size) / file.size * 100).toFixed(1);
          showMessage('success', `Video compressed! Size reduced by ${reduction}%`);
        }

        const url = URL.createObjectURL(file);
        setPosterPreviewUrl(url);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      showMessage('error', 'Failed to process file');
    } finally {
      setCompressing(false);
    }
  };

  const handleEventInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEventFormData(prev => ({ ...prev, [name]: value }));
  };

  const uploadFile = async (file: File, bucket: string, isVideo: boolean = false): Promise<string> => {
    const fileExt = isVideo ? 'mp4' : 'jpg';
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const contentType = isVideo ? 'video/mp4' : 'image/jpeg';

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        contentType,
        cacheControl: '3600',
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleEventSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!eventFormData.title || !eventFormData.date || !eventFormData.description || !compressedEventFile) {
      showMessage('error', 'Please fill all fields and select an image');
      return;
    }

    try {
      setUploading(true);

      const imageUrl = await uploadFile(compressedEventFile, 'events-images');

      const { error: insertError } = await supabase
        .from('events')
        .insert([
          {
            title: eventFormData.title,
            date: eventFormData.date,
            description: eventFormData.description,
            image_url: imageUrl,
          },
        ]);

      if (insertError) throw insertError;

      showMessage('success', 'Event added successfully!');
      
      setEventFormData({ title: '', date: '', description: '' });
      setSelectedEventFile(null);
      setCompressedEventFile(null);
      setEventPreviewUrl(null);
      setEventFileSizes(null);
      
      const fileInput = document.getElementById('event-file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      fetchEvents();
    } catch (err) {
      console.error('Error adding event:', err);
      showMessage('error', 'Failed to add event. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handlePosterSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!compressedPosterFile || !posterMediaType) {
      showMessage('error', 'Please select a file');
      return;
    }

    try {
      setUploading(true);

      const mediaUrl = await uploadFile(
        compressedPosterFile, 
        'posters-media',
        posterMediaType === 'video'
      );

      const { error: insertError } = await supabase
        .from('posters')
        .insert([
          {
            media_url: mediaUrl,
            media_type: posterMediaType,
          },
        ]);

      if (insertError) throw insertError;

      showMessage('success', 'Poster added successfully!');
      
      setSelectedPosterFile(null);
      setCompressedPosterFile(null);
      setPosterPreviewUrl(null);
      setPosterFileSizes(null);
      setPosterMediaType(null);
      
      const fileInput = document.getElementById('poster-file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      fetchPosters();
    } catch (err) {
      console.error('Error adding poster:', err);
      showMessage('error', 'Failed to add poster. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteEvent = async (eventId: number, imageUrl: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];

      await supabase.storage.from('events-images').remove([fileName]);
      await supabase.from('events').delete().eq('id', eventId);

      showMessage('success', 'Event deleted successfully');
      fetchEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
      showMessage('error', 'Failed to delete event');
    }
  };

  const handleDeletePoster = async (posterId: number, mediaUrl: string) => {
    if (!confirm('Are you sure you want to delete this poster?')) return;

    try {
      const urlParts = mediaUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];

      await supabase.storage.from('posters-media').remove([fileName]);
      await supabase.from('posters').delete().eq('id', posterId);

      showMessage('success', 'Poster deleted successfully');
      fetchPosters();
    } catch (err) {
      console.error('Error deleting poster:', err);
      showMessage('error', 'Failed to delete poster');
    }
  };

  const clearEventSelection = () => {
    setSelectedEventFile(null);
    setCompressedEventFile(null);
    setEventPreviewUrl(null);
    setEventFileSizes(null);
    const fileInput = document.getElementById('event-file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const clearPosterSelection = () => {
    setSelectedPosterFile(null);
    setCompressedPosterFile(null);
    setPosterPreviewUrl(null);
    setPosterFileSizes(null);
    setPosterMediaType(null);
    const fileInput = document.getElementById('poster-file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 py-12">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="mb-8">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Website
          </a>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Manage your events and posters</p>
        </div>

        <div className="mb-8 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('events')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'events'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Events
              </div>
            </button>
            <button
              onClick={() => setActiveTab('posters')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'posters'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5" />
                Posters
              </div>
            </button>
          </div>
        </div>

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

        {activeTab === 'events' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Event</h2>
              
              <form onSubmit={handleEventSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Image * {compressing && <span className="text-blue-600">(Compressing...)</span>}
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors relative">
                    {eventPreviewUrl ? (
                      <div className="p-4">
                        <div className="relative">
                          <img
                            src={eventPreviewUrl}
                            alt="Preview"
                            className="max-h-64 mx-auto rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={clearEventSelection}
                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {eventFileSizes && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <ImageIcon className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-900">Compression Info</span>
                            </div>
                            <div className="text-sm text-gray-700 space-y-1">
                              <div className="flex justify-between">
                                <span>Original:</span>
                                <span className="font-medium">{formatFileSize(eventFileSizes.original)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Compressed:</span>
                                <span className="font-medium text-green-600">{formatFileSize(eventFileSizes.compressed)}</span>
                              </div>
                              <div className="flex justify-between pt-2 border-t border-blue-200">
                                <span>Saved:</span>
                                <span className="font-bold text-green-600">
                                  {formatFileSize(eventFileSizes.original - eventFileSizes.compressed)} 
                                  ({((eventFileSizes.original - eventFileSizes.compressed) / eventFileSizes.original * 100).toFixed(1)}%)
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
                            <p className="text-gray-600">Compressing...</p>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-2">Click to upload</p>
                            <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                          </>
                        )}
                      </div>
                    )}
                    <input
                      type="file"
                      id="event-file-upload"
                      accept="image/*"
                      onChange={handleEventFileChange}
                      disabled={compressing}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={eventFormData.title}
                    onChange={handleEventInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Tech Conference 2024"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Date *
                  </label>
                  <input
                    type="text"
                    id="date"
                    name="date"
                    value={eventFormData.date}
                    onChange={handleEventInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., March 15, 2024"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={eventFormData.description}
                    onChange={handleEventInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Brief description..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading || compressing || !compressedEventFile}
                  className={`w-full py-4 px-6 rounded-lg font-medium text-white transition-all duration-300 flex items-center justify-center gap-2 ${
                    uploading || compressing || !compressedEventFile
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
                  <p className="text-gray-500">No events yet</p>
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
                          onClick={() => handleDeleteEvent(event.id, event.image_url)}
                          className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors h-fit opacity-0 group-hover:opacity-100"
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
        )}

        {activeTab === 'posters' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Poster</h2>
              
              <form onSubmit={handlePosterSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image or Video * {compressing && <span className="text-blue-600">(Processing...)</span>}
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors relative">
                    {posterPreviewUrl ? (
                      <div className="p-4">
                        <div className="relative">
                          {posterMediaType === 'video' ? (
                            <video
                              src={posterPreviewUrl}
                              className="max-h-64 mx-auto rounded-lg"
                              controls
                            />
                          ) : (
                            <img
                              src={posterPreviewUrl}
                              alt="Preview"
                              className="max-h-64 mx-auto rounded-lg"
                            />
                          )}
                          <button
                            type="button"
                            onClick={clearPosterSelection}
                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {posterFileSizes && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              {posterMediaType === 'video' ? (
                                <Video className="w-4 h-4 text-blue-600" />
                              ) : (
                                <ImageIcon className="w-4 h-4 text-blue-600" />
                              )}
                              <span className="text-sm font-medium text-blue-900">Compression Info</span>
                            </div>
                            <div className="text-sm text-gray-700 space-y-1">
                              <div className="flex justify-between">
                                <span>Original:</span>
                                <span className="font-medium">{formatFileSize(posterFileSizes.original)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Compressed:</span>
                                <span className="font-medium text-green-600">{formatFileSize(posterFileSizes.compressed)}</span>
                              </div>
                              <div className="flex justify-between pt-2 border-t border-blue-200">
                                <span>Saved:</span>
                                <span className="font-bold text-green-600">
                                  {formatFileSize(posterFileSizes.original - posterFileSizes.compressed)} 
                                  ({((posterFileSizes.original - posterFileSizes.compressed) / posterFileSizes.original * 100).toFixed(1)}%)
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
                            <p className="text-gray-600">Processing...</p>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-2">Click to upload</p>
                            <p className="text-sm text-gray-500">Images or Videos up to 100MB</p>
                          </>
                        )}
                      </div>
                    )}
                    <input
                      type="file"
                      id="poster-file-upload"
                      accept="image/*,video/*"
                      onChange={handlePosterFileChange}
                      disabled={compressing}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploading || compressing || !compressedPosterFile}
                  className={`w-full py-4 px-6 rounded-lg font-medium text-white transition-all duration-300 flex items-center justify-center gap-2 ${
                    uploading || compressing || !compressedPosterFile
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
                      Add Poster
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Existing Posters</h2>
                <span className="text-sm text-gray-600">{posters.length} poster(s)</span>
              </div>
              
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : posters.length === 0 ? (
                <div className="text-center py-12">
                  <Film className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No posters yet</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {posters.map((poster) => (
                    <div
                      key={poster.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow group"
                    >
                      <div className="flex gap-4">
                        {poster.media_type === 'video' ? (
                          <video
                            src={poster.media_url}
                            className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                          />
                        ) : (
                          <img
                            src={poster.media_url}
                            alt="Poster"
                            className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0 flex items-center">
                          <div className="flex items-center gap-2">
                            {poster.media_type === 'video' ? (
                              <Video className="w-5 h-5 text-gray-600" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-gray-600" />
                            )}
                            <span className="text-sm text-gray-600 capitalize">{poster.media_type}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeletePoster(poster.id, poster.media_url)}
                          className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors h-fit opacity-0 group-hover:opacity-100"
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
        )}
      </div>
    </div>
  );
};

export default AdminPanel;