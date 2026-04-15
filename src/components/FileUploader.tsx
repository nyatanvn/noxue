import React, { useCallback } from 'react';
import { Upload, FileText, Table, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { parseXlsx, parseDocx } from '../lib/parsers';
import { RawData } from '../types';

interface FileUploaderProps {
  onDataLoaded: (data: RawData) => void;
  onError: (msg: string) => void;
}

export default function FileUploader({ onDataLoaded, onError }: FileUploaderProps) {
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let data: RawData;
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        data = await parseXlsx(file);
      } else if (file.name.endsWith('.docx')) {
        data = await parseDocx(file);
      } else {
        throw new Error('Unsupported file format. Please upload .xlsx or .docx');
      }
      onDataLoaded(data);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to parse file');
    }
  }, [onDataLoaded, onError]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md mx-auto p-8 bg-card rounded-2xl shadow-bento border border-border"
    >
      <div className="mb-8">
        <h2 className="text-xs font-bold text-text-dim uppercase tracking-widest mb-2">New Source</h2>
        <p className="text-xl font-bold text-text-main">Upload Material</p>
      </div>

      <label className="relative group cursor-pointer block">
        <input 
          type="file" 
          className="hidden" 
          accept=".xlsx,.xls,.docx"
          onChange={handleFileChange}
        />
        <div className="border-2 border-dashed border-border rounded-xl p-10 transition-all group-hover:border-medical group-hover:bg-bg flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 bg-bg rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Upload className="w-6 h-6 text-text-dim" />
          </div>
          <div className="text-center">
            <span className="text-text-main font-bold block text-sm">Click to upload</span>
            <span className="text-text-dim text-[10px] mt-1 uppercase tracking-wider font-bold">Excel or Word</span>
            <span className="text-text-dim/50 text-[10px] mt-2 block italic">For Google Docs, download as .docx first</span>
          </div>
        </div>
      </label>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 p-3 bg-medical/5 rounded-lg border border-medical/10">
          <Table className="w-4 h-4 text-medical" />
          <span className="text-[10px] font-bold text-medical uppercase tracking-wider">XLSX</span>
        </div>
        <div className="flex items-center gap-2 p-3 bg-lang/5 rounded-lg border border-lang/10">
          <FileText className="w-4 h-4 text-lang" />
          <span className="text-[10px] font-bold text-lang uppercase tracking-wider">DOCX</span>
        </div>
      </div>

      <div className="mt-6 flex items-start gap-2 text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
        <AlertCircle className="w-3 h-3" />
        <span>Tip: Use tables in Word for best results</span>
      </div>
    </motion.div>
  );
}
