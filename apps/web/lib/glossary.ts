/**
 * Plain-language glossary (docs/01 §5: "jargon appears only alongside its
 * plain-language twin").
 *
 * Every entry answers the same four questions:
 *   what          — one-line definition (used by the chip popup preview)
 *   how           — the mechanism, in plain language
 *   example()     — a worked example whose numbers are computed live by
 *                   finance-core, so a page can never drift from the engine
 *   why           — the real-life consequence
 *   misconception — the mistake people actually make
 *
 * `example` is a function so the maths only runs on the term page, not on
 * every page that renders a chip.
 */

import {
  amortize,
  compareGrowth,
  compareInstruments,
  futurePricePaise,
  monthlyEmiPaise,
  paiseToRupees,
  purchasingPowerPaise,
  rupeesToPaise,
  simulateLoan,
} from "@banksim/finance-core";
import { formatMoney } from "@/lib/format";

/**
 * Declared explicitly rather than derived from GLOSSARY: entries reference
 * each other via `related`, which would make `keyof typeof GLOSSARY` a
 * circular type. The `satisfies Record<TermId, GlossaryEntry>` on GLOSSARY
 * keeps this list and the data in lockstep.
 */
export type TermId =
  | "sip"
  | "fd"
  | "rd"
  | "index-fund"
  | "liquidity"
  | "compound-interest"
  | "rule-of-72"
  | "inflation"
  | "real-value"
  | "emi"
  | "tenure"
  | "principal"
  | "amortization"
  | "foir"
  | "npa"
  | "credit-score"
  | "utilisation"
  | "roc-auc";

export type GlossaryCategory = "money" | "borrowing" | "investing" | "banking";

export const CATEGORY_LABELS: Record<GlossaryCategory, string> = {
  money: "Money basics",
  borrowing: "Borrowing",
  investing: "Investing",
  banking: "Banking & scoring",
};

export interface ExampleRow {
  label: string;
  value: string;
  /** Emphasise this row — it's the point of the example. */
  highlight?: boolean;
}

export interface WorkedExample {
  /** Framing sentence, e.g. "₹5,000 a month for 10 years at 12%". */
  setup: string;
  rows: ExampleRow[];
  /** The one sentence a reader should leave with. */
  takeaway: string;
}

export interface GlossaryEntry {
  term: string;
  category: GlossaryCategory;
  /** One-line definition — the chip popup preview. */
  what: string;
  /** The mechanism in plain language. */
  how: string;
  /** The real formula, rendered in the mono block. Omit where there isn't one. */
  formula?: string;
  example: () => WorkedExample;
  /** Why a learner should care — the real-life consequence. */
  why: string;
  misconception: { claim: string; truth: string };
  related: readonly TermId[];
  /** In-app page where this concept is live, with the example pre-filled. */
  tryIt?: { href: string; label: string };
  searchQuery: string;
}

const rs = (paise: number) => formatMoney(paiseToRupees(paise));

export const GLOSSARY = {
  /* ── Investing ─────────────────────────────────────────────── */

  sip: {
    term: "SIP",
    category: "investing",
    what: "A Systematic Investment Plan — a fixed amount invested into a mutual fund on a set schedule (usually monthly), instead of one lump sum.",
    how: "Each month's instalment buys units at that month's price and then starts compounding on its own clock. Your first instalment compounds for the full term; the last one compounds for barely a month. The final value is the sum of every instalment growing for a different length of time — which is why the total lands far above what you actually paid in.",
    formula:
      "Future value = M × [((1+r)^n − 1) / r] × (1+r)\n  M = monthly amount · r = annual return ÷ 12 · n = number of months",
    example: () => {
      const [mutual] = compareInstruments(["mutual"], {
        monthlyPaise: rupeesToPaise(5000),
        lumpSumPaise: 0,
        years: 10,
        inflationPct: 0,
      });
      const p = mutual!;
      const growth = p.expectedFinalPaise - p.investedPaise;
      return {
        setup: "₹5,000 every month for 10 years, at an assumed 12% annual return.",
        rows: [
          { label: "You actually invest (₹5,000 × 120 months)", value: rs(p.investedPaise) },
          { label: "It grows to", value: rs(p.expectedFinalPaise), highlight: true },
          { label: "Created purely by compounding", value: rs(growth), highlight: true },
        ],
        takeaway:
          "Nearly half the final amount is money you never deposited — it appeared because each instalment had time to grow.",
      };
    },
    why: "The discipline of investing every month matters more than timing the market perfectly. Almost all of the growth above comes from time in the market, not from picking the right month to start — and a monthly auto-debit removes the hardest part: remembering to do it.",
    misconception: {
      claim: "“I want to invest in a SIP.”",
      truth:
        "A SIP isn't an investment product at all — it's just a method of investing into a mutual fund. You choose a fund; SIP is simply the schedule you feed it on. Asking to \"buy a SIP\" is like asking to buy a standing instruction.",
    },
    related: ["index-fund", "compound-interest", "rd"],
    tryIt: { href: "/investments?monthly=5000&years=10", label: "Run this SIP in the Investment Simulator" },
    searchQuery: "what is SIP systematic investment plan explained simply",
  },

  fd: {
    term: "Fixed Deposit (FD)",
    category: "investing",
    what: "You lock a lump sum with a bank for a fixed period at a guaranteed interest rate (typically 6–7.5%).",
    how: "You hand the bank money for an agreed term. The bank pays a rate fixed on day one, no matter what happens to markets or rates afterwards. Break it early and you usually forfeit some interest as a penalty.",
    formula: "Maturity = P × (1 + r/n)^(n×t)   — compounded n times a year, usually quarterly",
    example: () => {
      const [fd] = compareInstruments(["fd"], {
        monthlyPaise: 0,
        lumpSumPaise: rupeesToPaise(100000),
        years: 5,
        inflationPct: 6,
      });
      const p = fd!;
      return {
        setup: "₹1,00,000 locked in an FD for 5 years at 6.5%, with inflation running at 6%.",
        rows: [
          { label: "Maturity amount", value: rs(p.expectedFinalPaise) },
          { label: "Interest earned", value: rs(p.expectedFinalPaise - p.investedPaise) },
          { label: "What it's actually worth (after 6% inflation)", value: rs(p.realFinalPaise), highlight: true },
        ],
        takeaway:
          "The number grew by a third, but its real buying power barely moved — a 6.5% return against 6% inflation is a 0.5% real gain, before tax.",
      };
    },
    why: "An FD is genuinely safe from market crashes, which makes it right for money you'll need soon. But safety has a price: once inflation and tax take their cut, an FD often just about preserves your money rather than growing it.",
    misconception: {
      claim: "“An FD is the safe option, so I can't lose.”",
      truth:
        "You can't lose rupees, but you can lose buying power. If the FD pays 6.5% and inflation is 6%, you're barely standing still — and if you're taxed at 30% on that interest, your real return is negative.",
    },
    related: ["rd", "real-value", "inflation", "liquidity"],
    tryIt: { href: "/investments?lump=100000&monthly=0&years=5", label: "Compare an FD against other options" },
    searchQuery: "what is fixed deposit FD how does it work",
  },

  rd: {
    term: "Recurring Deposit (RD)",
    category: "investing",
    what: "Like an FD, but you deposit a fixed amount every month instead of a lump sum.",
    how: "Each monthly deposit earns interest from the day it lands until maturity — so like a SIP, every instalment compounds for a different length of time. Unlike a SIP, the rate is fixed and guaranteed, so there's no market risk and no surprise.",
    formula: "Maturity = Σ of each deposit compounded for its own remaining months",
    example: () => {
      const [rd] = compareInstruments(["rd"], {
        monthlyPaise: rupeesToPaise(3000),
        lumpSumPaise: 0,
        years: 3,
        inflationPct: 0,
      });
      const p = rd!;
      return {
        setup: "₹3,000 every month into an RD for 3 years at 6%.",
        rows: [
          { label: "You deposit (₹3,000 × 36)", value: rs(p.investedPaise) },
          { label: "Maturity amount", value: rs(p.expectedFinalPaise), highlight: true },
          { label: "Interest earned", value: rs(p.expectedFinalPaise - p.investedPaise) },
        ],
        takeaway:
          "Modest growth — but the payout date and amount are known on day one, which is exactly what a short-term goal needs.",
      };
    },
    why: "An RD is the safest way to turn “I'll save monthly” into an enforced habit with a known payout date. For a goal under two years — a phone, a trip, an emergency buffer — that certainty beats a higher, wobblier return.",
    misconception: {
      claim: "“An RD and a SIP are basically the same thing.”",
      truth:
        "Both are monthly, but an RD's return is guaranteed and fixed (~6%), while a SIP's rides the market (historically ~12%, with real dips along the way). Use an RD when you can't afford a dip; use a SIP when you have years to ride one out.",
    },
    related: ["sip", "fd", "liquidity"],
    tryIt: { href: "/investments?monthly=3000&years=3", label: "Compare an RD in the Investment Simulator" },
    searchQuery: "what is recurring deposit RD how does it work",
  },

  "index-fund": {
    term: "Index fund",
    category: "investing",
    what: "A mutual fund that simply buys every company in a market index (like the Nifty 50) instead of trying to pick winners.",
    how: "Rather than paying a manager to guess which stocks will win, the fund mechanically holds all of them in the index's proportions. That means almost no research cost, so fees are a fraction of an actively managed fund's — and over decades, those saved fees compound into a large difference.",
    example: () => {
      const [idx] = compareInstruments(["mutual"], {
        monthlyPaise: rupeesToPaise(5000),
        lumpSumPaise: 0,
        years: 20,
        inflationPct: 6,
      });
      const p = idx!;
      const last = p.points[p.points.length - 1]!;
      return {
        setup: "₹5,000 monthly into an index fund for 20 years (12% long-run average, ±18% volatility).",
        rows: [
          { label: "You invest", value: rs(p.investedPaise) },
          { label: "Expected value", value: rs(p.expectedFinalPaise), highlight: true },
          { label: "If markets run cold (−1σ)", value: rs(last.lowPaise) },
          { label: "If markets run hot (+1σ)", value: rs(last.highPaise) },
        ],
        takeaway:
          "The gap between the cold and hot outcomes is enormous — that spread is what “risk” actually means, and it's why equity needs years, not months.",
      };
    },
    why: "Most actively managed funds fail to beat their index over long periods, once fees are counted. An index fund is the boring default that quietly wins by not trying to be clever — and it's why “just buy the index” is the most common advice given to beginners worldwide.",
    misconception: {
      claim: "“The historical average is 12%, so I'll get about 12% a year.”",
      truth:
        "An average is not a schedule. A fund averaging 12% over 20 years might do +30% one year and −20% the next. The average only shows up if you stay invested through the bad years — which is exactly when people sell.",
    },
    related: ["sip", "liquidity", "compound-interest"],
    tryIt: { href: "/investments?monthly=5000&years=20", label: "See index growth vs FD and gold" },
    searchQuery: "what is an index fund nifty 50 explained for beginners",
  },

  liquidity: {
    term: "Liquidity",
    category: "investing",
    what: "How quickly you can turn an investment back into spendable cash without losing value.",
    how: "Liquidity is a spectrum, not a yes/no. A savings account is instant. Stocks take a couple of days. An FD is technically breakable but charges you a penalty. Property can take months and a large discount if you're in a hurry. The less liquid something is, the more return it usually has to promise you to compensate.",
    example: () => ({
      setup: "You need ₹50,000 tomorrow for an emergency. Where is your money?",
      rows: [
        { label: "Savings account", value: "Instant · full value" },
        { label: "Index fund", value: "2–3 days · whatever the market says today" },
        { label: "Fixed deposit", value: "Same day · minus a penalty on the interest" },
        { label: "Property", value: "Weeks to months · likely a discount to sell fast", highlight: true },
      ],
      takeaway:
        "The highest-returning place for your money is often the worst place for money you might suddenly need.",
    }),
    why: "Emergencies don't wait for an FD to mature or for the market to recover. This is why an emergency fund lives in boring, instantly-accessible places even though that “wastes” return — its job is availability, not growth.",
    misconception: {
      claim: "“I'll just pull money out of my investments if something comes up.”",
      truth:
        "Emergencies have a cruel habit of arriving when markets are down — job losses and crashes are correlated. Selling then locks in a loss at the worst possible moment, which is precisely what a liquid emergency fund exists to prevent.",
    },
    related: ["fd", "index-fund", "real-value"],
    tryIt: { href: "/investments", label: "Compare liquidity across instruments" },
    searchQuery: "what is liquidity in investments explained",
  },

  /* ── Money basics ──────────────────────────────────────────── */

  "compound-interest": {
    term: "Compound interest",
    category: "money",
    what: "Interest that earns its own interest — each period's interest joins your balance, so the next period is calculated on a bigger number.",
    how: "Simple interest always pays on your original deposit, so it draws a straight line. Compound interest folds each payment back into the balance, so the base itself keeps growing. Early on the difference is invisible; later it becomes the whole story, because you're earning on money the interest itself created.",
    formula: "Compound: A = P × (1 + r/n)^(n×t)\nSimple:   A = P × (1 + r×t)",
    example: () => {
      const r = compareGrowth({
        principalPaise: rupeesToPaise(10000),
        annualRatePct: 8,
        years: 20,
        compounding: "yearly",
      });
      const y5 = r.yearly[5]!;
      return {
        setup: "₹10,000 left alone at 8% for 20 years.",
        rows: [
          { label: "After 5 years — the gap so far", value: rs(y5.gapPaise) },
          { label: "With simple interest, after 20 years", value: rs(r.finalSimplePaise) },
          { label: "With compound interest, after 20 years", value: rs(r.finalCompoundPaise), highlight: true },
          { label: "Earned by the interest itself", value: rs(r.gapPaise), highlight: true },
        ],
        takeaway:
          "After 5 years the gap is pocket change. After 20, compounding has produced more than the original deposit — from nothing but patience.",
      };
    },
    why: "This single idea explains most of personal finance: why starting at 22 beats starting at 32 even if you save less, and why a credit-card balance you “only pay the minimum on” can outrun your salary. It's the same maths pointed in opposite directions.",
    misconception: {
      claim: "“Compounding is something that kicks in later, so there's no rush.”",
      truth:
        "It's the reverse: the later years are only big because the early years happened. Delaying by 5 years doesn't cost you 5 years of growth — it removes the 5 most powerful years, the ones at the far end of the curve.",
    },
    related: ["rule-of-72", "sip", "principal", "inflation"],
    tryIt: { href: "/compound-interest?principal=10000&rate=8&years=20", label: "Watch the curve open up" },
    searchQuery: "compound interest explained simply with example",
  },

  "rule-of-72": {
    term: "Rule of 72",
    category: "money",
    what: "A mental shortcut: divide 72 by the interest rate to estimate how many years your money takes to double.",
    how: "It's a rough approximation of the real doubling formula (ln 2 ÷ ln(1+r)), and it's accurate enough for mental maths at everyday rates. Its value isn't precision — it's that it turns an abstract percentage into a number of years you can actually picture.",
    formula: "Years to double ≈ 72 ÷ interest rate\nExact: ln(2) ÷ ln(1 + r)",
    example: () => {
      const at8 = compareGrowth({ principalPaise: rupeesToPaise(10000), annualRatePct: 8, years: 9, compounding: "yearly" });
      const at12 = compareGrowth({ principalPaise: rupeesToPaise(10000), annualRatePct: 12, years: 6, compounding: "yearly" });
      return {
        setup: "How long until ₹10,000 becomes ₹20,000?",
        rows: [
          { label: "At 8% — the rule says 72 ÷ 8", value: "9 years" },
          { label: "…and ₹10,000 after 9 years is actually", value: rs(at8.finalCompoundPaise), highlight: true },
          { label: "At 12% — the rule says 72 ÷ 12", value: "6 years" },
          { label: "…and ₹10,000 after 6 years is actually", value: rs(at12.finalCompoundPaise), highlight: true },
        ],
        takeaway:
          "Both land within a whisker of ₹20,000 — good enough to do in your head, and it makes the cost of a low rate obvious.",
      };
    },
    why: "It reframes rates into human time. “4% vs 8%” sounds like a small difference; “doubles in 18 years vs doubles in 9” does not. Same for debt — a 36% credit card doubles what you owe in about two years.",
    misconception: {
      claim: "“It's just a rough trick, so the real difference must be small.”",
      truth:
        "The approximation is small; the difference it reveals is not. Over 36 years, money doubling every 9 years multiplies 16×, while doubling every 18 years multiplies only 4×. A 2× difference in rate is a 4× difference in outcome.",
    },
    related: ["compound-interest", "inflation"],
    tryIt: { href: "/compound-interest?rate=8&years=20", label: "Check the rule against the real curve" },
    searchQuery: "rule of 72 doubling money explained",
  },

  inflation: {
    term: "Inflation",
    category: "money",
    what: "The gradual loss of what a fixed amount of money can buy.",
    how: "Prices drift upward a few percent each year, so the same note buys a slightly smaller pile of things every year. Nothing happens to the number in your account — the change is entirely on the price tags. Run it for a decade and the effect is brutal, because it compounds just like interest does.",
    formula:
      "Buying power = Amount ÷ (1 + i)^years\nFuture price  = Amount × (1 + i)^years",
    example: () => {
      const power = purchasingPowerPaise(rupeesToPaise(1000), 6, 10);
      const price = futurePricePaise(rupeesToPaise(1000), 6, 10);
      const samosa = futurePricePaise(rupeesToPaise(15), 6, 10);
      return {
        setup: "₹1,000, at 6% average inflation, over 10 years.",
        rows: [
          { label: "In 10 years, ₹1,000 buys only what this buys today", value: rs(power), highlight: true },
          { label: "To buy today's ₹1,000 of things, you'd need", value: rs(price), highlight: true },
          { label: "A ₹15 samosa would cost", value: rs(samosa) },
        ],
        takeaway:
          "Your ₹1,000 note is still a ₹1,000 note. It just quietly lost 44% of its power while sitting still.",
      };
    },
    why: "Money sitting idle isn't “safe” — it's losing value even while the number in your account stays the same. This is the reason a savings account paying 3% is a guaranteed slow loss, and why any return below inflation is a loss dressed as a gain.",
    misconception: {
      claim: "“If my salary raises match inflation, I'm fine.”",
      truth:
        "Not quite. Education and healthcare routinely inflate faster than the headline average — often 8–10% while the general rate is 6%. A raise matching the average still means falling behind on exactly the things that matter most.",
    },
    related: ["real-value", "compound-interest", "fd"],
    tryIt: { href: "/inflation?amount=1000&infl=6&years=10", label: "Watch ₹1,000 shrink" },
    searchQuery: "what is inflation and how does it reduce purchasing power",
  },

  "real-value": {
    term: "Real value",
    category: "money",
    what: "What your money is worth after subtracting inflation — the honest number.",
    how: "Nominal value is the digits in your account. Real value asks what those digits can actually buy, by deflating them back to today's prices. The difference between a nominal and a real return is the difference between feeling richer and being richer.",
    formula: "Real value = Nominal ÷ (1 + inflation)^years\nReal return ≈ nominal return − inflation",
    example: () => {
      const [fd] = compareInstruments(["fd"], {
        monthlyPaise: rupeesToPaise(5000),
        lumpSumPaise: 0,
        years: 20,
        inflationPct: 6,
      });
      const p = fd!;
      return {
        setup: "₹5,000 a month into an FD at 6.5% for 20 years, with 6% inflation.",
        rows: [
          { label: "You deposit", value: rs(p.investedPaise) },
          { label: "It grows to (the number you'd celebrate)", value: rs(p.expectedFinalPaise) },
          { label: "What it's actually worth in today's money", value: rs(p.realFinalPaise), highlight: true },
        ],
        takeaway:
          "Two decades of disciplined saving, and the real gain over what you deposited is thin — because 6.5% barely outruns 6%.",
      };
    },
    why: "It's the only number that tells the truth. Nominal growth can look spectacular while real growth is zero or negative — which is exactly how “safe” savings quietly fail people over decades.",
    misconception: {
      claim: "“My money grew from ₹10L to ₹18L, so I made ₹8L.”",
      truth:
        "You made ₹8L of digits. If prices also rose over that period, the real gain is far smaller — and if the growth rate was below inflation, you actually got poorer while the number went up.",
    },
    related: ["inflation", "fd", "liquidity"],
    tryIt: { href: "/savings?monthly=5000&years=20&infl=6", label: "See the dashed real-value line" },
    searchQuery: "nominal vs real returns inflation adjusted explained",
  },

  /* ── Borrowing ─────────────────────────────────────────────── */

  emi: {
    term: "EMI",
    category: "borrowing",
    what: "Equated Monthly Instalment — the fixed monthly payment that clears a loan's principal and interest over its tenure.",
    how: "The bank calculates one payment that, repeated every month for the whole tenure, exactly clears the debt. The payment never changes, but its composition does: interest is charged on the outstanding balance, so early EMIs are mostly interest and barely dent what you owe. Only in later years does the split flip.",
    formula: "E = P × r × (1+r)^n / [(1+r)^n − 1]\n  P = loan · r = annual rate ÷ 12 · n = months",
    example: () => {
      const P = rupeesToPaise(1000000);
      const short = monthlyEmiPaise(P, 10, 84);
      const long = monthlyEmiPaise(P, 10, 240);
      const shortInterest = short * 84 - P;
      const longInterest = long * 240 - P;
      return {
        setup: "A ₹10,00,000 loan at 10% — the same loan, over 7 years vs 20 years.",
        rows: [
          { label: "Over 7 years — EMI", value: `${rs(short)}/mo` },
          { label: "Over 7 years — total interest", value: rs(shortInterest) },
          { label: "Over 20 years — EMI (looks affordable!)", value: `${rs(long)}/mo`, highlight: true },
          { label: "Over 20 years — total interest", value: rs(longInterest), highlight: true },
        ],
        takeaway:
          "Stretching the tenure cuts the monthly payment by about 42% — and more than triples the interest you hand over.",
      };
    },
    why: "The same loan amount can have wildly different real costs depending on tenure. The EMI is the number everyone shops on, but it's the number that hides the cost — which is exactly why lenders advertise it.",
    misconception: {
      claim: "“A lower EMI means a cheaper loan.”",
      truth:
        "Usually it just means a longer tenure. In the example above the “affordable” option costs over ₹9 lakh more. Compare total interest, not the monthly number.",
    },
    related: ["tenure", "principal", "amortization", "foir"],
    tryIt: { href: "/loans?amount=1000000&rate=10&months=84", label: "Run this loan in the Loan Simulator" },
    searchQuery: "what is EMI equated monthly installment how is it calculated",
  },

  tenure: {
    term: "Tenure",
    category: "borrowing",
    what: "How long you take to repay a loan — the single biggest lever on what it costs you.",
    how: "Tenure decides how many times interest gets charged on your outstanding balance. Double the tenure and you roughly halve the monthly payment, because you're spreading the principal over twice as many months — but you also keep paying interest for twice as long, on a balance that shrinks far more slowly.",
    example: () => {
      const P = rupeesToPaise(500000);
      const rows: ExampleRow[] = [3, 5, 10].map((y) => {
        const emi = monthlyEmiPaise(P, 10, y * 12);
        const interest = emi * y * 12 - P;
        return {
          label: `${y} years — EMI ${rs(emi)}/mo`,
          value: `${rs(interest)} interest`,
          highlight: y === 10,
        };
      });
      return {
        setup: "A ₹5,00,000 loan at 10%, repaid over 3, 5 or 10 years.",
        rows,
        takeaway:
          "Same loan, same rate. The only thing that changed was patience — and it cost over three times as much interest.",
      };
    },
    why: "Tenure is where a comfortable-looking loan turns expensive. Lenders happily offer longer tenures because it lowers the EMI you're judging them on while raising what you'll ultimately pay them.",
    misconception: {
      claim: "“A longer tenure gives me flexibility — I'll just prepay early.”",
      truth:
        "Good intention, rarely executed. And because early EMIs are mostly interest, a long tenure front-loads the lender's profit: by the time you get around to prepaying, you've already paid much of the interest anyway.",
    },
    related: ["emi", "amortization", "principal"],
    tryIt: { href: "/loans?amount=500000&rate=10&months=120", label: "Drag the tenure slider and watch both numbers" },
    searchQuery: "loan tenure effect on EMI and total interest",
  },

  principal: {
    term: "Principal",
    category: "borrowing",
    what: "The original amount — the sum you deposited (in savings) or borrowed (in a loan), before any interest.",
    how: "Every interest calculation starts from the principal. In a loan it's the balance that interest is charged on, so it's also the thing you're trying to kill: the faster the principal falls, the less interest accrues. In savings it's the seed the whole compounding curve grows from.",
    example: () => {
      const P = rupeesToPaise(500000);
      const { schedule } = amortize(P, 10, 60);
      const first = schedule[0]!;
      const last = schedule[schedule.length - 1]!;
      return {
        setup: "A ₹5,00,000 loan at 10% over 5 years — where does the very first EMI go?",
        rows: [
          { label: "Month 1 — interest portion", value: rs(first.interestPaise), highlight: true },
          { label: "Month 1 — principal portion", value: rs(first.principalPaise), highlight: true },
          { label: "Month 60 — interest portion", value: rs(last.interestPaise) },
          { label: "Month 60 — principal portion", value: rs(last.principalPaise) },
        ],
        takeaway:
          "Your first payment is nearly half interest. Your last is almost all principal. Same EMI, opposite jobs.",
      };
    },
    why: "Understanding principal is what makes prepayment click. Any extra rupee you throw at a loan goes straight to principal — which cancels every future interest charge that rupee would have attracted. That's why prepaying early is worth so much more than prepaying late.",
    misconception: {
      claim: "“I've paid half my EMIs, so I must have repaid about half the loan.”",
      truth:
        "Not close. Because early EMIs are interest-heavy, you're typically well under a third of the way through the principal at the halfway point of a long loan. Check an amortization schedule and the gap is genuinely shocking.",
    },
    related: ["emi", "amortization", "tenure", "compound-interest"],
    tryIt: { href: "/loans?amount=500000&rate=10&months=60", label: "See principal vs interest per year" },
    searchQuery: "what is principal amount in loan and investment",
  },

  amortization: {
    term: "Amortization",
    category: "borrowing",
    what: "The schedule showing how each EMI splits between interest and principal over the life of a loan.",
    how: "Each month the bank charges interest on whatever you still owe. Whatever's left of your EMI after that goes to principal. Because the balance is huge at the start, interest eats most of the payment; as the balance falls, interest shrinks and principal takes over. The schedule is just that arithmetic, month by month.",
    formula: "Interest_month = balance × r\nPrincipal_month = EMI − Interest_month\nbalance −= Principal_month",
    example: () => {
      const P = rupeesToPaise(1000000);
      const { schedule } = amortize(P, 10, 240);
      const halfway = schedule[119]!;
      const paidPrincipal = P - halfway.balancePaise;
      return {
        setup: "A ₹10,00,000 loan at 10% over 20 years — how far along are you at the halfway mark (month 120)?",
        rows: [
          { label: "EMIs paid", value: "120 of 240 (50%)" },
          { label: "Principal actually repaid", value: rs(paidPrincipal), highlight: true },
          { label: "Still owed", value: rs(halfway.balancePaise), highlight: true },
        ],
        takeaway:
          "Halfway through the payments, you've cleared well under half the debt. The interest went first.",
      };
    },
    why: "Reading one amortization schedule teaches more than any article about loans. It's the moment you see that “paying my EMI every month” and “paying off my loan” are not the same activity for the first several years.",
    misconception: {
      claim: "“Prepaying later is fine — the loan's the same size either way.”",
      truth:
        "Prepaying early kills interest that hasn't been charged yet, across every remaining month. Prepaying in the final years saves almost nothing, because by then you're mostly paying principal anyway. Timing is everything.",
    },
    related: ["emi", "principal", "tenure"],
    tryIt: { href: "/loans?amount=1000000&rate=10&months=240", label: "Open the year-by-year table" },
    searchQuery: "loan amortization schedule explained simply",
  },

  foir: {
    term: "FOIR / DTI",
    category: "borrowing",
    what: "Fixed Obligation to Income Ratio (also called debt-to-income): what percentage of your monthly income already goes to EMIs and repayments.",
    how: "Add up every fixed monthly obligation — existing EMIs plus the new one you're asking for — and divide by your monthly income. Lenders use it as a blunt affordability test: it doesn't care how wealthy you are, only how much of each month's income is already spoken for before you've eaten.",
    formula: "FOIR = (existing EMIs + new EMI) ÷ monthly income × 100",
    example: () => {
      const r = simulateLoan({
        principalPaise: rupeesToPaise(500000),
        annualRatePct: 10,
        months: 60,
        monthlyIncomePaise: rupeesToPaise(60000),
        monthlyExpensesPaise: rupeesToPaise(20000),
        existingEmiPaise: rupeesToPaise(15000),
        creditScore: 780,
        employment: "salaried",
      });
      return {
        setup: "₹60,000 income, an existing ₹15,000 EMI, now asking for a ₹5,00,000 loan at 10% over 5 years.",
        rows: [
          { label: "New EMI", value: `${rs(r.emiPaise)}/mo` },
          { label: "Total obligations ÷ income", value: `${r.foirPct.toFixed(0)}%`, highlight: true },
          { label: "Typical bank comfort limit", value: "40–50%" },
          { label: "Verdict from our estimator", value: `${r.risk} risk · ${r.approvalScore}/100` },
        ],
        takeaway:
          "An excellent credit score of 780 doesn't rescue this — over a quarter of income is already committed before the new loan, and FOIR is what lenders actually squeeze.",
      };
    },
    why: "This is often the real reason a loan gets rejected even with a spotless credit score. A great score says you repay reliably; FOIR asks whether there's any money left to repay with. Both have to pass.",
    misconception: {
      claim: "“My credit score is 800, so I'll get approved.”",
      truth:
        "A high score and a high FOIR get rejected all the time. Lenders are testing capacity, not just character — if 60% of your income is already going to EMIs, no score makes the arithmetic work.",
    },
    related: ["emi", "credit-score", "tenure"],
    tryIt: { href: "/loans?amount=500000&rate=10&months=60&income=60000&existing=15000", label: "See this FOIR gauge live" },
    searchQuery: "what is FOIR fixed obligation to income ratio in loans",
  },

  /* ── Banking & scoring ─────────────────────────────────────── */

  npa: {
    term: "NPA",
    category: "banking",
    what: "Non-Performing Asset — a loan where the borrower has missed payments for a set period (typically 90+ days). It's a term from the bank's side, not the borrower's.",
    how: "Once payments stop for that long, the bank can no longer count the loan as a healthy asset — it must classify it as non-performing and set aside capital against the likely loss. The NPA ratio is simply the share of the loan book in that state.",
    formula: "NPA ratio = value of bad loans ÷ total loan book × 100",
    example: () => ({
      setup: "A bank has lent out ₹100 crore. ₹8 crore of it has gone unpaid past 90 days.",
      rows: [
        { label: "Total loan book", value: "₹100 crore" },
        { label: "Unpaid past the threshold", value: "₹8 crore" },
        { label: "NPA ratio", value: "8%", highlight: true },
        { label: "Roughly where regulators get nervous", value: "above ~5–6%" },
      ],
      takeaway:
        "Eight bad loans in every hundred rupees lent is enough to threaten a bank — the margins on the other 92 are thin.",
    }),
    why: "This is exactly what's eating your capital in the Bank Manager game — every default you approve pushes the ratio up, and too high a ratio is what actually ends the game. In the real world, it's the number regulators watch and the metric that has sunk real banks.",
    misconception: {
      claim: "“So the safe strategy is to reject every risky applicant.”",
      truth:
        "That's its own kind of failure. A bank that never lends earns no interest income while still paying interest on deposits — it bleeds out slowly instead of quickly. Good banking is pricing risk correctly, not avoiding it.",
    },
    related: ["credit-score", "foir", "principal"],
    tryIt: { href: "/bank-game", label: "Watch NPAs sink a careless bank" },
    searchQuery: "what is NPA non performing asset in banking",
  },

  "credit-score": {
    term: "Credit score",
    category: "banking",
    what: "A number (300–900 in India, e.g. CIBIL) summarising how reliably you've repaid in the past. Above ~750 is considered strong.",
    how: "Bureaus collect your repayment record from lenders and compress it into one number using weighted factors — payment history counts most (~35%), then how much of your credit limit you use (~30%), then how long your history is, your mix of credit types, and how often you've applied recently.",
    formula: "score ≈ payment history (35%) + utilisation (30%) + age (15%) + mix (10%) + inquiries (10%)",
    example: () => ({
      setup: "What each band typically unlocks in India.",
      rows: [
        { label: "750–900", value: "Approved easily, best rates", highlight: true },
        { label: "700–749", value: "Usually approved, ordinary rates" },
        { label: "650–699", value: "Approved with higher rates" },
        { label: "Below 650", value: "Frequent rejections", highlight: true },
      ],
      takeaway:
        "The gap between 700 and 780 isn't approval vs rejection — it's the interest rate, which over a home loan is worth lakhs.",
    }),
    why: "It decides whether you get loans and at what price. A single missed EMI can dent it for a year or more, and the dent shows up years later as a worse rate on something that actually matters — a home loan.",
    misconception: {
      claim: "“I've never taken a loan, so my score must be excellent.”",
      truth:
        "No history is not good history. A thin file gives lenders nothing to judge, so “new to credit” often scores mid-600s. Ironically, you build a score by responsibly using credit, not by avoiding it entirely.",
    },
    related: ["utilisation", "foir", "npa"],
    tryIt: { href: "/credit-score", label: "Move a score in the Credit Simulator" },
    searchQuery: "what is CIBIL credit score and how is it calculated",
  },

  utilisation: {
    term: "Credit utilisation",
    category: "banking",
    what: "How much of your credit-card limit you're actually using. ₹40,000 spent against a ₹1,00,000 limit is 40% utilisation.",
    how: "Bureaus read high utilisation as strain — someone leaning on their limit looks closer to trouble than someone who barely touches it. Unlike payment history, it's measured on your current balance, so it updates the moment your statement does.",
    formula: "Utilisation = balance ÷ credit limit × 100",
    example: () => ({
      setup: "A ₹1,00,000 credit limit, and what each balance signals.",
      rows: [
        { label: "₹10,000 used → 10%", value: "Ideal — reads as control", highlight: true },
        { label: "₹30,000 used → 30%", value: "The usual comfort ceiling" },
        { label: "₹80,000 used → 80%", value: "Hurts the score noticeably", highlight: true },
        { label: "Paid down to ₹10,000", value: "Recovers within a statement cycle" },
      ],
      takeaway:
        "Utilisation is the one big factor you can fix this month — pay the balance down and the score responds almost immediately.",
    }),
    why: "It's 30% of your score and the fastest lever you control. Miss an EMI and you wait a year for forgiveness; max out a card and you can undo it before the next statement. Knowing which mistakes are reversible is half of managing credit.",
    misconception: {
      claim: "“I pay my card in full every month, so my utilisation is 0%.”",
      truth:
        "Bureaus usually see the balance on your statement date, not after you pay. Spend ₹80,000 and clear it dutifully, and a 80% utilisation may still get reported. Paying before the statement generates — or asking for a higher limit — is what actually moves it.",
    },
    related: ["credit-score", "compound-interest"],
    tryIt: { href: "/credit-score", label: "Max a virtual card and watch the score" },
    searchQuery: "what is credit utilisation ratio and ideal percentage",
  },

  "roc-auc": {
    term: "ROC-AUC",
    category: "banking",
    what: "A score from 0.5 to 1.0 for how well a model separates good borrowers from bad ones across every possible cut-off. 0.5 is a coin flip; 1.0 is perfect.",
    how: "Pick a random good borrower and a random bad one. AUC is the probability the model gives the good one a higher score. Because it sweeps every threshold, it measures the ranking itself rather than the arbitrary line you draw for approve/decline.",
    example: () => ({
      setup: "Why plain accuracy misleads when 70% of applicants are creditworthy.",
      rows: [
        { label: "A model that blindly approves everyone", value: "70% accuracy — and useless" },
        { label: "…its AUC", value: "0.50 — exposed as a coin flip", highlight: true },
        { label: "Our Logistic Regression", value: "~0.82 AUC" },
        { label: "Our XGBoost", value: "~0.76 AUC", highlight: true },
      ],
      takeaway:
        "Accuracy rewarded the useless model. AUC caught it — which is why it's the number on the report card.",
    }),
    why: "In lending, the data is lopsided: most people repay. A model can look impressive on accuracy while having learned nothing at all. AUC is the honest report card, which matters enormously when a model's output decides whether someone gets a loan.",
    misconception: {
      claim: "“The model is 78% accurate, so it's right 78% of the time about me.”",
      truth:
        "Accuracy is an average over a whole population, not a promise about any individual. And a high AUC says nothing about whether the model is fair — a model can rank beautifully while encoding historical bias.",
    },
    related: ["credit-score", "npa"],
    tryIt: { href: "/ml-demo", label: "See each model's AUC in the report card" },
    searchQuery: "what is ROC AUC in machine learning explained simply",
  },
} as const satisfies Record<TermId, GlossaryEntry>;

export const TERM_IDS = Object.keys(GLOSSARY) as TermId[];

export function getTerm(slug: string): GlossaryEntry | undefined {
  return (GLOSSARY as Record<string, GlossaryEntry | undefined>)[slug];
}

/** Terms grouped by category, for the index page. */
export function termsByCategory(): { category: GlossaryCategory; ids: TermId[] }[] {
  const order: GlossaryCategory[] = ["money", "borrowing", "investing", "banking"];
  return order.map((category) => ({
    category,
    ids: TERM_IDS.filter((id) => GLOSSARY[id].category === category),
  }));
}
