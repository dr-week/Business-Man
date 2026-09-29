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
    BUCKET?: R2Bucket;
  }
}
