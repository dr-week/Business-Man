"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  RefreshCw,
  Star,
  ChevronDown,
  ChevronUp,
  Search,
  Sparkles,
  Zap,
  Briefcase,
  AlertCircle,
  Building2,
  Clock,
  MapPin,
  Package,
} from "lucide-react";
import type { NewsFeed } from "@/lib/news/feed";
import {
  qualifyPersonalizedNews,
  type PersonalizedOpportunity,
  type UserPreferences,
} from "@/lib/news/opportunities";

interface NewsFeedPanelProps {
  onResearch?: (topic: string) => void;
  onNavigateProfile?: () => void;
}

export function NewsFeedPanel({ onResearch, onNavigateProfile }: NewsFeedPanelProps) {
  const [data, setData] = useState<NewsFeed | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [stars, setStars] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({
    geography: "Goa, India",
    currency: "INR",
    budget: null,
    minimumInvestment: 0,
  });

  // Load preferences and favorites from localStorage
  useEffect(() => {
    try {
      const savedPrefs = JSON.parse(localStorage.getItem("businessman.preferences.v1") ?? "null");
      if (savedPrefs) {
        setPreferences({
          geography: typeof savedPrefs.geography === "string" ? savedPrefs.geography : "Goa, India",
          currency: typeof savedPrefs.currency === "string" ? savedPrefs.currency : "INR",
          budget: Number.isFinite(savedPrefs.budget) ? savedPrefs.budget : null,
          minimumInvestment: Number.isFinite(savedPrefs.minimumInvestment) ? savedPrefs.minimumInvestment : 0,
        });
      }
    } catch {
      /* Keep defaults */
    }

    try {
      const savedStars = JSON.parse(localStorage.getItem("businessman.starred.v1") ?? "[]");
      if (Array.isArray(savedStars)) setStars(savedStars.filter((id): id is string => typeof id === "string"));
    } catch {
      /* Ignore invalid */
    }
  }, []);

  const toggleStar = (id: string) => {
    const next = stars.includes(id) ? stars.filter((s) => s !== id) : [...stars, id];
    try {
      localStorage.setItem("businessman.starred.v1", JSON.stringify(next));
      setStars(next);
    } catch {
      /* Storage unavailable */
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/news", { signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json()) as NewsFeed & { error?: string };
        if (!response.ok) throw new Error(body.error ?? "News unavailable");
        if (!controller.signal.aborted) {
          setData(body);
          setError("");
        }
      })
      .catch((reason: Error) => {
        if (!controller.signal.aborted) setError(reason.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [revision]);

  const qualified = useMemo(() => {
    const items = data?.items ?? [];
    return qualifyPersonalizedNews(items, preferences);
  }, [data, preferences]);

  const renderCard = (item: PersonalizedOpportunity) => {
    const isExpanded = expandedId === item.id;
    const isStarred = stars.includes(item.id);

    return (
      <article key={item.id} className={`news-opp-card${isExpanded ? " is-expanded" : ""}`}>
        <div className="news-opp-summary">
          <div className="news-opp-topline">
            <span className="news-opp-role-tag">
              <Briefcase size={11} />
              {item.entryRole}
            </span>
            {item.isInferred && (
              <span className="news-opp-inferred-badge" title="News alone does not prove demand">
                Inferred
              </span>
            )}
            <div className="news-opp-quick-metrics">
              <span className="news-metric" title={item.metric1.label}>
                <small>{item.metric1.label}</small>
                <strong>{item.metric1.value}</strong>
              </span>
              <span className="news-metric" title={item.metric2.label}>
                <small>{item.metric2.label}</small>
                <strong>{item.metric2.value}</strong>
              </span>
              <span className="news-metric" title={item.metric3.label}>
                <small>{item.metric3.label}</small>
                <strong>{item.metric3.value}</strong>
              </span>
            </div>
            <div className="news-opp-actions">
              <button
                type="button"
                className="hunt-icon-action"
                title={isStarred ? "Unstar opportunity" : "Star opportunity"}
                aria-label={isStarred ? "Unstar opportunity" : "Star opportunity"}
                aria-pressed={isStarred}
                onClick={() => toggleStar(item.id)}
              >
                <Star size={14} fill={isStarred ? "currentColor" : "none"} />
              </button>
              <button
                type="button"
                className="hunt-icon-action"
                title={isExpanded ? "Collapse details" : "Expand structured details"}
                aria-label={isExpanded ? "Collapse details" : "Expand structured details"}
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
            </div>
          </div>

          <h3 className="news-opp-title" onClick={() => setExpandedId(isExpanded ? null : item.id)}>
            <span className="news-opp-title-text">{item.title}</span>
          </h3>

          <div className="news-opp-meta">
            <span className="news-opp-source">{item.sourceTitle}</span>
            <span className="news-opp-sep">·</span>
            <time dateTime={item.publishedAt}>
              {new Date(item.publishedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
            </time>
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="news-opp-source-link"
              title="Open verified source link"
              aria-label={`Open source for ${item.title}`}
            >
              <ExternalLink size={11} />
            </a>
          </div>
        </div>

        {isExpanded && (
          <div className="news-opp-details">
            {item.demandSignal && (
              <div className="news-opp-demand-signal">
                <div className="news-signal-item">
                  <Building2 size={13} />
                  <span>Buyer: {item.demandSignal.buyer}</span>
                </div>
                {item.demandSignal.quantity && (
                  <div className="news-signal-item">
                    <Package size={13} />
                    <span>Qty: {item.demandSignal.quantity}</span>
                  </div>
                )}
                {item.demandSignal.location && (
                  <div className="news-signal-item">
                    <MapPin size={13} />
                    <span>Location: {item.demandSignal.location}</span>
                  </div>
                )}
                {item.demandSignal.deadline && (
                  <div className="news-signal-item">
                    <Clock size={13} />
                    <span>Deadline: {item.demandSignal.deadline}</span>
                  </div>
                )}
              </div>
            )}

            <div className="news-opp-breakdown">
              <span className="news-breakdown-cell">
                <small>Setup cost</small>
                <strong>
                  {item.setupCost !== null
                    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: item.currency, maximumFractionDigits: 0 }).format(item.setupCost)
                    : "Unknown"}
                </strong>
              </span>
              <span className="news-breakdown-sep">+</span>
              <span className="news-breakdown-cell">
                <small>Working capital</small>
                <strong>
                  {item.workingCapital !== null
                    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: item.currency, maximumFractionDigits: 0 }).format(item.workingCapital)
                    : "Unknown"}
                </strong>
              </span>
              <span className="news-breakdown-sep">=</span>
              <span className="news-breakdown-cell highlight">
                <small>Total investment</small>
                <strong>
                  {item.totalInvestment !== null
                    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: item.currency, maximumFractionDigits: 0 }).format(item.totalInvestment)
                    : "Unknown"}
                </strong>
              </span>
            </div>

            <div className="news-opp-steps">
              <h4>Operating steps</h4>
              <ol>
                {item.operatingSteps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>

            <div className="news-opp-evidence">
              <h4>Evidence & Claims</h4>
              <ul>
                {item.evidence.map((ev, idx) => (
                  <li key={idx} className={ev.risk ? "news-evidence-risk" : ""}>
                    <span>{ev.claim}</span>
                    <a href={ev.url} target="_blank" rel="noreferrer" className="news-evidence-ref">
                      {ev.source} <ExternalLink size={10} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="news-opp-footer-actions">
              <button
                type="button"
                className="hunt-create-submit news-research-cta"
                onClick={() => onResearch?.(item.topic)}
                title={`Research ${item.topic}`}
              >
                <Search size={14} />
                Research this opportunity
              </button>
            </div>
          </div>
        )}
      </article>
    );
  };

  return (
    <section aria-label="Personalised business wire" className="news-feed">
      <header>
        <div className="news-feed-title">
          <small>
            {data
              ? `Wire updated ${new Date(data.fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · ${preferences.geography}`
              : "Personalised Business Wire"}
          </small>
        </div>
        <button
          className="hunt-icon-action"
          disabled={loading}
          title="Refresh news"
          aria-label="Refresh news"
          onClick={() => {
            setLoading(true);
            setRevision((value) => value + 1);
          }}
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </header>

      <div role="status" className="news-feed-status">
        {loading ? "Fetching and qualifying wire…" : error || (data?.stale ? "Offline cache active" : "")}
      </div>

      {!!data?.unavailable.length && (
        <small className="news-feed-notice">Feeds restricted: {data.unavailable.join(", ")}</small>
      )}

      {/* SECTION 1: FOR YOU */}
      {qualified.forYou && (
        <section className="news-section news-section-foryou" aria-label="For You featured opportunity">
          <div className="news-section-header">
            <span className="news-section-badge">
              <Sparkles size={12} />
              For You
            </span>
            <span className="news-section-subtitle">
              {qualified.requiresBudgetPrompt
                ? "Affordability unverified · Set budget in Profile"
                : `Matched to ${preferences.geography} & budget`}
            </span>
            {qualified.requiresBudgetPrompt && onNavigateProfile && (
              <button
                type="button"
                className="news-profile-link-btn"
                onClick={onNavigateProfile}
                title="Open Profile to set maximum available budget"
              >
                <AlertCircle size={12} /> Set budget
              </button>
            )}
          </div>
          {renderCard(qualified.forYou)}
        </section>
      )}

      {/* SECTION DIVIDER WITH SUBTLE IDLE ACCENT */}
      {qualified.forYou && qualified.demandNow.length > 0 && <div className="news-section-divider" />}

      {/* SECTION 2: DEMAND NOW */}
      {qualified.demandNow.length > 0 && (
        <section className="news-section news-section-demand" aria-label="Current buyer demand signals">
          <div className="news-section-header">
            <span className="news-section-badge demand-badge">
              <Zap size={12} />
              Demand Now
            </span>
            <span className="news-section-subtitle">Active procurement & buyer orders</span>
          </div>
          <div className="news-cards-grid">{qualified.demandNow.map(renderCard)}</div>
        </section>
      )}

      {/* SECTION DIVIDER WITH SUBTLE IDLE ACCENT */}
      {qualified.demandNow.length > 0 && qualified.everydayBusiness.length > 0 && (
        <div className="news-section-divider" />
      )}

      {/* SECTION 3: EVERYDAY BUSINESS */}
      {qualified.everydayBusiness.length > 0 && (
        <section className="news-section news-section-everyday" aria-label="Recurring everyday business needs">
          <div className="news-section-header">
            <span className="news-section-badge everyday-badge">
              <Briefcase size={12} />
              Everyday Business
            </span>
            <span className="news-section-subtitle">Recurring needs supported by evidence</span>
          </div>
          <div className="news-cards-grid">{qualified.everydayBusiness.map(renderCard)}</div>
        </section>
      )}

      {!loading &&
        !error &&
        !qualified.forYou &&
        !qualified.demandNow.length &&
        !qualified.everydayBusiness.length && <p className="news-feed-empty">No dispatches available.</p>}
    </section>
  );
}
