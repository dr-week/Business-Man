"use client";

import { useState } from "react";
import { Megaphone, Copy, Check, Mail, Calendar, Download } from "lucide-react";
import { buildValidationCalendar, generateMarketingCampaign } from "@/lib/marketing-automation";
import type { ResearchOpportunity } from "@/lib/research-engine";

export function MarketingAutomationPanel({
  opportunity,
  currency = "INR",
}: {
  opportunity: ResearchOpportunity;
  currency?: string;
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copyError, setCopyError] = useState(false);
  const [calendarDownloaded, setCalendarDownloaded] = useState(false);
  const [activeChannel, setActiveChannel] = useState<"x" | "linkedin" | "email" | "cadence">("x");

  const campaign = generateMarketingCampaign(opportunity, currency);

  async function copyToClipboard(key: string, text: string) {
    setCopyError(false);
    setCalendarDownloaded(false);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((current) => current === key ? null : current), 2000);
    } catch {
      setCopiedKey(null);
      setCopyError(true);
    }
  }

  const fullThreadText = campaign.xThread.map((t) => t.text).join("\n\n---\n\n");

  function downloadValidationCalendar() {
    const blob = new Blob([buildValidationCalendar(campaign)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const fileId = campaign.opportunityId.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80) || "research";
    link.download = `buyer-validation-${fileId}.ics`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setCopyError(false);
    setCopiedKey(null);
    setCalendarDownloaded(true);
  }

  return (
    <div className="marketing-automation-panel" style={{ padding: "16px", background: "#171a14", border: "1px solid #35392e", borderRadius: "10px", marginTop: "14px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--gold)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
            <Megaphone size={14} /> Marketing Draft Kit
          </span>
          <h4 style={{ margin: "4px 0 0 0", fontSize: "16px", color: "#eeeae0" }}>Distribution Kit: {campaign.opportunityName}</h4>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            type="button"
            className={`archetype-btn ${activeChannel === "x" ? "is-selected" : ""}`}
            onClick={() => setActiveChannel("x")}
          >
            𝕏 X Thread
          </button>
          <button
            type="button"
            className={`archetype-btn ${activeChannel === "linkedin" ? "is-selected" : ""}`}
            onClick={() => setActiveChannel("linkedin")}
          >
            in LinkedIn
          </button>
          <button
            type="button"
            className={`archetype-btn ${activeChannel === "email" ? "is-selected" : ""}`}
            onClick={() => setActiveChannel("email")}
          >
            <Mail size={12} style={{ display: "inline", marginRight: "4px" }} /> Cold Email
          </button>
          <button
            type="button"
            className={`archetype-btn ${activeChannel === "cadence" ? "is-selected" : ""}`}
            onClick={() => setActiveChannel("cadence")}
          >
            <Calendar size={12} style={{ display: "inline", marginRight: "4px" }} /> 5-Day Plan
          </button>
        </div>
      </header>

      <p role="status" aria-live="polite" style={{ margin: "0 0 12px", color: copyError ? "#f0a39a" : "#8b937e", fontSize: "11px" }}>
        {copyError
          ? "Copy failed. Check browser clipboard permission and try again."
          : calendarDownloaded
            ? "Calendar file downloaded. Import it into your calendar; tasks remain yours to review."
            : copiedKey
            ? "Copied to clipboard. Review sources and assumptions before publishing; drafts are not posted automatically."
            : "Drafts only. Review sources and assumptions before publishing; nothing is posted automatically."}
      </p>

      {activeChannel === "x" && (
        <div style={{ display: "grid", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#aaa99b" }}>5-Tweet High-Engagement Teardown</span>
            <button
              type="button"
              className="hunt-icon-action"
              style={{ height: "30px", width: "auto", padding: "0 10px", fontSize: "11px", gap: "4px" }}
              onClick={() => copyToClipboard("full-thread", fullThreadText)}
            >
              {copiedKey === "full-thread" ? <Check size={12} /> : <Copy size={12} />}
              {copiedKey === "full-thread" ? "Copied Thread" : "Copy Full Thread"}
            </button>
          </div>
          {campaign.xThread.map((t) => (
            <div key={t.tweetNumber} style={{ padding: "10px 12px", background: "#10140e", border: "1px solid #2e3525", borderRadius: "6px", fontSize: "12px", color: "#dcd8c9", lineHeight: 1.5 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--gold)", fontSize: "10px", marginBottom: "4px" }}>
                <span>Tweet {t.tweetNumber}/5</span>
                <button
                  type="button"
                  style={{ color: "#aaa99b", cursor: "pointer", border: "none", background: "none" }}
                  onClick={() => copyToClipboard(`tweet-${t.tweetNumber}`, t.text)}
                >
                  {copiedKey === `tweet-${t.tweetNumber}` ? "Copied" : "Copy"}
                </button>
              </div>
              <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{t.text}</p>
            </div>
          ))}
        </div>
      )}

      {activeChannel === "linkedin" && (
        <div style={{ display: "grid", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#aaa99b" }}>Thought Leadership Post (Founder / Operator Lens)</span>
            <button
              type="button"
              className="hunt-icon-action"
              style={{ height: "30px", width: "auto", padding: "0 10px", fontSize: "11px", gap: "4px" }}
              onClick={() => copyToClipboard("linkedin", campaign.linkedinPost)}
            >
              {copiedKey === "linkedin" ? <Check size={12} /> : <Copy size={12} />}
              {copiedKey === "linkedin" ? "Copied Post" : "Copy Post"}
            </button>
          </div>
          <div style={{ padding: "12px", background: "#10140e", border: "1px solid #2e3525", borderRadius: "6px", fontSize: "12px", color: "#dcd8c9", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {campaign.linkedinPost}
          </div>
        </div>
      )}

      {activeChannel === "email" && (
        <div style={{ display: "grid", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#aaa99b" }}>Direct Operator Outreach (Value-First / No Pitch)</span>
            <button
              type="button"
              className="hunt-icon-action"
              style={{ height: "30px", width: "auto", padding: "0 10px", fontSize: "11px", gap: "4px" }}
              onClick={() => copyToClipboard("email", `Subject: ${campaign.coldOutreachEmail.subject}\n\n${campaign.coldOutreachEmail.body}`)}
            >
              {copiedKey === "email" ? <Check size={12} /> : <Copy size={12} />}
              {copiedKey === "email" ? "Copied Email" : "Copy Email"}
            </button>
          </div>
          <div style={{ padding: "10px 12px", background: "#10140e", border: "1px solid #2e3525", borderRadius: "6px", fontSize: "12px", color: "var(--gold)", fontWeight: 600 }}>
            Subject: {campaign.coldOutreachEmail.subject}
          </div>
          <div style={{ padding: "12px", background: "#10140e", border: "1px solid #2e3525", borderRadius: "6px", fontSize: "12px", color: "#dcd8c9", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {campaign.coldOutreachEmail.body}
          </div>
          <div style={{ fontSize: "11px", color: "#8b937e" }}>
            Call to Action: <strong>{campaign.coldOutreachEmail.callToAction}</strong>
          </div>
        </div>
      )}

      {activeChannel === "cadence" && (
        <div style={{ display: "grid", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "#aaa99b" }}>Five-Day Buyer Validation Experiment · Suggested actions only</span>
          <div className="marketing-calendar-export">
            <p>Put these buyer-validation actions on your calendar. Nothing is sent or posted automatically.</p>
            <button type="button" className="research-submit" onClick={downloadValidationCalendar}><Download size={14} /> Download 5-day plan (.ics)</button>
            <a href="https://support.google.com/calendar/answer/37118" target="_blank" rel="noreferrer">How to import into Google Calendar ↗</a>
          </div>
          {campaign.weeklyDistributionCadence.map((c) => (
            <div key={c.day} style={{ display: "grid", gap: "6px", padding: "8px 12px", background: "#10140e", border: "1px solid #2e3525", borderRadius: "6px", fontSize: "12px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <strong style={{ color: "var(--gold)", minWidth: "75px" }}>{c.day}</strong>
                <span style={{ color: "#8b937e", fontSize: "11px", border: "1px solid #35392e", borderRadius: "4px", padding: "2px 6px" }}>{c.platform}</span>
                <span style={{ color: "#dcd8c9" }}>{c.action}</span>
              </div>
              <small style={{ color: "#aaa99b", paddingLeft: "85px" }}>Measure: {c.successMeasure}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
