"use client"

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { HailEvent, ScoredContractorLead } from "@/src/hail-leads/types"
import { getTheme, type ThemeMode } from "@/components/roof-recon/theme"
import { GridBG } from "@/components/roof-recon/GridBG"
import { ThemeToggle } from "@/components/roof-recon/ThemeToggle"
import type { UsRegionCode } from "@/src/hail-leads/server/regions"
import { US_REGION_STATE_CODES } from "@/src/hail-leads/server/regions"
import { HAIL_LEADS_TOP_CONTRACTORS } from "@/src/hail-leads/constants"

type EventsResponse = { events: HailEvent[]; error?: string }
type LeadsResponse = { leads: ScoredContractorLead[]; error?: string; notice?: string }

const ACCENT = "#FF6B2B"

const REGION_LABELS: Record<UsRegionCode, string> = {
  NE: "Northeast (NE)",
  SE: "Southeast (SE)",
  SW: "Southwest (SW)",
  NW: "Northwest (NW)",
  Central: "Central",
}

function prettyDate(value: string | undefined): string {
  if (!value) return "n/a"
  return new Date(value).toLocaleString()
}

function formatHailInches(value: number | undefined): string {
  if (value === undefined) return "—"
  return `${value.toFixed(2)}"`
}

function formatWindMph(value: number | undefined): string {
  if (value === undefined) return "—"
  return `${Math.round(value)} mph`
}

type GeographyMode = "state" | "region"

export function HailLeadsApp() {
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark")
  const [geographyMode, setGeographyMode] = useState<GeographyMode>("state")
  const [stateCode, setStateCode] = useState("TX")
  const [region, setRegion] = useState<UsRegionCode>("SE")
  const [city, setCity] = useState("")
  const [daysBack, setDaysBack] = useState(5)
  const [events, setEvents] = useState<HailEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<HailEvent | null>(null)
  const [leads, setLeads] = useState<ScoredContractorLead[]>([])
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)
  const [isLoadingLeads, setIsLoadingLeads] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [leadsNotice, setLeadsNotice] = useState<string | null>(null)
  const contractorsSectionRef = useRef<HTMLElement | null>(null)

  const t = useMemo(() => getTheme(themeMode, ACCENT), [themeMode])

  function scrollToContractors() {
    requestAnimationFrame(() => {
      contractorsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rr-theme") as ThemeMode | null
      if (saved === "light" || saved === "dark") setThemeMode(saved)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("rr-theme", themeMode)
    } catch {
      /* ignore */
    }
  }, [themeMode])

  const selectedLeads = useMemo(
    () => leads.filter((lead) => selectedLeadIds.includes(lead.id)),
    [leads, selectedLeadIds]
  )

  async function searchEvents() {
    setError(null)
    setIsLoadingEvents(true)
    setSelectedEvent(null)
    setLeads([])
    setSelectedLeadIds([])
    setLeadsNotice(null)
    try {
      const params = new URLSearchParams({ daysBack: String(daysBack) })
      if (city.trim()) params.set("city", city.trim())
      if (geographyMode === "region") {
        params.set("region", region)
      } else {
        params.set("state", stateCode.trim().toUpperCase())
      }
      const res = await fetch(`/api/hail-leads/events?${params}`)
      const json = (await res.json()) as EventsResponse
      if (!res.ok) throw new Error(json.error ?? "Failed to fetch hail events")
      setEvents(json.events)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch hail events")
      setEvents([])
    } finally {
      setIsLoadingEvents(false)
    }
  }

  async function loadLeads(event: HailEvent) {
    setError(null)
    setLeadsNotice(null)
    setIsLoadingLeads(true)
    setSelectedEvent(event)
    setSelectedLeadIds([])
    scrollToContractors()
    try {
      const res = await fetch("/api/hail-leads/contractors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event }),
      })
      const json = (await res.json()) as LeadsResponse
      if (!res.ok) throw new Error(json.error ?? "Failed to fetch contractor leads")
      setLeads(json.leads)
      setLeadsNotice(json.notice ?? null)
      scrollToContractors()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch contractor leads")
      setLeads([])
      setLeadsNotice(null)
      scrollToContractors()
    } finally {
      setIsLoadingLeads(false)
    }
  }

  function toggleLead(leadId: string) {
    setSelectedLeadIds((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]
    )
  }

  async function exportCsv() {
    if (selectedLeads.length === 0) return
    const response = await fetch("/api/hail-leads/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leads: selectedLeads }),
    })
    const csv = await response.text()
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const href = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = href
    a.download = `hail-leads-${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(href)
  }

  async function exportPdf() {
    if (!selectedEvent || leads.length === 0) return
    setError(null)
    setIsExportingPdf(true)
    try {
      const response = await fetch("/api/hail-leads/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: selectedEvent, leads }),
      })
      if (!response.ok) {
        const json = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(json.error ?? "PDF export failed")
      }
      const blob = await response.blob()
      const href = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = href
      a.download = `hail-leads-${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(href)
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF export failed")
    } finally {
      setIsExportingPdf(false)
    }
  }

  const panelStyle: CSSProperties = {
    background: t.mode === "dark" ? "rgba(17,38,74,0.55)" : t.panel,
    border: `1px solid ${t.border}`,
    backdropFilter: "blur(6px)",
  }

  return (
    <main className="relative min-h-screen flex flex-col" style={{ background: t.bg, color: t.text }}>
      <GridBG t={t} />

      <div
        className="relative z-10 flex items-center justify-between px-6 py-5 border-b md:px-8"
        style={{ borderColor: t.border }}
      >
        <div className="flex items-center gap-3">
          <div className="grid h-7 w-7 place-items-center" style={{ background: t.accent }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={t.accentInk} strokeWidth="2.5">
              <path d="M12 3v18M8 8l4-4 4 4M8 16l4 4 4-4" />
            </svg>
          </div>
          <div className="leading-none">
            <div className="text-[11px] font-semibold tracking-[0.2em]" style={{ color: t.text }}>
              JOBNIMBUS
            </div>
            <div className="mt-1 font-mono text-[10px] tracking-[0.3em]" style={{ color: t.accent }}>
              HAIL&nbsp;LEADS
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden font-mono text-[11px] tracking-wider md:block" style={{ color: t.textSoft }}>
            STORM&nbsp;OUTREACH
          </div>
          <ThemeToggle mode={themeMode} onChange={setThemeMode} t={t} />
        </div>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8 md:px-8">
        <div className="flex items-center gap-3 text-[11px] font-mono tracking-[0.28em]" style={{ color: t.textSoft }}>
          <span className="h-px w-8" style={{ background: t.border }} />
          <span>STEP&nbsp;01&nbsp;//&nbsp;HIGH‑IMPACT&nbsp;WEATHER</span>
          <span className="h-px w-8" style={{ background: t.border }} />
        </div>

        <header className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: t.text }}>
            Hail &amp; wind lead zones
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed" style={{ color: t.textMuted }}>
            Surfaces{" "}
            <span className="font-semibold" style={{ color: t.accent }}>
              hail ≥ 1.00″
            </span>{" "}
            and{" "}
            <span className="font-semibold" style={{ color: t.blue }}>
              wind &gt; 60 mph
            </span>{" "}
            from NWS alerts so your team can prioritize outreach in those markets.
          </p>
        </header>

        <section className="rounded-lg p-4" style={panelStyle}>
          <div className="mb-3 flex flex-wrap gap-4 text-[11px] font-mono tracking-wider" style={{ color: t.textSoft }}>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="geo"
                checked={geographyMode === "state"}
                onChange={() => setGeographyMode("state")}
              />
              Single state
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="geo"
                checked={geographyMode === "region"}
                onChange={() => setGeographyMode("region")}
              />
              US region
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            {geographyMode === "state" ? (
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-mono text-[10px] tracking-wider" style={{ color: t.textSoft }}>
                  STATE (2‑LETTER)
                </span>
                <input
                  value={stateCode}
                  onChange={(event) => setStateCode(event.target.value)}
                  className="px-3 py-2 font-medium outline-none"
                  style={{
                    border: `1px solid ${t.border}`,
                    background: t.mode === "dark" ? "rgba(13,31,60,0.65)" : "rgba(255,255,255,0.9)",
                    color: t.text,
                  }}
                  maxLength={2}
                />
              </label>
            ) : (
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-mono text-[10px] tracking-wider" style={{ color: t.textSoft }}>
                  REGION
                </span>
                <select
                  value={region}
                  onChange={(event) => setRegion(event.target.value as UsRegionCode)}
                  className="px-3 py-2 font-medium outline-none"
                  style={{
                    border: `1px solid ${t.border}`,
                    background: t.mode === "dark" ? "rgba(13,31,60,0.65)" : "rgba(255,255,255,0.9)",
                    color: t.text,
                  }}
                >
                  {(Object.keys(US_REGION_STATE_CODES) as UsRegionCode[]).map((code) => (
                    <option key={code} value={code}>
                      {REGION_LABELS[code]} ({US_REGION_STATE_CODES[code].length} states)
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-mono text-[10px] tracking-wider" style={{ color: t.textSoft }}>
                CITY (OPTIONAL FILTER)
              </span>
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className="px-3 py-2 font-medium outline-none"
                style={{
                  border: `1px solid ${t.border}`,
                  background: t.mode === "dark" ? "rgba(13,31,60,0.65)" : "rgba(255,255,255,0.9)",
                  color: t.text,
                }}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-mono text-[10px] tracking-wider" style={{ color: t.textSoft }}>
                DAYS BACK (1–14)
              </span>
              <input
                type="number"
                min={1}
                max={14}
                value={daysBack}
                onChange={(event) => setDaysBack(Number(event.target.value))}
                className="px-3 py-2 font-medium outline-none"
                style={{
                  border: `1px solid ${t.border}`,
                  background: t.mode === "dark" ? "rgba(13,31,60,0.65)" : "rgba(255,255,255,0.9)",
                  color: t.text,
                }}
              />
            </label>

            <div className="flex items-end">
              <button
                type="button"
                onClick={searchEvents}
                disabled={isLoadingEvents}
                className="h-10 w-full px-4 text-sm font-semibold tracking-tight transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: t.accent, color: t.accentInk }}
              >
                {isLoadingEvents ? "Scanning…" : "Find storm zones"}
              </button>
            </div>
          </div>
        </section>

        {error ? (
          <section
            className="rounded-lg border p-3 text-sm"
            style={{
              borderColor: "rgba(220,80,80,0.45)",
              background: t.mode === "dark" ? "rgba(80,20,20,0.35)" : "rgba(255,230,230,0.9)",
              color: t.mode === "dark" ? "#fecaca" : "#7f1d1d",
            }}
          >
            {error}
          </section>
        ) : null}

        <section className="rounded-lg p-4" style={panelStyle}>
          <h2 className="mb-1 text-lg font-semibold" style={{ color: t.text }}>
            Impacted regions
          </h2>
          <p className="mb-3 font-mono text-[10px] tracking-wider" style={{ color: t.textSoft }}>
            NWS alerts only — hail ≥ 1.00″ and/or peak winds &gt; 60 mph. Rows are ordered by hail size
            (largest first), then wind speed, then recency. Priority is a 1–100 rank within this list.
          </p>
          {events.length === 0 ? (
            <p className="text-sm" style={{ color: t.textMuted }}>
              Run a search to load high‑impact storm footprints.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="font-mono text-[10px] uppercase tracking-wider" style={{ color: t.textSoft }}>
                  <tr>
                    <th className="py-2 pr-3">Region</th>
                    <th className="py-2 pr-3">City / locality</th>
                    <th className="py-2 pr-3">State</th>
                    <th className="py-2 pr-3">Hail</th>
                    <th className="py-2 pr-3">Wind</th>
                    <th className="py-2 pr-3">Threat</th>
                    <th className="py-2 pr-3">Recency</th>
                    <th className="py-2 pr-3">Priority</th>
                    <th className="py-2 pr-3" />
                  </tr>
                </thead>
                <tbody style={{ color: t.text }}>
                  {events.map((event) => (
                    <tr key={event.id} className="border-t" style={{ borderColor: t.borderSoft }}>
                      <td className="py-2 pr-3">{event.areaDescription}</td>
                      <td className="py-2 pr-3 text-xs" style={{ color: t.textMuted }}>
                        {event.city ?? "—"}
                      </td>
                      <td className="py-2 pr-3 font-mono text-xs">
                        {event.state}
                        {event.queryRegion ? (
                          <span style={{ color: t.textSoft }}> · {event.queryRegion}</span>
                        ) : null}
                      </td>
                      <td className="py-2 pr-3 font-mono">{formatHailInches(event.hailSizeInches)}</td>
                      <td className="py-2 pr-3 font-mono">{formatWindMph(event.windGustMph)}</td>
                      <td className="py-2 pr-3">{event.severityScore}</td>
                      <td className="py-2 pr-3">{event.recencyScore}</td>
                      <td className="py-2 pr-3 font-semibold" style={{ color: t.accent }}>
                        {event.leadPriorityScore}
                      </td>
                      <td className="py-2 pr-3">
                        <button
                          type="button"
                          onClick={() => loadLeads(event)}
                          className="border px-3 py-1 font-mono text-[10px] tracking-wider"
                          style={{ borderColor: t.accent, color: t.accent }}
                        >
                          Leads
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section
          ref={contractorsSectionRef}
          className="rounded-lg p-4"
          style={{ ...panelStyle, scrollMarginTop: "5.5rem" }}
        >
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: t.text }}>
                Contractors{" "}
                {selectedEvent ? (
                  <span className="font-normal" style={{ color: t.textMuted }}>
                    — {selectedEvent.city ? `${selectedEvent.city}, ${selectedEvent.state}` : selectedEvent.areaDescription}
                  </span>
                ) : null}
              </h2>
              {leads.length > 0 ? (
                <p className="mt-1 font-mono text-[10px] tracking-wider" style={{ color: t.textSoft }}>
                  Showing top {HAIL_LEADS_TOP_CONTRACTORS} contractors by score for this area (Yelp, OpenStreetMap
                  Overpass, Nominatim, optional seeds)
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={exportPdf}
                disabled={!selectedEvent || leads.length === 0 || isExportingPdf}
                className="h-10 px-4 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: t.success, color: t.ribbonInk }}
              >
                {isExportingPdf ? "Building PDF…" : "Export PDF"}
              </button>
              <button
                type="button"
                onClick={exportCsv}
                disabled={selectedLeads.length === 0}
                className="h-10 border px-4 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                style={{ borderColor: t.border, color: t.text }}
              >
                CSV ({selectedLeads.length})
              </button>
            </div>
          </div>

          {isLoadingLeads ? (
            <p className="text-sm" style={{ color: t.textMuted }}>
              Loading contractors (OpenStreetMap + optional Yelp; may take up to a minute)…
            </p>
          ) : leadsNotice && leads.length === 0 ? (
            <p className="rounded-md border p-3 text-sm" style={{ borderColor: t.border, color: t.textMuted }}>
              {leadsNotice}
            </p>
          ) : leads.length === 0 ? (
            <p className="text-sm" style={{ color: t.textMuted }}>
              Select a storm zone to generate scored contractor lists.
            </p>
          ) : (
            <div className="space-y-3">
              {leads.map((lead) => (
                <article
                  key={lead.id}
                  className="rounded-lg border p-3"
                  style={{ borderColor: t.border, background: t.mode === "dark" ? "rgba(13,31,60,0.45)" : t.panelAlt }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.includes(lead.id)}
                        onChange={() => toggleLead(lead.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{lead.name}</p>
                        <p className="mt-1 text-xs" style={{ color: t.textMuted }}>
                          <span className="font-mono text-[10px]" style={{ color: t.textSoft }}>
                            City:{" "}
                          </span>
                          {lead.city ?? "—"}
                        </p>
                        <p className="text-xs" style={{ color: t.textMuted }}>
                          <span className="font-mono text-[10px]" style={{ color: t.textSoft }}>
                            Phone:{" "}
                          </span>
                          {lead.phone ?? "—"}
                        </p>
                        <p className="text-xs" style={{ color: t.textMuted }}>
                          <span className="font-mono text-[10px]" style={{ color: t.textSoft }}>
                            Email:{" "}
                          </span>
                          {lead.email ?? "—"}
                        </p>
                        <p className="mt-1 font-mono text-[10px] tracking-wide" style={{ color: t.textSoft }}>
                          {lead.leadType === "existing_customer" ? "Customer" : "Prospect"} · {lead.source}
                        </p>
                      </div>
                    </label>
                    <div className="text-right">
                      <p className="font-mono text-[10px]" style={{ color: t.textSoft }}>
                        Score
                      </p>
                      <p className="text-lg font-bold" style={{ color: t.success }}>
                        {lead.score}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 text-xs leading-relaxed" style={{ color: t.textMuted }}>
                    <p>Contactability: {lead.contactability}</p>
                    {lead.website ? (
                      <p className="break-all">
                        Web:{" "}
                        <a href={lead.website} style={{ color: t.blue }} target="_blank" rel="noreferrer">
                          {lead.website}
                        </a>
                      </p>
                    ) : null}
                    <p>
                      {lead.address ??
                        ([lead.city, lead.state].filter(Boolean).join(", ") || "No address data")}
                    </p>
                    <p className="mt-1" style={{ color: t.textSoft }}>
                      {lead.scoreReasons.join(" · ")}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {selectedEvent ? (
          <section className="rounded-lg p-4 text-sm leading-relaxed" style={panelStyle}>
            <p className="font-semibold" style={{ color: t.text }}>
              {selectedEvent.title}
            </p>
            <p className="mt-1 font-mono text-xs" style={{ color: t.textSoft }}>
              Lead area: {selectedEvent.city ?? "—"}, {selectedEvent.state} · Hail {formatHailInches(selectedEvent.hailSizeInches)} · Wind{" "}
              {formatWindMph(selectedEvent.windGustMph)}
            </p>
            <p className="mt-1" style={{ color: t.textMuted }}>
              Started: {prettyDate(selectedEvent.startsAt)} · Ended: {prettyDate(selectedEvent.endsAt)}
            </p>
            <p className="mt-2 text-xs" style={{ color: t.textSoft }}>
              {selectedEvent.summary}
            </p>
          </section>
        ) : null}
      </div>
    </main>
  )
}
