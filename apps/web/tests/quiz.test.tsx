import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import { Quiz, type QuizQuestion } from "@/components/lessons/quiz";

const QUESTIONS: QuizQuestion[] = [
  { id: "q1", question: "1 + 1 = ?", options: ["1", "2", "3"], correct: 1, explanation: "Two." },
  { id: "q2", question: "Sky colour?", options: ["Blue", "Green"], correct: 0, explanation: "Blue." },
];

describe("Quiz", () => {
  it("keeps the check button disabled until every question is answered", async () => {
    const user = userEvent.setup();
    render(<Quiz questions={QUESTIONS} onPassed={() => {}} />);
    expect(screen.getByRole("button", { name: /answer all questions/i })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "2" }));
    await user.click(screen.getByRole("button", { name: "Blue" }));
    expect(screen.getByRole("button", { name: /check answers/i })).toBeEnabled();
  });

  it("passing calls onPassed with the score and shows completion", async () => {
    const user = userEvent.setup();
    const onPassed = vi.fn();
    render(<Quiz questions={QUESTIONS} onPassed={onPassed} />);
    await user.click(screen.getByRole("button", { name: "2" }));
    await user.click(screen.getByRole("button", { name: "Blue" }));
    await user.click(screen.getByRole("button", { name: /check answers/i }));
    expect(onPassed).toHaveBeenCalledWith(100);
    expect(screen.getByText(/2\/2 correct \(100%\)/)).toBeInTheDocument();
    expect(screen.getByText(/lesson complete/i)).toBeInTheDocument();
  });

  it("failing does not call onPassed and offers a retry", async () => {
    const user = userEvent.setup();
    const onPassed = vi.fn();
    render(<Quiz questions={QUESTIONS} onPassed={onPassed} />);
    await user.click(screen.getByRole("button", { name: "1" })); // wrong
    await user.click(screen.getByRole("button", { name: "Green" })); // wrong
    await user.click(screen.getByRole("button", { name: /check answers/i }));
    expect(onPassed).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("reveals explanations after submitting", async () => {
    const user = userEvent.setup();
    render(<Quiz questions={QUESTIONS} onPassed={() => {}} />);
    await user.click(screen.getByRole("button", { name: "2" }));
    await user.click(screen.getByRole("button", { name: "Blue" }));
    await user.click(screen.getByRole("button", { name: /check answers/i }));
    expect(screen.getByText(/Two\./)).toBeInTheDocument();
    expect(screen.getByText(/Correct\. Blue\./)).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<Quiz questions={QUESTIONS} onPassed={() => {}} />);
    expect((await axe(container)).violations).toEqual([]);
  });
});
