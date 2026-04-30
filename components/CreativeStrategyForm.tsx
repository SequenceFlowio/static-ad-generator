"use client";

import { useState } from "react";
import type { CreativeStrategy, CreativeAngle, ContentPillar, HookEntry, VisualStyle } from "@/types";

interface Props {
  brandId: string;
  initialStrategy: CreativeStrategy | null;
  onSaved: (strategy: CreativeStrategy) => void;
}

function SectionHeader({ label, description }: { label: string; description: string }) {
  return (
    <div className="mb-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</h3>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>
    </div>
  );
}

function TagInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  function add() {
    const trimmed = input.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInput("");
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map((v, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs text-gray-700 dark:text-gray-300"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((_, j) => j !== i))}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 leading-none"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder ?? "Type and press Enter"}
          className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C7F56F] focus:ring-offset-0"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function AngleEditor({ angles, onChange }: { angles: CreativeAngle[]; onChange: (v: CreativeAngle[]) => void }) {
  const emptyAngle = (): CreativeAngle => ({ key: "", label: "", description: "", hook_frame: "" });

  function update(i: number, field: keyof CreativeAngle, value: string) {
    const next = angles.map((a, j) => j === i ? { ...a, [field]: value } : a);
    onChange(next);
  }

  function autoKey(label: string) {
    return label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  return (
    <div className="space-y-4">
      {angles.map((angle, i) => (
        <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Angle {i + 1}</span>
            <button
              type="button"
              onClick={() => onChange(angles.filter((_, j) => j !== i))}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Remove
            </button>
          </div>
          <input
            type="text"
            value={angle.label}
            onChange={(e) => {
              const label = e.target.value;
              const next = angles.map((a, j) => j === i ? { ...a, label, key: autoKey(label) } : a);
              onChange(next);
            }}
            placeholder="Angle name (e.g. Hero Transformation)"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C7F56F]"
          />
          <input
            type="text"
            value={angle.description}
            onChange={(e) => update(i, "description", e.target.value)}
            placeholder="One sentence: what emotional arc does this angle use?"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C7F56F]"
          />
          <input
            type="text"
            value={angle.hook_frame}
            onChange={(e) => update(i, "hook_frame", e.target.value)}
            placeholder="Hook framing device (e.g. 'Why [audience] are quietly switching to…')"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C7F56F]"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...angles, emptyAngle()])}
        className="w-full rounded-xl border border-dashed border-gray-300 dark:border-gray-600 py-2 text-xs text-gray-500 dark:text-gray-400 hover:border-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        + Add Creative Angle
      </button>
    </div>
  );
}

function PillarEditor({ pillars, onChange }: { pillars: ContentPillar[]; onChange: (v: ContentPillar[]) => void }) {
  const emptyPillar = (): ContentPillar => ({ key: "", label: "", description: "", visual_note: "" });

  function autoKey(label: string) {
    return label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  function update(i: number, field: keyof ContentPillar, value: string) {
    const next = pillars.map((p, j) => j === i ? { ...p, [field]: value } : p);
    onChange(next);
  }

  return (
    <div className="space-y-4">
      {pillars.map((pillar, i) => (
        <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Pillar {i + 1}</span>
            <button
              type="button"
              onClick={() => onChange(pillars.filter((_, j) => j !== i))}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Remove
            </button>
          </div>
          <input
            type="text"
            value={pillar.label}
            onChange={(e) => {
              const label = e.target.value;
              const next = pillars.map((p, j) => j === i ? { ...p, label, key: autoKey(label) } : p);
              onChange(next);
            }}
            placeholder="Pillar name (e.g. Education, Social Proof)"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C7F56F]"
          />
          <input
            type="text"
            value={pillar.description}
            onChange={(e) => update(i, "description", e.target.value)}
            placeholder="Topic territory this pillar covers"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C7F56F]"
          />
          <input
            type="text"
            value={pillar.visual_note}
            onChange={(e) => update(i, "visual_note", e.target.value)}
            placeholder="Visual direction guidance for this pillar"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C7F56F]"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...pillars, emptyPillar()])}
        className="w-full rounded-xl border border-dashed border-gray-300 dark:border-gray-600 py-2 text-xs text-gray-500 dark:text-gray-400 hover:border-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        + Add Content Pillar
      </button>
    </div>
  );
}

function HookLibraryEditor({
  hooks,
  angles,
  pillars,
  onChange,
}: {
  hooks: HookEntry[];
  angles: CreativeAngle[];
  pillars: ContentPillar[];
  onChange: (v: HookEntry[]) => void;
}) {
  const emptyHook = (): HookEntry => ({ hook: "", angle_key: angles[0]?.key ?? "", pillar_key: pillars[0]?.key ?? "", performance_note: null });

  function update(i: number, field: keyof HookEntry, value: string | null) {
    const next = hooks.map((h, j) => j === i ? { ...h, [field]: value } : h);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {hooks.map((hook, i) => (
        <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Hook {i + 1}</span>
            <button
              type="button"
              onClick={() => onChange(hooks.filter((_, j) => j !== i))}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Remove
            </button>
          </div>
          <textarea
            value={hook.hook}
            onChange={(e) => update(i, "hook", e.target.value)}
            placeholder="The proven hook text"
            rows={2}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C7F56F] resize-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Angle</label>
              <select
                value={hook.angle_key}
                onChange={(e) => update(i, "angle_key", e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#C7F56F]"
              >
                <option value="">— none —</option>
                {angles.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Pillar</label>
              <select
                value={hook.pillar_key}
                onChange={(e) => update(i, "pillar_key", e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#C7F56F]"
              >
                <option value="">— none —</option>
                {pillars.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </div>
          </div>
          <input
            type="text"
            value={hook.performance_note ?? ""}
            onChange={(e) => update(i, "performance_note", e.target.value || null)}
            placeholder="Performance note (optional, e.g. '3.2x ROAS Q1')"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C7F56F]"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...hooks, emptyHook()])}
        className="w-full rounded-xl border border-dashed border-gray-300 dark:border-gray-600 py-2 text-xs text-gray-500 dark:text-gray-400 hover:border-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        + Add Hook
      </button>
    </div>
  );
}

function VisualStyleEditor({ styles, onChange }: { styles: VisualStyle[]; onChange: (v: VisualStyle[]) => void }) {
  const emptyStyle = (): VisualStyle => ({ key: "", label: "", description: "", reference_note: null });

  function autoKey(label: string) {
    return label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  function update(i: number, field: keyof VisualStyle, value: string | null) {
    const next = styles.map((s, j) => j === i ? { ...s, [field]: value } : s);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {styles.map((style, i) => (
        <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Style {i + 1}</span>
            <button
              type="button"
              onClick={() => onChange(styles.filter((_, j) => j !== i))}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Remove
            </button>
          </div>
          <input
            type="text"
            value={style.label}
            onChange={(e) => {
              const label = e.target.value;
              const next = styles.map((s, j) => j === i ? { ...s, label, key: autoKey(label) } : s);
              onChange(next);
            }}
            placeholder="Style name (e.g. Minimal Studio, Golden Hour)"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C7F56F]"
          />
          <input
            type="text"
            value={style.description}
            onChange={(e) => update(i, "description", e.target.value)}
            placeholder="Visual composition / mood notes"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C7F56F]"
          />
          <input
            type="text"
            value={style.reference_note ?? ""}
            onChange={(e) => update(i, "reference_note", e.target.value || null)}
            placeholder="Reference note (optional)"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C7F56F]"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...styles, emptyStyle()])}
        className="w-full rounded-xl border border-dashed border-gray-300 dark:border-gray-600 py-2 text-xs text-gray-500 dark:text-gray-400 hover:border-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        + Add Visual Style
      </button>
    </div>
  );
}

export default function CreativeStrategyForm({ brandId, initialStrategy, onSaved }: Props) {
  const [name, setName] = useState(initialStrategy?.name ?? "Default Strategy");
  const [angles, setAngles] = useState<CreativeAngle[]>(initialStrategy?.creative_angles ?? []);
  const [pillars, setPillars] = useState<ContentPillar[]>(initialStrategy?.content_pillars ?? []);
  const [hooks, setHooks] = useState<HookEntry[]>(initialStrategy?.hook_library ?? []);
  const [visualStyles, setVisualStyles] = useState<VisualStyle[]>(initialStrategy?.visual_styles ?? []);
  const [forbidden, setForbidden] = useState<string[]>(initialStrategy?.forbidden_elements ?? []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/brands/${brandId}/creative-strategy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          creative_angles: angles.filter(a => a.label.trim()),
          content_pillars: pillars.filter(p => p.label.trim()),
          hook_library: hooks.filter(h => h.hook.trim()),
          visual_styles: visualStyles.filter(s => s.label.trim()),
          forbidden_elements: forbidden,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      const json = await res.json();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved(json.strategy);
    } catch {
      // noop — surface to user later if needed
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Strategy name */}
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Strategy name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full max-w-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#C7F56F]"
        />
      </div>

      {/* Creative Angles */}
      <div>
        <SectionHeader
          label="Creative Angles"
          description="Emotional arcs and hook frames the AI will draw from when writing ad copy."
        />
        <AngleEditor angles={angles} onChange={setAngles} />
      </div>

      {/* Content Pillars */}
      <div>
        <SectionHeader
          label="Content Pillars"
          description="Topic territories and visual directions that define your content strategy."
        />
        <PillarEditor pillars={pillars} onChange={setPillars} />
      </div>

      {/* Hook Library */}
      <div>
        <SectionHeader
          label="Hook Library"
          description="Proven hooks from your best-performing ads. The AI creates variants — not copies."
        />
        <HookLibraryEditor hooks={hooks} angles={angles} pillars={pillars} onChange={setHooks} />
      </div>

      {/* Visual Styles */}
      <div>
        <SectionHeader
          label="Visual Styles"
          description="Named visual directions the AI can apply to background prompts."
        />
        <VisualStyleEditor styles={visualStyles} onChange={setVisualStyles} />
      </div>

      {/* Forbidden Elements */}
      <div>
        <SectionHeader
          label="Forbidden Elements"
          description="Words, props, or concepts that must never appear in generated prompts or copy."
        />
        <TagInput values={forbidden} onChange={setForbidden} placeholder="e.g. competitor names, off-brand props" />
      </div>

      {/* Save */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-[#C7F56F] px-6 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-50 transition-colors"
        >
          {saved ? "Saved!" : saving ? "Saving…" : "Save Strategy"}
        </button>
      </div>
    </div>
  );
}
