export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  /** Display date. */
  date: string;
  /** ISO date for <time>, sitemap and Article schema. */
  isoDate: string;
  read: string;
  tag: string;
  color: string;
  body: string[];
};

export type BlogPostSummary = Omit<BlogPost, "body">;

export const BLOG_TAGS = ["All", "Money tips", "How-to", "Business", "Industry", "Security"] as const;

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "save-money-on-data-bundles-nigeria-2026",
    title: "10 ways to save money on data bundles in Nigeria (2026 edition)",
    excerpt: "Data is expensive in Nigeria — but it doesn't have to be. Here are ten battle-tested ways to cut your monthly bill in half without sacrificing speed.",
    author: "Adaeze Okafor",
    date: "May 2, 2026",
    isoDate: "2026-05-02",
    read: "6 min read",
    tag: "Money tips",
    color: "from-blue-500/30 to-purple-500/20",
    body: [
      "Mobile data in Nigeria has nearly doubled in the past three years, but most people are still buying bundles the same way they did in 2018 — straight from telco USSD codes at full retail price. There's a smarter way.",
      "1. Buy data through GapCastle, not USSD. We aggregate volume across thousands of users and pass the discount on to you — typically 5–12% cheaper than dialing *131# or *312#.",
      "2. Match your bundle to your actual usage. The average Nigerian uses 4.7GB/month but buys 8GB. Check your usage first, then size down.",
      "3. Use night plans for big downloads. MTN, Glo and Airtel all offer 1AM–6AM bundles at 70% discount. Schedule OS updates and Netflix downloads then.",
      "4. Stop auto-renewing weekly plans. Monthly plans are almost always cheaper per GB. Switch and save.",
      "5. Earn 2% cashback on every data purchase via GapCastle Rewards — that's a free 200MB on every 10GB.",
      "6. Use 9mobile MoreTalk for hybrid voice + data — perfect if you make a lot of calls.",
      "7. Tether responsibly. Use a hotspot password and limit guest devices.",
      "8. Compress media in WhatsApp settings. Saves up to 30% on WhatsApp data.",
      "9. Use offline modes in YouTube, Spotify and Google Maps.",
      "10. Refer friends to GapCastle — every successful referral gives you ₦500 in wallet credit.",
    ],
  },
  {
    slug: "complete-guide-paying-electricity-bills-online",
    title: "The complete guide to paying electricity bills online in Nigeria",
    excerpt: "Tired of queueing at the disco office? This step-by-step guide shows you how to pay any Nigerian electricity bill in under 60 seconds.",
    author: "Ibrahim Yusuf",
    date: "Apr 24, 2026",
    isoDate: "2026-04-24",
    read: "8 min read",
    tag: "How-to",
    color: "from-amber-500/30 to-orange-500/20",
    body: [
      "Eleven distribution companies. Two billing systems. A million ways to fail. Paying for electricity in Nigeria has historically been a nightmare — but the digital era has changed everything.",
      "First, identify your distribution company (disco). Your meter or last paper bill will tell you whether you're with Ikeja Electric, EKEDC, AEDC, IBEDC, KEDCO, BEDC, EEDC, JEDC, KAEDCO, PHED or YEDC.",
      "Next, decide your tariff: prepaid (you buy a token in advance) or postpaid (billed monthly after consumption). Prepaid is now the standard for new connections.",
      "To pay on GapCastle: open the app → Services → Electricity → pick your disco → enter your meter number → enter the amount → confirm. The token arrives via SMS in seconds.",
      "Common pitfalls: wrong meter number (always double-check), choosing the wrong disco (your token won't load), and assuming the lowest amount works (some discos enforce minimums).",
      "Pro tip: save your meter as a beneficiary. Next time, paying takes three taps.",
      "If your token doesn't arrive after 5 minutes, contact GapCastle support — we'll trace it with the disco directly.",
    ],
  },
  {
    slug: "vtu-business-nigeria-how-to-start",
    title: "Starting a VTU business in Nigeria: a beginner's roadmap",
    excerpt: "Want to make money reselling airtime and data? Here's how to launch a profitable VTU business with as little as ₦20,000.",
    author: "Tunde Bakare",
    date: "Apr 12, 2026",
    isoDate: "2026-04-12",
    read: "10 min read",
    tag: "Business",
    color: "from-emerald-500/30 to-teal-500/20",
    body: [
      "Virtual Top-Up (VTU) is one of Nigeria's most accessible side hustles. With a smartphone, ₦20,000 capital and a small network of regular customers, you can earn ₦15,000–₦60,000 monthly in passive income.",
      "Step 1: Pick your niche. Are you serving students on a campus? Office workers? A specific neighborhood? Niching down beats serving everyone badly.",
      "Step 2: Open a GapCastle Business account. You'll get bulk discounts (1–3% off retail), API access for resale, and a dashboard to track every transaction.",
      "Step 3: Fund your wallet. Start with ₦20k–₦50k. Reinvest profits weekly.",
      "Step 4: Set your margin. Most resellers add 3–5% on airtime and 2–4% on data. Be transparent with customers.",
      "Step 5: Market locally. WhatsApp status, neighborhood groups, and word-of-mouth still beat paid ads at this scale.",
      "Step 6: Track everything. GapCastle's transaction history makes monthly bookkeeping a breeze.",
      "Common mistake: extending credit to friends. Don't. Cash on delivery only.",
    ],
  },
  {
    slug: "fintech-trends-shaping-nigeria-2026",
    title: "5 fintech trends shaping Nigeria in 2026",
    excerpt: "From AI-powered credit scoring to cross-border instant payments, here's what's reshaping money in Nigeria right now.",
    author: "Chiamaka Eze",
    date: "Apr 3, 2026",
    isoDate: "2026-04-03",
    read: "7 min read",
    tag: "Industry",
    color: "from-pink-500/30 to-rose-500/20",
    body: [
      "Nigeria's fintech sector raised over $1.2B in 2025 alone. Here are the five trends defining 2026.",
      "1. AI credit scoring is killing the BVN-only model. Lenders now factor in airtime spend, mobile data patterns and even WhatsApp status frequency.",
      "2. eNaira is finally seeing adoption — but only for government-to-citizen payments. Retail use remains low.",
      "3. Cross-border QR codes between Nigeria, Ghana and Kenya are making cedi-naira and shilling-naira transfers instant and nearly free.",
      "4. Open Banking went live in Q1 2026. Your bank statements can now be shared securely with any fintech in seconds — unlocking better loans.",
      "5. Embedded finance is everywhere. Buy airtime inside Netflix, take a loan inside Uber, save inside Konga. The standalone fintech app may be peaking.",
    ],
  },
  {
    slug: "how-to-spot-payment-scams-nigeria",
    title: "How to spot (and avoid) payment scams in Nigeria",
    excerpt: "Scammers are getting smarter. Here are the seven red flags that will keep your money — and your peace of mind — intact.",
    author: "Adaeze Okafor",
    date: "Mar 21, 2026",
    isoDate: "2026-03-21",
    read: "5 min read",
    tag: "Security",
    color: "from-red-500/30 to-pink-500/20",
    body: [
      "Nigerian users lost over ₦18B to digital scams in 2025. The good news? 90% of those scams follow predictable patterns.",
      "Red flag 1: 'GapCastle agent' calling to ask for your PIN. We never call you for your PIN. Hang up.",
      "Red flag 2: SMS with a shortened link claiming your account is suspended. Always go to the app directly.",
      "Red flag 3: 'Investment' offers promising 30% monthly returns. If it's that good, why is a stranger telling you?",
      "Red flag 4: Pressure to act 'in the next 5 minutes'. Real businesses don't operate that way.",
      "Red flag 5: Wrong-amount transfers and refund requests. Ignore. Block. Report.",
      "Red flag 6: Anyone asking for OTP codes. Ever. For any reason.",
      "Red flag 7: 'Send N5,000 first to receive your loan disbursement.' Real lenders never ask for upfront payment.",
    ],
  },
  {
    slug: "auto-pay-bills-never-miss-deadline",
    title: "Auto-pay your bills: never miss a deadline again",
    excerpt: "Late fees on electricity, internet and rent quietly drain ₦20k+ from the average Nigerian household every year. Here's how to stop the bleeding.",
    author: "Tunde Bakare",
    date: "Mar 9, 2026",
    isoDate: "2026-03-09",
    read: "4 min read",
    tag: "Money tips",
    color: "from-cyan-500/30 to-blue-500/20",
    body: [
      "Auto-pay sounds boring. But it's the single highest-ROI feature in modern banking — saving households ₦20k+ annually in late fees and reconnection charges.",
      "On GapCastle, auto-pay is one tap. After your first successful payment to any biller, tap the 'Auto-pay' toggle on the receipt. Pick frequency, start date and amount.",
      "Best candidates for auto-pay: rent, internet, cable TV, gym, school fees, insurance premiums.",
      "Avoid auto-pay for: variable bills (electricity), one-off services, and anything you might want to dispute.",
      "Pause anytime. We send a reminder 48 hours before each charge so nothing surprises you.",
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

/** Posts without their bodies — what the client-side blog filter needs. */
export function getBlogPostSummaries(): BlogPostSummary[] {
  return BLOG_POSTS.map((post): BlogPostSummary => {
    const summary: Partial<BlogPost> = { ...post };
    delete summary.body;
    return summary as BlogPostSummary;
  });
}
