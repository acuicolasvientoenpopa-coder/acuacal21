import posthog from "posthog-js";

const KEY = "phc_demo"; // reemplazar con API key real de https://us.posthog.com
const HOST = "https://us.i.posthog.com";

posthog.init(KEY, {
  api_host: HOST,
  capture_pageview: true,
  loaded: (ph) => {
    if (KEY === "phc_demo") ph.opt_out_capturing();
  },
});

export default posthog;
