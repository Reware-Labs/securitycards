import type { PostHogInterface } from 'posthog-js';

export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;
export type AnalyticsConsent = 'accepted' | 'rejected';
export interface ConsentPreferences {
  analytics: boolean;
  replay: boolean;
}

const CONSENT_KEY = 'securitycards.analytics-consent';
const REPLAY_SAMPLE_KEY = 'securitycards.replay-sample.v1';
const CONSENT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;
const REPLAY_SAMPLE_RATE = 0.25;

const enabled = import.meta.env.PUBLIC_ANALYTICS_ENABLED === 'true';
const projectKey = import.meta.env.PUBLIC_POSTHOG_KEY?.trim() ?? '';
const apiHost = import.meta.env.PUBLIC_POSTHOG_HOST?.trim() ?? '';
const environment = import.meta.env.PUBLIC_ANALYTICS_ENVIRONMENT?.trim() || 'development';
const configured = enabled && projectKey.startsWith('phc_') && /^https:\/\//.test(apiHost);
const diagnostic = configured && environment === 'development';

export function isAnalyticsConfigured(): boolean {
  return configured;
}

let client: PostHogInterface | null = null;
let initializing: Promise<PostHogInterface | null> | null = null;
let engagementStartedAt = 0;
let activeMilliseconds = 0;
let maxScrollPercent = 0;
let engagementSent = false;
let engagementListenersAttached = false;

interface StoredConsent {
  preferences: ConsentPreferences;
  decidedAt: number;
  expiresAt: number;
}

function readStoredConsent(): StoredConsent | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredConsent>;
    if (typeof parsed.preferences?.analytics !== 'boolean'
      || typeof parsed.preferences?.replay !== 'boolean'
      || typeof parsed.decidedAt !== 'number'
      || typeof parsed.expiresAt !== 'number') return null;
    if (parsed.expiresAt <= Date.now()) {
      localStorage.removeItem(CONSENT_KEY);
      return null;
    }
    return parsed as StoredConsent;
  } catch {
    return null;
  }
}

export function getConsentPreferences(): ConsentPreferences | null {
  return readStoredConsent()?.preferences ?? null;
}

export function getAnalyticsConsent(): AnalyticsConsent | null {
  const preferences = getConsentPreferences();
  return preferences === null ? null : preferences.analytics ? 'accepted' : 'rejected';
}

export function setConsentPreferences(preferences: ConsentPreferences): void {
  const normalized = {
    analytics: preferences.analytics,
    replay: preferences.analytics && preferences.replay,
  };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      preferences: normalized,
      decidedAt: Date.now(),
      expiresAt: Date.now() + CONSENT_MAX_AGE_MS,
    } satisfies StoredConsent));
  } catch {
    // Browsing continues when storage is unavailable.
  }
  window.dispatchEvent(new CustomEvent('analytics:consent-changed', { detail: normalized }));
}

function pageProperties(): AnalyticsProperties {
  const data = document.body.dataset;
  return {
    path: window.location.pathname,
    page_type: data.analyticsPageType || 'page',
    library: data.analyticsLibrary,
    language: data.analyticsLanguage,
    version: data.analyticsVersion,
  };
}

function stripUrlDetails(value: unknown): unknown {
  if (typeof value !== 'string' || !value) return value;
  try {
    const url = new URL(value, window.location.origin);
    return `${url.origin}${url.pathname}`;
  } catch {
    return value;
  }
}

function cleanProperties(properties: AnalyticsProperties): Record<string, string | number | boolean | null> {
  return Object.fromEntries(
    Object.entries({ ...pageProperties(), ...properties, environment })
      .filter(([, value]) => value !== undefined),
  ) as Record<string, string | number | boolean | null>;
}

function replayIsSampled(): boolean {
  if (!getConsentPreferences()?.replay) return false;
  try {
    const existing = sessionStorage.getItem(REPLAY_SAMPLE_KEY);
    if (existing === 'true' || existing === 'false') return existing === 'true';
    const sampled = Math.random() < REPLAY_SAMPLE_RATE;
    sessionStorage.setItem(REPLAY_SAMPLE_KEY, String(sampled));
    return sampled;
  } catch {
    return false;
  }
}

function startEngagementMeasurement(): void {
  activeMilliseconds = 0;
  maxScrollPercent = 0;
  engagementSent = false;
  if (!document.hidden) engagementStartedAt = performance.now();
  if (engagementListenersAttached) return;
  engagementListenersAttached = true;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && engagementStartedAt) {
      activeMilliseconds += performance.now() - engagementStartedAt;
      engagementStartedAt = 0;
    } else if (!document.hidden) {
      engagementStartedAt = performance.now();
    }
  });

  const updateScroll = () => {
    const available = document.documentElement.scrollHeight - window.innerHeight;
    const percent = available <= 0 ? 100 : Math.round((window.scrollY / available) * 100);
    maxScrollPercent = Math.max(maxScrollPercent, Math.min(100, percent));
  };
  updateScroll();
  window.addEventListener('scroll', updateScroll, { passive: true });
  window.addEventListener('pagehide', sendEngagement, { once: true });
}

function scrollBucket(): string {
  if (maxScrollPercent >= 90) return '90-100';
  if (maxScrollPercent >= 75) return '75-89';
  if (maxScrollPercent >= 50) return '50-74';
  if (maxScrollPercent >= 25) return '25-49';
  return '0-24';
}

function sendEngagement(): void {
  if (engagementSent || !client) return;
  if (engagementStartedAt) activeMilliseconds += performance.now() - engagementStartedAt;
  engagementSent = true;
  capture('page_engagement', {
    active_seconds: Math.min(3600, Math.round(activeMilliseconds / 1000)),
    max_scroll_depth: scrollBucket(),
  });
}

function initialContentEvent(): void {
  const activePanel = document.querySelector<HTMLElement>('.lib-panel:not([hidden])');
  if (activePanel?.dataset.panel) {
    capture('security_card_viewed', { card: activePanel.dataset.panel, navigation_source: 'initial' });
  }
}

function acquisitionProperties(): AnalyticsProperties {
  const params = new URLSearchParams(window.location.search);
  const properties: AnalyticsProperties = {};
  for (const key of ['source', 'medium', 'campaign'] as const) {
    const value = params.get(`utm_${key}`)?.trim();
    if (value) properties[`campaign_${key}`] = value.slice(0, 100);
  }
  return properties;
}

export async function initializeAnalytics(): Promise<PostHogInterface | null> {
  if (!configured || getAnalyticsConsent() !== 'accepted') return null;
  if (client) {
    client.opt_in_capturing();
    if (replayIsSampled()) client.startSessionRecording(true);
    else client.stopSessionRecording();
    initialContentEvent();
    startEngagementMeasurement();
    return client;
  }
  if (initializing) return initializing;

  initializing = import('posthog-js').then(({ default: posthog }) => {
    posthog.init(projectKey, {
      api_host: apiHost,
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: false,
      person_profiles: 'never',
      save_campaign_params: false,
      save_referrer: true,
      disable_session_recording: true,
      disable_surveys: true,
      disable_web_experiments: true,
      enable_recording_console_log: false,
      capture_performance: { web_vitals: true, network_timing: false },
      get_current_url: () => `${window.location.origin}${window.location.pathname}`,
      before_send: (event) => {
        if (!event) return null;
        if (event.properties) {
          event.properties.$current_url = stripUrlDetails(event.properties.$current_url);
          delete event.properties.$referrer;
          delete event.properties.$raw_user_agent;
        }
        return event;
      },
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: 'input, textarea, select, [contenteditable="true"], [data-analytics-mask]',
        blockSelector: '[data-analytics-block]',
        recordCrossOriginIframes: false,
      },
      loaded: (instance) => {
        client = instance;
        instance.register({ environment, ...acquisitionProperties() });
        if (replayIsSampled()) instance.startSessionRecording(true);
        initialContentEvent();
        startEngagementMeasurement();
      },
    });
    return posthog;
  }).catch((error: unknown) => {
    initializing = null;
    if (diagnostic) console.warn('[analytics] PostHog could not initialize', error);
    return null;
  });
  return initializing;
}

export function capture(event: string, properties: AnalyticsProperties = {}): void {
  if (!configured || getAnalyticsConsent() !== 'accepted') return;
  const safeProperties = cleanProperties(properties);
  if (diagnostic) console.debug('[analytics]', event, safeProperties);
  if (client) client.capture(event, safeProperties);
  else void initializeAnalytics().then((instance) => instance?.capture(event, safeProperties));
}

export function disableAnalytics(): void {
  engagementStartedAt = 0;
  activeMilliseconds = 0;
  engagementSent = false;
  try { sessionStorage.removeItem(REPLAY_SAMPLE_KEY); } catch { /* Ignore blocked storage. */ }
  if (!client) return;
  client.stopSessionRecording();
  client.opt_out_capturing();
  client.reset();
}

function trackDelegatedInteractions(): void {
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const tracked = target?.closest<HTMLElement>('[data-analytics-event]');
    if (tracked?.dataset.analyticsEvent) {
      capture(tracked.dataset.analyticsEvent, {
        library: tracked.dataset.analyticsLibrary,
        language: tracked.dataset.analyticsLanguage,
        version: tracked.dataset.analyticsVersion,
        content_type: tracked.dataset.analyticsContentType,
        destination: tracked.dataset.analyticsDestination,
      });
      return;
    }

    const anchor = target?.closest<HTMLAnchorElement>('a[href]');
    if (!anchor) return;
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) capture('outbound_link_clicked', { destination: url.hostname });
  });
}

trackDelegatedInteractions();
window.addEventListener('analytics:consent-changed', (event) => {
  const preferences = (event as CustomEvent<ConsentPreferences>).detail;
  if (preferences.analytics) {
    if (!preferences.replay) {
      try { sessionStorage.removeItem(REPLAY_SAMPLE_KEY); } catch { /* Ignore blocked storage. */ }
      client?.stopSessionRecording();
    }
    void initializeAnalytics();
  }
  else disableAnalytics();
});
if (getAnalyticsConsent() === 'accepted') void initializeAnalytics();
