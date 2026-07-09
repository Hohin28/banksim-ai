import type { DemoKey } from "@/components/lessons/demos";
import type { QuizQuestion } from "@/components/lessons/quiz";
import type { ReactNode } from "react";

/**
 * Lessons are typed data, not MDX (docs/08 note: chosen over an MDX toolchain
 * to stay type-safe and avoid Turbopack MDX friction — MDX can be adopted
 * later without changing the renderer contract). Each lesson is a sequence of
 * blocks ending in a quiz.
 */
export type LessonBlock =
  | { kind: "prose"; body: ReactNode }
  | { kind: "callout"; title: string; body: ReactNode }
  | { kind: "demo"; demo: DemoKey };

export interface Lesson {
  slug: string;
  title: string;
  emoji: string;
  summary: string;
  minutes: number;
  blocks: LessonBlock[];
  quiz: QuizQuestion[];
}

const savings: Lesson = {
  slug: "savings",
  title: "Savings & how money grows",
  emoji: "💰",
  summary: "Why a little, saved regularly, becomes a lot.",
  minutes: 5,
  blocks: [
    {
      kind: "prose",
      body: (
        <>
          <p>
            A savings account does something quietly powerful: it pays you a
            small percentage — the <strong>interest rate</strong> — on the
            money you keep in it. Leave the money there and that interest is
            added to your balance, which then earns interest too.
          </p>
          <p>
            The three levers that decide how much you end up with are: how much
            you put in, the interest rate, and — the one people underestimate
            most — <strong>time</strong>.
          </p>
        </>
      ),
    },
    { kind: "demo", demo: "savings" },
    {
      kind: "callout",
      title: "The quiet lever is time",
      body: (
        <>
          Try dragging the years slider above. Notice that going from 10 to 20
          years more than doubles your final amount, even though you only
          doubled the time — because the later years are earning interest on a
          much bigger balance.
        </>
      ),
    },
    {
      kind: "prose",
      body: (
        <p>
          This is why &ldquo;start early&rdquo; is the most repeated piece of
          money advice there is. Someone who saves a small amount from age 20
          often ends up ahead of someone who saves much more but starts at 35 —
          time did the heavy lifting.
        </p>
      ),
    },
  ],
  quiz: [
    {
      id: "s1",
      question: "Which of these usually matters most for how much your savings grow?",
      options: ["The bank's logo", "How long you leave the money invested", "The colour of your debit card"],
      correct: 1,
      explanation: "Time is the most underestimated lever — later years compound on a much larger balance.",
    },
    {
      id: "s2",
      question: "Interest that itself starts earning interest is called…",
      options: ["Simple interest", "Compound interest", "Inflation"],
      correct: 1,
      explanation: "Compound interest is interest earning interest — the engine behind long-term growth.",
    },
    {
      id: "s3",
      question: "You save ₹2,000/month at 7%. Roughly what makes the final amount bigger over 20 years vs 10?",
      options: ["Only the extra deposits", "The extra deposits AND interest on the whole growing balance", "Nothing changes"],
      correct: 1,
      explanation: "Both — you deposit more and the bigger balance earns more interest each year.",
    },
  ],
};

const interest: Lesson = {
  slug: "interest",
  title: "Simple vs compound interest",
  emoji: "📈",
  summary: "The single idea that explains most of personal finance.",
  minutes: 6,
  blocks: [
    {
      kind: "prose",
      body: (
        <>
          <p>
            <strong>Simple interest</strong> pays you a fixed amount each year,
            calculated only on your original deposit. Put in ₹10,000 at 8% and
            you get ₹800 every year — forever the same.
          </p>
          <p>
            <strong>Compound interest</strong> is different: each year&rsquo;s
            interest joins your balance and starts earning too. The growth
            curves upward instead of running in a straight line.
          </p>
        </>
      ),
    },
    { kind: "demo", demo: "compound" },
    {
      kind: "callout",
      title: "The Rule of 72",
      body: (
        <>
          A quick trick: divide 72 by the interest rate to estimate how many
          years it takes your money to double. At 8%, that&rsquo;s 72 ÷ 8 = 9
          years. At 12%, just 6 years. Higher rates double your money far
          faster.
        </>
      ),
    },
    {
      kind: "prose",
      body: (
        <p>
          Compounding is a double-edged sword. It works <em>for</em> you in
          savings and investments — and <em>against</em> you on credit-card
          debt, where the interest you owe compounds the same way. Same maths,
          opposite direction.
        </p>
      ),
    },
  ],
  quiz: [
    {
      id: "i1",
      question: "With simple interest, the interest each year is calculated on…",
      options: ["The original amount only", "The growing balance", "A random number"],
      correct: 0,
      explanation: "Simple interest only ever uses the original principal, so it's a straight line.",
    },
    {
      id: "i2",
      question: "By the Rule of 72, money at 6% roughly doubles in…",
      options: ["6 years", "12 years", "24 years"],
      correct: 1,
      explanation: "72 ÷ 6 = 12 years. It's an estimate, but a remarkably good one.",
    },
    {
      id: "i3",
      question: "Compound interest works against you when…",
      options: ["You save in a bank", "You carry credit-card debt", "You never borrow"],
      correct: 1,
      explanation: "Debt compounds too — unpaid card balances grow the same way savings do.",
    },
  ],
};

const loans: Lesson = {
  slug: "loans",
  title: "Loans, EMIs & the cost of borrowing",
  emoji: "🏦",
  summary: "Why a ₹5 lakh loan can cost ₹7 lakh to repay.",
  minutes: 7,
  blocks: [
    {
      kind: "prose",
      body: (
        <>
          <p>
            When you borrow, you repay in fixed monthly instalments called{" "}
            <strong>EMIs</strong> (Equated Monthly Instalments). Each EMI is
            part repayment of what you borrowed (the principal) and part{" "}
            <strong>interest</strong> — the lender&rsquo;s charge for lending.
          </p>
          <p>
            Two things drive the total cost: the interest rate, and the{" "}
            <strong>tenure</strong> (how long you take to repay). A longer
            tenure means smaller EMIs but more total interest.
          </p>
        </>
      ),
    },
    { kind: "demo", demo: "emi" },
    {
      kind: "callout",
      title: "The tenure trade-off",
      body: (
        <>
          Stretch a loan longer and each EMI shrinks — tempting when money is
          tight. But you pay for that comfort: total interest rises, sometimes
          steeply. Shorter tenures cost more per month but far less overall.
        </>
      ),
    },
    {
      kind: "prose",
      body: (
        <p>
          Early EMIs are mostly interest, because interest is charged on a
          large outstanding balance. Only later do your payments start
          seriously reducing what you owe. That&rsquo;s why paying a little
          extra early, or prepaying, saves so much interest.
        </p>
      ),
    },
  ],
  quiz: [
    {
      id: "l1",
      question: "An EMI is made up of…",
      options: ["Only interest", "Only principal", "Part principal and part interest"],
      correct: 2,
      explanation: "Every EMI repays some principal and pays some interest; the mix shifts over time.",
    },
    {
      id: "l2",
      question: "Choosing a longer loan tenure generally…",
      options: ["Lowers the EMI but raises total interest", "Lowers both EMI and total interest", "Has no effect"],
      correct: 0,
      explanation: "Smaller monthly payments, but you pay interest for longer — more overall.",
    },
    {
      id: "l3",
      question: "In the early months of a loan, most of your EMI goes toward…",
      options: ["Principal", "Interest", "Bank fees"],
      correct: 1,
      explanation: "Interest is charged on a big outstanding balance early on, so early EMIs are interest-heavy.",
    },
  ],
};

export const LESSONS: Lesson[] = [savings, interest, loans];

export function getLesson(slug: string): Lesson | undefined {
  return LESSONS.find((l) => l.slug === slug);
}
