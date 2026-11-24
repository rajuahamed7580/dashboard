import React, { useRef, useState } from 'react';
import { Upload, X, Save } from 'lucide-react';
import { postService } from '../../../../services/postService';
import { useToast } from '../../../../context/ToastContext';
import type { PostImage } from '../../../../types';
import {
  DEFAULT_POST_FORM,
  formValuesToPayload,
  type PostFormValues
} from './postFormHelpers';

interface PostFormProps {
  initialValues?: PostFormValues;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

export default function PostForm({
  initialValues = DEFAULT_POST_FORM,
  submitLabel,
  submitting,
  onSubmit,
  onCancel
}: PostFormProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState<PostFormValues>(initialValues);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    try {
      const res = await postService.uploadImages(files);
      const uploadedImages = res.data || [];
      const newImagesList: PostImage[] = [
        ...form.images,
        ...uploadedImages.map((img, idx) => ({
          url: img.url,
          public_id: img.public_id,
          caption: '',
          isMain: form.images.length === 0 && idx === 0
        }))
      ];

      setForm((prev) => ({
        ...prev,
        images: newImagesList,
        mainImage: prev.mainImage || uploadedImages[0]?.url || ''
      }));

      showToast(`Uploaded ${uploadedImages.length} image(s) successfully.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Image upload failed.', 'error');
    } finally {
      setUploadingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formValuesToPayload(form));
  };

  const inputClass =
    'w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Images Section */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-blue-400" aria-hidden="true" />
          <h3 className="text-base font-bold text-white">Profile Images & Gallery</h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            className="text-slate-400 text-xs file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
          />
          {uploadingFiles && (
            <span className="text-xs text-blue-400 animate-pulse">Uploading images...</span>
          )}
        </div>

        <div>
          <label htmlFor="post-main-image" className="block text-xs font-semibold text-slate-300 mb-1.5">
            Main Image URL
          </label>
          <input
            id="post-main-image"
            type="url"
            value={form.mainImage}
            onChange={(e) => setForm({ ...form, mainImage: e.target.value })}
            placeholder="https://..."
            className={inputClass}
          />
        </div>

        {form.images.length > 0 && (
          <div className="flex flex-wrap gap-2.5 pt-1">
            {form.images.map((img, idx) => (
              <div
                key={`${img.url}-${idx}`}
                className="relative group w-16 h-16 rounded-lg overflow-hidden border border-slate-700 bg-slate-950"
              >
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() =>
                    setForm({
                      ...form,
                      images: form.images.filter((_, i) => i !== idx)
                    })
                  }
                  className="absolute inset-0 bg-rose-600/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Basic Info & Demographics */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white">Basic Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="post-title" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Title *
            </label>
            <input
              id="post-title"
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
              placeholder="Profile headline"
            />
          </div>

          <div>
            <label htmlFor="post-display-name" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Display Name *
            </label>
            <input
              id="post-display-name"
              type="text"
              required
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              className={inputClass}
              placeholder="handle_name"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="post-slug" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Custom Slug (optional)
            </label>
            <input
              id="post-slug"
              type="text"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className={inputClass}
              placeholder="auto-generated"
            />
          </div>

          <div>
            <label htmlFor="post-category" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Category
            </label>
            <input
              id="post-category"
              type="text"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="post-age" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Age
            </label>
            <input
              id="post-age"
              type="number"
              min={18}
              value={form.age}
              onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="post-gender" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Gender
            </label>
            <input
              id="post-gender"
              type="text"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="post-ethnicity" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Ethnicity
            </label>
            <input
              id="post-ethnicity"
              type="text"
              value={form.ethnicity}
              onChange={(e) => setForm({ ...form, ethnicity: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="post-height" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Height
            </label>
            <input
              id="post-height"
              type="text"
              value={form.height}
              onChange={(e) => setForm({ ...form, height: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="post-body-type" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Body Type
            </label>
            <input
              id="post-body-type"
              type="text"
              value={form.bodyType}
              onChange={(e) => setForm({ ...form, bodyType: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="post-service-type" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Service Types
            </label>
            <input
              id="post-service-type"
              type="text"
              value={form.serviceType}
              onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Location, Contact & Rates */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white">Location, Contact & Donations</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="post-city" className="block text-xs font-semibold text-slate-300 mb-1.5">
              City
            </label>
            <input
              id="post-city"
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="post-state" className="block text-xs font-semibold text-slate-300 mb-1.5">
              State
            </label>
            <input
              id="post-state"
              type="text"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="post-country" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Country
            </label>
            <input
              id="post-country"
              type="text"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="post-phone" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Phone
            </label>
            <input
              id="post-phone"
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="post-donations" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Donations
            </label>
            <input
              id="post-donations"
              type="text"
              value={form.donations}
              onChange={(e) => setForm({ ...form, donations: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="post-payments" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Payment Methods (comma-separated)
            </label>
            <input
              id="post-payments"
              type="text"
              value={form.paymentMethods}
              onChange={(e) => setForm({ ...form, paymentMethods: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Physical Attributes */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white">Physical Attributes</h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          <div>
            <label htmlFor="attr-eyes" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Eyes
            </label>
            <input
              id="attr-eyes"
              type="text"
              value={form.eyes}
              onChange={(e) => setForm({ ...form, eyes: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="attr-hair" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Hair
            </label>
            <input
              id="attr-hair"
              type="text"
              value={form.hair}
              onChange={(e) => setForm({ ...form, hair: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="attr-hair-len" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Hair Length
            </label>
            <input
              id="attr-hair-len"
              type="text"
              value={form.hairLength}
              onChange={(e) => setForm({ ...form, hairLength: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="attr-grooming" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Grooming
            </label>
            <input
              id="attr-grooming"
              type="text"
              value={form.grooming}
              onChange={(e) => setForm({ ...form, grooming: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="attr-chest" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Chest
            </label>
            <input
              id="attr-chest"
              type="text"
              value={form.chest}
              onChange={(e) => setForm({ ...form, chest: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 pt-1">
          {[
            { key: 'piercings' as const, label: 'Piercings' },
            { key: 'tattoos' as const, label: 'Tattoos' },
            { key: 'smoke' as const, label: 'Smoker' }
          ].map((item) => (
            <label key={item.key} className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form[item.key]}
                onChange={(e) => setForm({ ...form, [item.key]: e.target.checked })}
                className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
              />
              {item.label}
            </label>
          ))}
        </div>
      </section>

      {/* About, Schedule & Screening Sections */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <h3 className="text-base font-bold text-white">Profile Sections Configuration</h3>

        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">About Tab</div>
          <div>
            <label htmlFor="about-notice" className="block text-xs font-semibold text-slate-300 mb-1">
              Notice Banner
            </label>
            <input
              id="about-notice"
              type="text"
              value={form.aboutNotice}
              onChange={(e) => setForm({ ...form, aboutNotice: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="about-warnings" className="block text-xs font-semibold text-slate-300 mb-1">
              Warnings / Prohibited Limits
            </label>
            <input
              id="about-warnings"
              type="text"
              value={form.aboutWarnings}
              onChange={(e) => setForm({ ...form, aboutWarnings: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="about-nolist" className="block text-xs font-semibold text-slate-300 mb-1">
              No List (comma-separated)
            </label>
            <input
              id="about-nolist"
              type="text"
              value={form.noList}
              onChange={(e) => setForm({ ...form, noList: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Schedule Tab</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sched-hours" className="block text-xs font-semibold text-slate-300 mb-1">
                Working Hours
              </label>
              <input
                id="sched-hours"
                type="text"
                value={form.workingHours}
                onChange={(e) => setForm({ ...form, workingHours: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="sched-days" className="block text-xs font-semibold text-slate-300 mb-1">
                Working Days (comma-separated)
              </label>
              <input
                id="sched-days"
                type="text"
                value={form.workingDays}
                onChange={(e) => setForm({ ...form, workingDays: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Screening Tab</div>
          <div>
            <label htmlFor="screen-req" className="block text-xs font-semibold text-slate-300 mb-1">
              Screening Requirements
            </label>
            <input
              id="screen-req"
              type="text"
              value={form.screeningRequirements}
              onChange={(e) => setForm({ ...form, screeningRequirements: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="screen-deposit" className="block text-xs font-semibold text-slate-300 mb-1">
                Deposit Amount
              </label>
              <input
                id="screen-deposit"
                type="text"
                value={form.depositAmount}
                onChange={(e) => setForm({ ...form, depositAmount: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="screen-inst" className="block text-xs font-semibold text-slate-300 mb-1">
                Instructions
              </label>
              <input
                id="screen-inst"
                type="text"
                value={form.screeningInstructions}
                onChange={(e) => setForm({ ...form, screeningInstructions: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || uploadingFiles}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" aria-hidden="true" />
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
