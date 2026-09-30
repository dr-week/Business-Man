declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    LAYA_URL?: string;
    LAYA_API_KEY?: string;
    COLLECTOR_URL?: string;
    GOOGLE_PLACES_API_KEY?: string;
    CENSUS_API_KEY?: string;
    BRAVE_SEARCH_API_KEY?: string;
    COLLECTOR_KEY?: string;
    RAZORPAY_KEY_ID?: string;
    RAZORPAY_KEY_SECRET?: string;
    RAZORPAY_WEBHOOK_SECRET?: string;
    RAZORPAY_DECISION_BRIEF_PRICE_PAISE?: string;
    RAZORPAY_ASSISTED_VALIDATION_PRICE_PAISE?: string;
    BUCKET?: R2Bucket;
  }
}
