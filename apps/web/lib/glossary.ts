/**
 * Plain-language glossary behind the tap-able term chips (docs/01 §5:
 * "jargon appears only alongside its plain-language twin"). Every entry has
 * a 15-year-old-friendly definition, why it matters, an in-app place to see
 * it live, and a Google search for going deeper.
 */

export interface GlossaryEntry {
  /** Displayed name, e.g. "SIP". */
  term: string;
  /** What it is, in one or two friendly sentences. */
  what: string;
  /** Why a learner should care. */
  why: string;
  /** In-app page where this concept is live. */
  tryIt?: { href: string; label: string };
  /** Google search query for reading more. */
  searchQuery: string;
}

export const GLOSSARY = {
  sip: {
    term: "SIP",
    what: "A Systematic Investment Plan — investing a fixed amount every month (say ₹2,000) into a mutual fund automatically, instead of one big lump sum.",
    why: "It builds the habit, and buying every month means you buy more units when prices dip. Most people's first real investment is a SIP.",
    tryIt: { href: "/investments", label: "Compare SIP growth in the Investment Simulator" },
    searchQuery: "what is SIP systematic investment plan explained simply",
  },
  emi: {
    term: "EMI",
    what: "Equated Monthly Instalment — the fixed amount you repay every month on a loan. Part of it repays what you borrowed, part is interest.",
    why: "Early EMIs are mostly interest; only later do you seriously reduce the loan. Knowing this explains why prepaying early saves so much.",
    tryIt: { href: "/loans", label: "See your EMI split in the Loan Simulator" },
    searchQuery: "what is EMI equated monthly installment how is it calculated",
  },
  inflation: {
    term: "Inflation",
    what: "The rate at which prices rise each year — so the same money buys a little less every year. India's has typically been around 4–8%.",
    why: "Money 'kept safe' in a drawer quietly shrinks. Any return below inflation is a loss in disguise.",
    tryIt: { href: "/inflation", label: "Watch ₹1,000 shrink in the Inflation Simulator" },
    searchQuery: "what is inflation and how does it reduce purchasing power",
  },
  "compound-interest": {
    term: "Compound interest",
    what: "Interest that earns its own interest. Each year's interest joins your balance, and next year's interest is calculated on the bigger amount.",
    why: "It's the engine behind almost all long-term wealth — and behind credit-card debt spirals. Same maths, both directions.",
    tryIt: { href: "/compound-interest", label: "See it curve upward in the Visualizer" },
    searchQuery: "compound interest explained simply with example",
  },
  "rule-of-72": {
    term: "Rule of 72",
    what: "A mental shortcut: divide 72 by the interest rate to estimate how many years your money takes to double. At 8%, that's about 9 years.",
    why: "It turns abstract percentages into something you can feel — '12% means doubling every 6 years'.",
    tryIt: { href: "/compound-interest", label: "Check it against the real curve" },
    searchQuery: "rule of 72 doubling money explained",
  },
  foir: {
    term: "FOIR / DTI",
    what: "Fixed Obligation to Income Ratio (also called debt-to-income): what percentage of your monthly income already goes to EMIs and repayments.",
    why: "Banks usually want it under 40–50%. It's often the real reason a loan gets rejected even with a good credit score.",
    tryIt: { href: "/loans", label: "See your FOIR gauge in the Loan Simulator" },
    searchQuery: "what is FOIR fixed obligation to income ratio in loans",
  },
  npa: {
    term: "NPA",
    what: "Non-Performing Asset — a loan where the borrower hasn't paid for 90+ days, so the bank must assume the money is likely lost.",
    why: "Rising NPAs are how banks get into trouble. It's the number regulators watch, and the number that can sink your virtual bank.",
    tryIt: { href: "/bank-game", label: "Watch NPAs sink a careless bank" },
    searchQuery: "what is NPA non performing asset in banking",
  },
  "credit-score": {
    term: "Credit score",
    what: "A number (300–900 in India, e.g. CIBIL) summarising how reliably you've repaid in the past. Above ~750 is considered strong.",
    why: "It decides whether you get loans and at what rate. One missed EMI can dent it for a year or more.",
    tryIt: { href: "/credit-score", label: "Move a score in the Credit Simulator" },
    searchQuery: "what is CIBIL credit score and how is it calculated",
  },
  utilisation: {
    term: "Credit utilisation",
    what: "How much of your credit-card limit you're actually using. ₹40,000 used on a ₹1,00,000 limit = 40% utilisation.",
    why: "Staying under ~30% signals control and helps your score; maxing the card hurts it fast — but recovers fast once paid down.",
    tryIt: { href: "/credit-score", label: "Max a virtual card and watch the score" },
    searchQuery: "what is credit utilisation ratio and ideal percentage",
  },
  fd: {
    term: "Fixed Deposit (FD)",
    what: "You lock a lump sum with a bank for a fixed period at a guaranteed interest rate (typically 6–7.5%).",
    why: "Zero drama, guaranteed return — but the money is locked, and after tax and inflation the real growth is small.",
    tryIt: { href: "/investments", label: "Compare FD against other options" },
    searchQuery: "what is fixed deposit FD how does it work",
  },
  rd: {
    term: "Recurring Deposit (RD)",
    what: "Like an FD, but you deposit a fixed amount every month instead of a lump sum. Great for saving toward a near-term goal.",
    why: "It's the safest way to turn 'I'll save monthly' into an enforced habit with a known payout date.",
    tryIt: { href: "/investments", label: "Compare RD in the Investment Simulator" },
    searchQuery: "what is recurring deposit RD how does it work",
  },
  "index-fund": {
    term: "Index fund",
    what: "A mutual fund that simply buys every company in a market index (like the Nifty 50) instead of trying to pick winners.",
    why: "Low fees, no guesswork, and historically ~11–13% long-run average in India — though with real year-to-year swings.",
    tryIt: { href: "/investments", label: "See index-fund growth vs FD" },
    searchQuery: "what is an index fund nifty 50 explained for beginners",
  },
  liquidity: {
    term: "Liquidity",
    what: "How quickly you can turn an investment back into spendable cash without losing value. A savings account is highly liquid; property is not.",
    why: "Emergencies don't wait for an FD to mature. Matching liquidity to your needs matters as much as returns.",
    tryIt: { href: "/investments", label: "Compare liquidity across instruments" },
    searchQuery: "what is liquidity in investments explained",
  },
  "real-value": {
    term: "Real value",
    what: "What your money is worth after subtracting inflation. ₹1,70,000 in 10 years might only buy what ₹95,000 buys today.",
    why: "It's the honest number. Nominal growth can look great while real growth is zero — or negative.",
    tryIt: { href: "/savings", label: "See the dashed real-value line" },
    searchQuery: "nominal vs real returns inflation adjusted explained",
  },
  tenure: {
    term: "Tenure",
    what: "How long you take to repay a loan. Longer tenure = smaller EMI but more total interest; shorter = bigger EMI, less interest overall.",
    why: "It's the biggest trade-off in borrowing, and the one banks rarely spell out.",
    tryIt: { href: "/loans", label: "Drag the tenure slider and watch both numbers" },
    searchQuery: "loan tenure effect on EMI and total interest",
  },
  principal: {
    term: "Principal",
    what: "The original amount — the sum you deposited (in savings) or borrowed (in a loan), before any interest.",
    why: "Every interest calculation starts here. In a loan's early years, shockingly little of your EMI reduces it.",
    tryIt: { href: "/loans", label: "See principal vs interest per year" },
    searchQuery: "what is principal amount in loan and investment",
  },
  amortization: {
    term: "Amortization",
    what: "The schedule showing how each EMI splits between interest and principal over the life of a loan — interest-heavy at first, principal-heavy at the end.",
    why: "Reading one is the fastest way to understand why loans cost so much and why prepaying early is powerful.",
    tryIt: { href: "/loans", label: "Open the year-by-year table" },
    searchQuery: "loan amortization schedule explained simply",
  },
  "roc-auc": {
    term: "ROC-AUC",
    what: "A score (0.5–1.0) for how well a model separates good borrowers from bad ones across all thresholds. 0.5 = coin flip, 1.0 = perfect.",
    why: "Accuracy alone can lie on imbalanced data; AUC is the fairer report-card number for models like these.",
    tryIt: { href: "/ml-demo", label: "See each model's AUC in the report card" },
    searchQuery: "what is ROC AUC in machine learning explained simply",
  },
} as const satisfies Record<string, GlossaryEntry>;

export type TermId = keyof typeof GLOSSARY;
