import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, ShieldCheck, AlertTriangle, Loader2, FileWarning, RefreshCcw, Activity, Type, Camera } from 'lucide-react';

function App() {
  const [mode, setMode] = useState('image');         // 'image' | 'text'
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setTextInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError(null);
    if (!selectedFile) return;
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File is too large. Please select an image under 2MB.');
      setFile(null);
      setPreview(null);
      return;
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setResult(null);
  };

  const handleUpload = async () => {
    setLoading(true);
    setError(null);

    try {
      let response;

      if (mode === 'image') {
        // Image OCR mode
        const formData = new FormData();
        formData.append('image', file);
        response = await axios.post('https://rumbling-diabetic-exchange.ngrok-free.dev/predict', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        // Manual text mode
        response = await axios.post(
          'https://rumbling-diabetic-exchange.ngrok-free.dev/predict-text',
          { ingredients: textInput },
          { headers: { 'Content-Type': 'application/json' } }
        );
      }

      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Server connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const canAnalyse =
    !loading && (mode === 'image' ? !!file : textInput.trim().length > 3);

  const getSeverityStyles = (category) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('very high') || cat.includes('high') || cat.includes('toxic'))
      return 'bg-red-50 border-red-200 text-red-700';
    if (cat.includes('moderate'))
      return 'bg-orange-50 border-orange-200 text-orange-700';
    return 'bg-green-50 border-green-200 text-green-700';
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-6 flex flex-col items-center">
      <header className="text-center my-10">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">ToxiScan AI</h1>
        <p className="text-slate-500 mt-2">Hybrid Multi-Output Safety Analysis</p>
      </header>

      <main className="w-full max-w-lg bg-white shadow-xl rounded-3xl p-8 border border-slate-100">

        {/* ── Mode toggle ─────────────────────────────────────────── */}
        {!result && (
          <div className="flex rounded-2xl border border-slate-200 overflow-hidden mb-6">
            <button
              onClick={() => { setMode('image'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-all ${
                mode === 'image'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Camera size={15} />
              Scan Label
            </button>
            <button
              onClick={() => { setMode('text'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-all ${
                mode === 'text'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Type size={15} />
              Enter Manually
            </button>
          </div>
        )}

        {/* ── Image mode ──────────────────────────────────────────── */}
        {mode === 'image' && !result && (
          <div className="relative group border-2 border-dashed border-slate-200 rounded-2xl p-8 transition-all hover:border-blue-400 text-center">
            <input
              type="file"
              ref={fileInputRef}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              accept="image/*"
            />
            {preview ? (
              <div className="relative inline-block">
                <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-md" />
                {!loading && (
                  <button
                    onClick={handleReset}
                    className="absolute -top-2 -right-2 bg-white text-slate-600 p-1.5 rounded-full shadow-lg border border-slate-100 hover:text-red-500 transition-colors"
                  >
                    <RefreshCcw size={16} />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center py-4">
                <Upload className="w-12 h-12 text-slate-300 mb-4 group-hover:text-blue-400" />
                <p className="text-slate-500 font-medium">Click or drag image here</p>
                <p className="text-xs text-slate-400 mt-1">Max size: 2MB (JPG, PNG)</p>
                <p className="text-xs text-slate-400 mt-1">
                  Tip: use a flat, well-lit photo of the ingredient label
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Text mode ───────────────────────────────────────────── */}
        {mode === 'text' && !result && (
          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold text-slate-600">
              Paste or type the ingredients list
            </label>
            <textarea
              className="w-full h-44 p-4 rounded-2xl border-2 border-slate-200 text-sm text-slate-700 leading-relaxed resize-none focus:outline-none focus:border-blue-400 transition-colors placeholder:text-slate-300"
              placeholder={
                'Water, Glycerin, Dimethicone, Cetyl Alcohol,\nMethylparaben, Propylparaben, Carbomer,\nSodium Hydroxide, Tetrasodium EDTA...'
              }
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            />
            <p className="text-xs text-slate-400">
              Copy the ingredient list exactly as it appears on the product label.
              Separate ingredients with commas.
            </p>
          </div>
        )}

        {/* ── Error ───────────────────────────────────────────────── */}
        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
            <FileWarning size={18} />
            {error}
          </div>
        )}

        {/* ── Analyse button ──────────────────────────────────────── */}
        {!result && (
          <button
            onClick={handleUpload}
            disabled={!canAnalyse}
            className={`w-full mt-6 py-4 rounded-2xl font-bold text-white transition-all flex justify-center items-center gap-2 ${
              !canAnalyse
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100'
            }`}
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Analyze Product'}
          </button>
        )}

        {/* ── Results ─────────────────────────────────────────────── */}
        {result && (
          <div
            className={`mt-2 p-6 rounded-2xl border-2 ${getSeverityStyles(result.category)}`}
          >
            {/* Score + category */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {result.score > 6 ? (
                    <AlertTriangle size={20} className="text-red-600" />
                  ) : result.score > 3 ? (
                    <AlertTriangle size={20} className="text-orange-500" />
                  ) : (
                    <ShieldCheck size={20} className="text-green-600" />
                  )}
                  <h2 className="text-3xl font-black text-slate-800">{result.score}/10</h2>
                </div>
                <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                  Toxicity Score
                </p>
              </div>

              <div className="text-right">
                <div
                  className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-tighter border-2 ${getSeverityStyles(result.category)}`}
                >
                  {result.category}
                </div>
                <p className="text-[10px] font-bold uppercase text-slate-400 mt-1">
                  Classification
                </p>
              </div>
            </div>

            {/* Summary */}
            <p className="text-slate-700 mb-6 text-sm leading-relaxed">{result.summary}</p>

            {/* Detected toxins */}
            {result.detected_toxins?.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2">
                  Concerns Detected:
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.detected_toxins.map((toxin, idx) => (
                    <span
                      key={idx}
                      className="bg-white/80 border border-slate-200 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold capitalize shadow-sm"
                    >
                      {toxin}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Unmatched ingredients */}
            {result.ingredients_unknown?.length > 0 && (
              <div className="mb-4 p-3 bg-white/60 rounded-xl border border-slate-200">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">
                  Not in ICE Database ({result.ingredients_unknown.length}):
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {result.ingredients_unknown.join(', ')}
                </p>
              </div>
            )}

            {/* ML Feature Mapping */}
            <div className="flex flex-col gap-4 pt-4 border-t border-slate-200/50">
              <details className="cursor-pointer group">
                <summary className="text-xs text-blue-600 font-bold flex items-center gap-1 group-hover:underline">
                  <Activity size={12} />
                  View ML Feature Mapping
                </summary>
                <div className="mt-2 bg-white/50 p-3 rounded-lg border border-slate-100">
                  {result.ingredients_found?.length > 0 ? (
                    result.ingredients_found.map((line, idx) => (
                      <p
                        key={idx}
                        className="text-[11px] text-slate-500 leading-relaxed py-1 border-b border-slate-100 last:border-0"
                      >
                        {line}
                      </p>
                    ))
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      No ingredients could be matched to the ICE dataset.
                    </p>
                  )}
                </div>
              </details>

              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-2 w-full py-3 bg-white text-slate-600 rounded-xl text-sm font-bold border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
              >
                <RefreshCcw size={14} />
                Scan Another Product
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-10 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
        Powered by Ridge Regression &amp; Random Forest Classifier
      </footer>
    </div>
  );
}

export default App;
