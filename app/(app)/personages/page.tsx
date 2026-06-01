"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useBrand } from "@/lib/brand-context";
import { User, MapPin, Plus, X, Upload, Trash2 } from "lucide-react";

interface GalleryAvatar {
  id: string;
  brand_id: string;
  name: string;
  photo_url: string | null;
  gender: string | null;
  age_range: string | null;
  style: string | null;
  extra_description: string | null;
  prompt_hint: string;
  created_at: string;
}

interface GalleryEnvironment {
  id: string;
  brand_id: string;
  name: string;
  photo_url: string | null;
  env_type: string | null;
  lighting: string | null;
  extra_description: string | null;
  prompt_hint: string;
  created_at: string;
}

// ─── Avatar Form ──────────────────────────────────────────────────────────────

function AvatarForm({
  brandId,
  onCreated,
  onClose,
}: {
  brandId: string;
  onCreated: (avatar: GalleryAvatar) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [style, setStyle] = useState("");
  const [extraDescription, setExtraDescription] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    } else {
      setPhotoPreview(null);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0] ?? null;
    if (file && file.type.startsWith("image/")) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    const fd = new FormData();
    fd.append("name", name.trim());
    if (gender) fd.append("gender", gender);
    if (ageRange) fd.append("age_range", ageRange);
    if (style) fd.append("style", style);
    if (extraDescription) fd.append("extra_description", extraDescription);
    if (photoFile) fd.append("photo", photoFile);

    const res = await fetch(`/api/brands/${brandId}/gallery/avatars`, {
      method: "POST",
      body: fd,
    });
    if (res.ok) {
      const { avatar } = await res.json();
      onCreated(avatar);
      onClose();
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Nieuw personage</h2>
        <button type="button" onClick={onClose} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-200">
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Naam */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Naam <span className="text-red-400">*</span>
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C7F56F]/50"
            placeholder="bijv. Sarah"
          />
        </div>

        {/* Foto */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Foto</label>
          {photoPreview ? (
            <div className="relative rounded-xl overflow-hidden aspect-square max-w-[160px]">
              <Image src={photoPreview} alt="preview" fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-6 text-center hover:border-[#C7F56F] transition-colors"
            >
              <Upload size={20} className="text-gray-400" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Klik of sleep een foto hier</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        {/* Geslacht */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">Geslacht</label>
          <div className="flex gap-2">
            {["Vrouw", "Man", "Non-binair"].map(g => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(gender === g ? "" : g)}
                className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-colors ${
                  gender === g
                    ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white"
                    : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Leeftijdscategorie */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Leeftijdscategorie</label>
          <select
            value={ageRange}
            onChange={e => setAgeRange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C7F56F]/50"
          >
            <option value="">Selecteer leeftijd</option>
            <option value="Tieners">Tieners</option>
            <option value="20s">20s</option>
            <option value="30s">30s</option>
            <option value="40s">40s</option>
            <option value="50+">50+</option>
          </select>
        </div>

        {/* Stijl */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Stijl</label>
          <select
            value={style}
            onChange={e => setStyle(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C7F56F]/50"
          >
            <option value="">Selecteer stijl</option>
            <option value="Casual">Casual</option>
            <option value="Professioneel">Professioneel</option>
            <option value="Sportief">Sportief</option>
            <option value="Trendy">Trendy</option>
            <option value="Klassiek">Klassiek</option>
          </select>
        </div>

        {/* Extra beschrijving */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Extra beschrijving</label>
          <textarea
            value={extraDescription}
            onChange={e => setExtraDescription(e.target.value)}
            rows={3}
            placeholder="bijv: kort donker haar, mediterraan uiterlijk"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C7F56F]/50 resize-none"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800 px-5 py-4">
        <button
          type="submit"
          disabled={!name.trim() || submitting}
          className="w-full rounded-xl bg-[#C7F56F] py-2.5 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-40 transition-colors"
        >
          {submitting ? "Opslaan..." : "Personage opslaan"}
        </button>
      </div>
    </form>
  );
}

// ─── Environment Form ─────────────────────────────────────────────────────────

function EnvironmentForm({
  brandId,
  onCreated,
  onClose,
}: {
  brandId: string;
  onCreated: (env: GalleryEnvironment) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [envType, setEnvType] = useState("");
  const [lighting, setLighting] = useState("");
  const [extraDescription, setExtraDescription] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setPhotoPreview(null);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0] ?? null;
    if (file && file.type.startsWith("image/")) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    const fd = new FormData();
    fd.append("name", name.trim());
    if (envType) fd.append("env_type", envType);
    if (lighting) fd.append("lighting", lighting);
    if (extraDescription) fd.append("extra_description", extraDescription);
    if (photoFile) fd.append("photo", photoFile);

    const res = await fetch(`/api/brands/${brandId}/gallery/environments`, {
      method: "POST",
      body: fd,
    });
    if (res.ok) {
      const { environment } = await res.json();
      onCreated(environment);
      onClose();
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Nieuwe omgeving</h2>
        <button type="button" onClick={onClose} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-200">
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Naam */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Naam <span className="text-red-400">*</span>
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C7F56F]/50"
            placeholder="bijv. Moderne keuken"
          />
        </div>

        {/* Foto */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Foto</label>
          {photoPreview ? (
            <div className="relative rounded-xl overflow-hidden aspect-video max-w-full">
              <Image src={photoPreview} alt="preview" fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-6 text-center hover:border-[#C7F56F] transition-colors"
            >
              <Upload size={20} className="text-gray-400" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Klik of sleep een foto hier</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        {/* Type */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">Type</label>
          <div className="flex gap-2">
            {["Binnen", "Buiten", "Abstract"].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setEnvType(envType === t ? "" : t)}
                className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-colors ${
                  envType === t
                    ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white"
                    : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Belichting */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Belichting</label>
          <select
            value={lighting}
            onChange={e => setLighting(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C7F56F]/50"
          >
            <option value="">Selecteer belichting</option>
            <option value="Naturlijk">Naturlijk</option>
            <option value="Studio">Studio</option>
            <option value="Gouden uur">Gouden uur</option>
            <option value="Neon">Neon</option>
            <option value="Donker">Donker</option>
          </select>
        </div>

        {/* Extra beschrijving */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Extra beschrijving</label>
          <textarea
            value={extraDescription}
            onChange={e => setExtraDescription(e.target.value)}
            rows={3}
            placeholder="bijv: warme tinten, grote ramen, planten"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C7F56F]/50 resize-none"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800 px-5 py-4">
        <button
          type="submit"
          disabled={!name.trim() || submitting}
          className="w-full rounded-xl bg-[#C7F56F] py-2.5 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-40 transition-colors"
        >
          {submitting ? "Opslaan..." : "Omgeving opslaan"}
        </button>
      </div>
    </form>
  );
}

// ─── Avatar Card ──────────────────────────────────────────────────────────────

function AvatarCard({
  avatar,
  onDelete,
}: {
  avatar: GalleryAvatar;
  onDelete: (id: string) => void;
}) {
  const attrs = [avatar.gender, avatar.age_range, avatar.style].filter(Boolean).join(" · ");

  async function handleDelete() {
    if (!window.confirm("Weet je het zeker?")) return;
    onDelete(avatar.id);
  }

  return (
    <div className="group relative rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden hover:border-[#C7F56F] hover:shadow-sm transition-all">
      {/* Thumbnail */}
      <div className="aspect-square w-full overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
        {avatar.photo_url ? (
          <Image src={avatar.photo_url} alt={avatar.name} fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-100 to-pink-200 dark:from-rose-900/30 dark:to-pink-900/30">
            <User size={32} className="text-rose-400 dark:text-rose-500" />
          </div>
        )}
        {/* Delete button */}
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 dark:bg-gray-900/90 text-gray-500 dark:text-gray-400 shadow opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-all"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{avatar.name}</p>
        {attrs && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 truncate">{attrs}</p>}
        {avatar.extra_description && (
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 line-clamp-1">{avatar.extra_description}</p>
        )}
      </div>
    </div>
  );
}

// ─── Environment Card ─────────────────────────────────────────────────────────

function EnvironmentCard({
  env,
  onDelete,
}: {
  env: GalleryEnvironment;
  onDelete: (id: string) => void;
}) {
  const attrs = [env.env_type, env.lighting ? `${env.lighting} licht` : null].filter(Boolean).join(" · ");

  async function handleDelete() {
    if (!window.confirm("Weet je het zeker?")) return;
    onDelete(env.id);
  }

  return (
    <div className="group relative rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden hover:border-[#C7F56F] hover:shadow-sm transition-all">
      {/* Thumbnail */}
      <div className="aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
        {env.photo_url ? (
          <Image src={env.photo_url} alt={env.name} fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-200 dark:from-emerald-900/30 dark:to-teal-900/30">
            <MapPin size={32} className="text-emerald-400 dark:text-emerald-500" />
          </div>
        )}
        {/* Delete button */}
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 dark:bg-gray-900/90 text-gray-500 dark:text-gray-400 shadow opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-all"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{env.name}</p>
        {attrs && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 truncate">{attrs}</p>}
        {env.extra_description && (
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 line-clamp-1">{env.extra_description}</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type ActiveTab = "avatars" | "environments";

export default function GalleryPage() {
  const { brand } = useBrand();
  const [activeTab, setActiveTab] = useState<ActiveTab>("avatars");
  const [avatars, setAvatars] = useState<GalleryAvatar[]>([]);
  const [environments, setEnvironments] = useState<GalleryEnvironment[]>([]);
  const [loadingAvatars, setLoadingAvatars] = useState(true);
  const [loadingEnvs, setLoadingEnvs] = useState(true);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    if (!brand?.id) return;
    setLoadingAvatars(true);
    fetch(`/api/brands/${brand.id}/gallery/avatars`)
      .then(r => r.json())
      .then(d => { setAvatars(d.avatars ?? []); setLoadingAvatars(false); })
      .catch(() => setLoadingAvatars(false));
  }, [brand?.id]);

  useEffect(() => {
    if (!brand?.id) return;
    setLoadingEnvs(true);
    fetch(`/api/brands/${brand.id}/gallery/environments`)
      .then(r => r.json())
      .then(d => { setEnvironments(d.environments ?? []); setLoadingEnvs(false); })
      .catch(() => setLoadingEnvs(false));
  }, [brand?.id]);

  async function handleDeleteAvatar(id: string) {
    if (!brand?.id) return;
    const res = await fetch(`/api/brands/${brand.id}/gallery/avatars/${id}`, { method: "DELETE" });
    if (res.ok) setAvatars(prev => prev.filter(a => a.id !== id));
  }

  async function handleDeleteEnv(id: string) {
    if (!brand?.id) return;
    const res = await fetch(`/api/brands/${brand.id}/gallery/environments/${id}`, { method: "DELETE" });
    if (res.ok) setEnvironments(prev => prev.filter(e => e.id !== id));
  }

  if (!brand) {
    return (
      <main className="px-6 py-8">
        <p className="text-sm text-gray-400 dark:text-gray-500">Selecteer eerst een brand.</p>
      </main>
    );
  }

  const isAvatars = activeTab === "avatars";

  return (
    <>
      <main className="px-6 py-8 max-w-5xl">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Gallerij</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Beheer je personages en omgevingen</p>
        </div>

        {/* Tabs + action */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 gap-1">
            <button
              onClick={() => setActiveTab("avatars")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                isAvatars
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <User size={15} />
              Personages
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isAvatars ? "bg-[#C7F56F]/20 text-gray-700 dark:text-gray-200" : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
                {avatars.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("environments")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                !isAvatars
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <MapPin size={15} />
              Omgevingen
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${!isAvatars ? "bg-[#C7F56F]/20 text-gray-700 dark:text-gray-200" : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
                {environments.length}
              </span>
            </button>
          </div>

          <button
            onClick={() => setShowPanel(true)}
            className="flex items-center gap-2 rounded-xl bg-[#C7F56F] px-4 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] transition-colors"
          >
            <Plus size={15} />
            Nieuw toevoegen
          </button>
        </div>

        {/* Grid */}
        {isAvatars ? (
          loadingAvatars ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 aspect-square" />
              ))}
            </div>
          ) : avatars.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-16 text-center">
              <User size={36} className="mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nog geen personages toegevoegd</p>
              <button
                onClick={() => setShowPanel(true)}
                className="mt-4 flex items-center gap-2 rounded-xl bg-[#C7F56F] px-4 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] transition-colors"
              >
                <Plus size={14} />
                Eerste personage toevoegen
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {avatars.map(a => (
                <AvatarCard key={a.id} avatar={a} onDelete={handleDeleteAvatar} />
              ))}
            </div>
          )
        ) : (
          loadingEnvs ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 aspect-video" />
              ))}
            </div>
          ) : environments.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-16 text-center">
              <MapPin size={36} className="mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nog geen omgevingen toegevoegd</p>
              <button
                onClick={() => setShowPanel(true)}
                className="mt-4 flex items-center gap-2 rounded-xl bg-[#C7F56F] px-4 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] transition-colors"
              >
                <Plus size={14} />
                Eerste omgeving toevoegen
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {environments.map(e => (
                <EnvironmentCard key={e.id} env={e} onDelete={handleDeleteEnv} />
              ))}
            </div>
          )
        )}
      </main>

      {/* Right slide-over panel backdrop */}
      {showPanel && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setShowPanel(false)}
        />
      )}

      {/* Right slide-over panel */}
      <div
        className={`fixed right-0 top-0 z-50 h-screen w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${
          showPanel ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {showPanel && brand?.id && (
          isAvatars ? (
            <AvatarForm
              brandId={brand.id}
              onCreated={a => setAvatars(prev => [a, ...prev])}
              onClose={() => setShowPanel(false)}
            />
          ) : (
            <EnvironmentForm
              brandId={brand.id}
              onCreated={e => setEnvironments(prev => [e, ...prev])}
              onClose={() => setShowPanel(false)}
            />
          )
        )}
      </div>
    </>
  );
}
