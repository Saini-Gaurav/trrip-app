import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone, FileRejection } from 'react-dropzone';
import {
  Upload, FileText, X, Sparkles, CheckCircle2,
  AlertCircle, Loader2, ArrowRight, Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { documentsApi, itinerariesApi } from '../services/api';
import { TravelDocument } from '../types';

type Step = 'upload' | 'processing' | 'generating';

interface UploadedFile {
  file: File;
  preview?: string;
  doc?: TravelDocument;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  error?: string;
}

export default function UploadPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [step, setStep] = useState<Step>('upload');

  const onDrop = useCallback((accepted: File[], rejected: FileRejection[]) => {
    if (rejected.length > 0) {
      rejected.forEach(({ errors }) => toast.error(errors[0]?.message || 'Invalid file'));
    }
    const newFiles: UploadedFile[] = accepted.map((file) => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      status: 'pending',
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...newFiles].slice(0, 5));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024,
    disabled: step !== 'upload',
  });

  const removeFile = (idx: number) => {
    setFiles((prev) => {
      const f = prev[idx];
      if (f.preview) URL.revokeObjectURL(f.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleUploadAndGenerate = async () => {
    if (files.length === 0) {
      toast.error('Please add at least one document');
      return;
    }

    setStep('processing');

    // Upload files one by one
    const docs: TravelDocument[] = [];
    const updatedFiles = [...files];

    for (let i = 0; i < files.length; i++) {
      updatedFiles[i] = { ...updatedFiles[i], status: 'uploading' };
      setFiles([...updatedFiles]);

      try {
        const res = await documentsApi.upload([files[i].file], (p) => {
          updatedFiles[i] = { ...updatedFiles[i], progress: p };
          setFiles([...updatedFiles]);
        });
        const uploaded = res.data.data.documents[0] as TravelDocument;
        docs.push(uploaded);
        updatedFiles[i] = { ...updatedFiles[i], status: 'done', doc: uploaded, progress: 100 };
        setFiles([...updatedFiles]);
      } catch (err) {
        updatedFiles[i] = {
          ...updatedFiles[i],
          status: 'error',
          error: err instanceof Error ? err.message : 'Upload failed',
        };
        setFiles([...updatedFiles]);
        toast.error(`Failed to upload ${files[i].file.name}`);
      }
    }

    const successDocs = docs;
    if (successDocs.length === 0) {
      setStep('upload');
      return;
    }

    setStep('generating');

    // Wait a moment for text extraction to begin
    await new Promise((r) => setTimeout(r, 2000));

    try {
      const res = await itinerariesApi.generate(successDocs.map((d) => d._id));
      const itinerary = res.data.data.itinerary;
      toast.success('Itinerary generated!');
      navigate(`/itinerary/${itinerary._id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate itinerary');
      setStep('upload');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (step === 'generating') {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full border-4 border-sand-200 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border-4 border-gold-400 border-t-transparent animate-spin absolute inset-0" />
            <Sparkles className="w-10 h-10 text-gold-400 animate-pulse" />
          </div>
        </div>
        <h2 className="font-display text-2xl font-bold text-navy-800 mb-3">Generating your itinerary</h2>
        <p className="text-navy-400 mb-2">Gemini AI is reading your documents and crafting a personalized travel plan…</p>
        <p className="text-navy-300 text-sm">This usually takes 20–40 seconds</p>
        <div className="mt-8 flex flex-col gap-2 w-full max-w-xs text-sm text-left">
          {['Extracting booking details', 'Identifying destinations', 'Crafting day-by-day plan', 'Adding tips & recommendations'].map((step, i) => (
            <div key={step} className="flex items-center gap-3 text-navy-500">
              <div className="w-5 h-5 rounded-full border-2 border-gold-400 border-t-transparent animate-spin flex-shrink-0" style={{ animationDelay: `${i * 0.3}s` }} />
              {step}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-navy-800 mb-2">New Itinerary</h1>
        <p className="text-navy-400">Upload your travel documents and let AI build your perfect trip plan.</p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-gold-400/10 border border-gold-400/20 rounded-xl p-4">
        <Info className="w-5 h-5 text-gold-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-navy-600">
          Upload <strong>flight tickets, hotel bookings, travel vouchers</strong> — PDFs or images. Trrip extracts all details automatically.
        </p>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-gold-400 bg-gold-400/5 scale-[1.01]'
            : step === 'upload'
            ? 'border-sand-200 hover:border-gold-300 hover:bg-sand-50 bg-white'
            : 'border-sand-200 bg-sand-50 cursor-not-allowed opacity-60'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3 pointer-events-none">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${isDragActive ? 'bg-gold-100' : 'bg-sand-100'}`}>
            <Upload className={`w-8 h-8 ${isDragActive ? 'text-gold-500' : 'text-navy-400'}`} />
          </div>
          {isDragActive ? (
            <p className="font-semibold text-gold-600">Drop files here</p>
          ) : (
            <>
              <div>
                <p className="font-semibold text-navy-700 mb-1">Drag & drop your documents here</p>
                <p className="text-sm text-navy-400">or <span className="text-gold-500 font-medium">browse to upload</span></p>
              </div>
              <p className="text-xs text-navy-300">PDF, JPG, PNG, WebP · Max 10MB · Up to 5 files</p>
            </>
          )}
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-navy-700 text-sm">{files.length} file{files.length > 1 ? 's' : ''} selected</h3>
          {files.map((f, i) => (
            <div key={i} className="card p-4 flex items-center gap-4">
              {/* Icon/Preview */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-sand-100">
                {f.preview ? (
                  <img src={f.preview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <FileText className="w-5 h-5 text-navy-400" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-navy-700 truncate">{f.file.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-navy-400">{formatSize(f.file.size)}</span>
                  {f.status === 'uploading' && (
                    <div className="flex-1 h-1.5 bg-sand-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gold-gradient rounded-full transition-all duration-300"
                        style={{ width: `${f.progress}%` }}
                      />
                    </div>
                  )}
                  {f.status === 'done' && (
                    <span className="flex items-center gap-1 text-xs text-teal-600 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
                    </span>
                  )}
                  {f.status === 'error' && (
                    <span className="flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle className="w-3.5 h-3.5" /> {f.error}
                    </span>
                  )}
                </div>
              </div>

              {/* Remove */}
              {step === 'upload' && (
                <button
                  onClick={() => removeFile(i)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {step === 'processing' && f.status === 'uploading' && (
                <Loader2 className="w-4 h-4 text-gold-400 animate-spin flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleUploadAndGenerate}
        disabled={files.length === 0 || step !== 'upload'}
        className="btn-primary w-full justify-center py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0"
      >
        {step === 'processing' ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Uploading documents…</>
        ) : (
          <><Sparkles className="w-5 h-5" /> Generate Itinerary with AI <ArrowRight className="w-5 h-5" /></>
        )}
      </button>

      {files.length === 0 && (
        <p className="text-center text-xs text-navy-300">Add at least one document to get started</p>
      )}
    </div>
  );
}

// import { useState, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useDropzone } from 'react-dropzone';
// import {
//   Upload, FileText, X, Sparkles, CheckCircle2,
//   AlertCircle, Loader2, ArrowRight, Info,
// } from 'lucide-react';
// import toast from 'react-hot-toast';
// import { documentsApi, itinerariesApi } from '../services/api';
// import { TravelDocument } from '../types';

// type Step = 'upload' | 'processing' | 'generating';

// interface UploadedFile {
//   file: File;
//   preview?: string;
//   doc?: TravelDocument;
//   status: 'pending' | 'uploading' | 'done' | 'error';
//   progress: number;
//   error?: string;
// }

// export default function UploadPage() {
//   const navigate = useNavigate();
//   const [files, setFiles] = useState<UploadedFile[]>([]);
//   const [step, setStep] = useState<Step>('upload');
//   const [setUploadedDocs] = useState<TravelDocument[]>([]);

//   const onDrop = useCallback((accepted: File[], rejected: { file: File; errors: { message: string }[] }[]) => {
//     if (rejected.length > 0) {
//       rejected.forEach(({ errors }) => toast.error(errors[0]?.message || 'Invalid file'));
//     }
//     const newFiles: UploadedFile[] = accepted.map((file) => ({
//       file,
//       preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
//       status: 'pending',
//       progress: 0,
//     }));
//     setFiles((prev) => [...prev, ...newFiles].slice(0, 5));
//   }, []);

//   const { getRootProps, getInputProps, isDragActive } = useDropzone({
//     onDrop,
//     accept: {
//       'application/pdf': ['.pdf'],
//       'image/jpeg': ['.jpg', '.jpeg'],
//       'image/png': ['.png'],
//       'image/webp': ['.webp'],
//     },
//     maxFiles: 5,
//     maxSize: 10 * 1024 * 1024,
//     disabled: step !== 'upload',
//   });

//   const removeFile = (idx: number) => {
//     setFiles((prev) => {
//       const f = prev[idx];
//       if (f.preview) URL.revokeObjectURL(f.preview);
//       return prev.filter((_, i) => i !== idx);
//     });
//   };

//   const handleUploadAndGenerate = async () => {
//     if (files.length === 0) {
//       toast.error('Please add at least one document');
//       return;
//     }

//     setStep('processing');

//     // Upload files one by one
//     const docs: TravelDocument[] = [];
//     const updatedFiles = [...files];

//     for (let i = 0; i < files.length; i++) {
//       updatedFiles[i] = { ...updatedFiles[i], status: 'uploading' };
//       setFiles([...updatedFiles]);

//       try {
//         const res = await documentsApi.upload([files[i].file], (p) => {
//           updatedFiles[i] = { ...updatedFiles[i], progress: p };
//           setFiles([...updatedFiles]);
//         });
//         const uploaded = res.data.data.documents[0] as TravelDocument;
//         docs.push(uploaded);
//         updatedFiles[i] = { ...updatedFiles[i], status: 'done', doc: uploaded, progress: 100 };
//         setFiles([...updatedFiles]);
//       } catch (err) {
//         updatedFiles[i] = {
//           ...updatedFiles[i],
//           status: 'error',
//           error: err instanceof Error ? err.message : 'Upload failed',
//         };
//         setFiles([...updatedFiles]);
//         toast.error(`Failed to upload ${files[i].file.name}`);
//       }
//     }

//     const successDocs = docs;
//     if (successDocs.length === 0) {
//       setStep('upload');
//       return;
//     }

//     setUploadedDocs(successDocs);
//     setStep('generating');

//     // Wait a moment for text extraction to begin
//     await new Promise((r) => setTimeout(r, 2000));

//     try {
//       const res = await itinerariesApi.generate(successDocs.map((d) => d._id));
//       const itinerary = res.data.data.itinerary;
//       toast.success('Itinerary generated!');
//       navigate(`/itinerary/${itinerary._id}`);
//     } catch (err) {
//       toast.error(err instanceof Error ? err.message : 'Failed to generate itinerary');
//       setStep('upload');
//     }
//   };

//   const formatSize = (bytes: number) => {
//     if (bytes < 1024) return `${bytes} B`;
//     if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
//     return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
//   };

//   if (step === 'generating') {
//     return (
//       <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
//         <div className="relative mb-8">
//           <div className="w-24 h-24 rounded-full border-4 border-sand-200 flex items-center justify-center">
//             <div className="w-24 h-24 rounded-full border-4 border-gold-400 border-t-transparent animate-spin absolute inset-0" />
//             <Sparkles className="w-10 h-10 text-gold-400 animate-pulse" />
//           </div>
//         </div>
//         <h2 className="font-display text-2xl font-bold text-navy-800 mb-3">Generating your itinerary</h2>
//         <p className="text-navy-400 mb-2">Gemini AI is reading your documents and crafting a personalized travel plan…</p>
//         <p className="text-navy-300 text-sm">This usually takes 20–40 seconds</p>
//         <div className="mt-8 flex flex-col gap-2 w-full max-w-xs text-sm text-left">
//           {['Extracting booking details', 'Identifying destinations', 'Crafting day-by-day plan', 'Adding tips & recommendations'].map((step, i) => (
//             <div key={step} className="flex items-center gap-3 text-navy-500">
//               <div className="w-5 h-5 rounded-full border-2 border-gold-400 border-t-transparent animate-spin flex-shrink-0" style={{ animationDelay: `${i * 0.3}s` }} />
//               {step}
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-2xl mx-auto space-y-6">
//       {/* Header */}
//       <div>
//         <h1 className="font-display text-3xl font-bold text-navy-800 mb-2">New Itinerary</h1>
//         <p className="text-navy-400">Upload your travel documents and let AI build your perfect trip plan.</p>
//       </div>

//       {/* Info banner */}
//       <div className="flex items-start gap-3 bg-gold-400/10 border border-gold-400/20 rounded-xl p-4">
//         <Info className="w-5 h-5 text-gold-500 flex-shrink-0 mt-0.5" />
//         <p className="text-sm text-navy-600">
//           Upload <strong>flight tickets, hotel bookings, travel vouchers</strong> — PDFs or images. Trrip extracts all details automatically.
//         </p>
//       </div>

//       {/* Drop zone */}
//       <div
//         {...getRootProps()}
//         className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
//           isDragActive
//             ? 'border-gold-400 bg-gold-400/5 scale-[1.01]'
//             : step === 'upload'
//             ? 'border-sand-200 hover:border-gold-300 hover:bg-sand-50 bg-white'
//             : 'border-sand-200 bg-sand-50 cursor-not-allowed opacity-60'
//         }`}
//       >
//         <input {...getInputProps()} />
//         <div className="flex flex-col items-center gap-3 pointer-events-none">
//           <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${isDragActive ? 'bg-gold-100' : 'bg-sand-100'}`}>
//             <Upload className={`w-8 h-8 ${isDragActive ? 'text-gold-500' : 'text-navy-400'}`} />
//           </div>
//           {isDragActive ? (
//             <p className="font-semibold text-gold-600">Drop files here</p>
//           ) : (
//             <>
//               <div>
//                 <p className="font-semibold text-navy-700 mb-1">Drag & drop your documents here</p>
//                 <p className="text-sm text-navy-400">or <span className="text-gold-500 font-medium">browse to upload</span></p>
//               </div>
//               <p className="text-xs text-navy-300">PDF, JPG, PNG, WebP · Max 10MB · Up to 5 files</p>
//             </>
//           )}
//         </div>
//       </div>

//       {/* File list */}
//       {files.length > 0 && (
//         <div className="space-y-3">
//           <h3 className="font-semibold text-navy-700 text-sm">{files.length} file{files.length > 1 ? 's' : ''} selected</h3>
//           {files.map((f, i) => (
//             <div key={i} className="card p-4 flex items-center gap-4">
//               {/* Icon/Preview */}
//               <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-sand-100">
//                 {f.preview ? (
//                   <img src={f.preview} alt="" className="w-full h-full object-cover" />
//                 ) : (
//                   <FileText className="w-5 h-5 text-navy-400" />
//                 )}
//               </div>

//               {/* Info */}
//               <div className="flex-1 min-w-0">
//                 <p className="text-sm font-medium text-navy-700 truncate">{f.file.name}</p>
//                 <div className="flex items-center gap-3 mt-1">
//                   <span className="text-xs text-navy-400">{formatSize(f.file.size)}</span>
//                   {f.status === 'uploading' && (
//                     <div className="flex-1 h-1.5 bg-sand-100 rounded-full overflow-hidden">
//                       <div
//                         className="h-full bg-gold-gradient rounded-full transition-all duration-300"
//                         style={{ width: `${f.progress}%` }}
//                       />
//                     </div>
//                   )}
//                   {f.status === 'done' && (
//                     <span className="flex items-center gap-1 text-xs text-teal-600 font-medium">
//                       <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
//                     </span>
//                   )}
//                   {f.status === 'error' && (
//                     <span className="flex items-center gap-1 text-xs text-red-500">
//                       <AlertCircle className="w-3.5 h-3.5" /> {f.error}
//                     </span>
//                   )}
//                 </div>
//               </div>

//               {/* Remove */}
//               {step === 'upload' && (
//                 <button
//                   onClick={() => removeFile(i)}
//                   className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0"
//                 >
//                   <X className="w-4 h-4" />
//                 </button>
//               )}
//               {step === 'processing' && f.status === 'uploading' && (
//                 <Loader2 className="w-4 h-4 text-gold-400 animate-spin flex-shrink-0" />
//               )}
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Generate button */}
//       <button
//         onClick={handleUploadAndGenerate}
//         disabled={files.length === 0 || step !== 'upload'}
//         className="btn-primary w-full justify-center py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0"
//       >
//         {step === 'processing' ? (
//           <><Loader2 className="w-5 h-5 animate-spin" /> Uploading documents…</>
//         ) : (
//           <><Sparkles className="w-5 h-5" /> Generate Itinerary with AI <ArrowRight className="w-5 h-5" /></>
//         )}
//       </button>

//       {files.length === 0 && (
//         <p className="text-center text-xs text-navy-300">Add at least one document to get started</p>
//       )}
//     </div>
//   );
// }
