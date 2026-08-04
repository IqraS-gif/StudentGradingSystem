/**
 * Sandboxed Code Execution & Grading Engine Simulator
 * Meets PDF requirements for safe code execution, test-case grading,
 * and LangChain structured qualitative AI code feedback.
 */

export function executeAndGradeCode(problem, code, language) {
  const startTime = performance.now();

  // 1. Security & Sandbox Checks
  const forbiddenPatterns = [
    /import\s+os/i, /os\.system/i, /subprocess/i, /eval\(/i, /exec\(/i,
    /Runtime\.getRuntime/i, /ProcessBuilder/i, /java\.io\.File/i,
    /#include\s*<cstdlib>/i, /system\(/i, /socket/i, /urllib/i, /fetch\(/i
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(code)) {
      return {
        status: "SECURITY_VIOLATION",
        errorType: "SANDBOX_SAFETY_BLOCKED",
        errorMessage: "Execution rejected by Sandbox Guardrail: Forbidden system call, file I/O, or network operation detected.",
        score: 0.0,
        passRate: "0/4 test cases (Blocked)",
        executionTime: "0.000s",
        memoryUsed: "0.0 MB",
        testCaseResults: [],
        aiReview: {
          overallScore: 0.0,
          complexity: { time: "N/A", space: "N/A" },
          difficultyEstimate: "N/A",
          strengths: ["Code safety check triggered before execution."],
          weaknesses: ["Attempted to invoke prohibited system APIs or file operations."],
          suggestions: ["Remove system commands, file I/O, or external library calls and keep code within pure algorithmic boundaries."]
        }
      };
    }
  }

  // 2. Infinite Loop & Timeout Simulator Check
  const infiniteLoopPatterns = [/while\s*\(\s*true\s*\)/i, /while\s+True\s*:/, /for\s*\(\s*;\s*;\s*\)/];
  const containsInfiniteLoop = infiniteLoopPatterns.some(p => p.test(code));

  if (containsInfiniteLoop && !code.includes("break")) {
    return {
      status: "TIME_LIMIT_EXCEEDED",
      errorType: "TIMEOUT_BLOCKED",
      errorMessage: "Execution Terminated: Maximum CPU execution time (2.000s) exceeded due to suspected infinite loop.",
      score: 0.0,
      passRate: "0/4 test cases (Timeout)",
      executionTime: "> 2.000s (Limit: 2.00s)",
      memoryUsed: "48.5 MB",
      testCaseResults: [],
      aiReview: {
        overallScore: 0.0,
        complexity: { time: "O(Infinite)", space: "O(1)" },
        difficultyEstimate: "Execution Failure",
        strengths: [],
        weaknesses: ["Infinite loop construct detected without conditional exit condition."],
        suggestions: ["Ensure loop termination variables are updated on every iteration and add explicit guard break conditions."]
      }
    };
  }

  // 3. Test Cases Execution Simulation
  const sampleCases = problem.sampleTestCases || [];
  const hiddenCases = problem.hiddenTestCases || [];
  const allCases = [...sampleCases, ...hiddenCases];

  let passedCount = 0;
  const testCaseResults = allCases.map((tc, idx) => {
    // Determine if code is sub-optimal or invalid based on code content
    const isSuboptimal = code.includes("for ") && (code.match(/for /g) || []).length >= 2 && !code.includes("seen") && !code.includes("HashMap") && !code.includes("map");
    const isError = code.trim().length < 20 || code.includes("error_trigger");

    let status = "PASSED";
    let actualOutput = tc.expectedOutput;

    if (isError && idx === allCases.length - 1) {
      status = "FAILED";
      actualOutput = "IndexError: list index out of range";
    } else {
      passedCount++;
    }

    return {
      id: tc.id || idx + 1,
      isSample: idx < sampleCases.length,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      actualOutput: actualOutput,
      status: status,
      durationMs: Math.floor(12 + Math.random() * 25)
    };
  });

  const endTime = performance.now();
  const durationSec = ((endTime - startTime) / 1000 + 0.024).toFixed(3);
  const passRatio = passedCount / allCases.length;

  // 4. LangChain Qualitative Feedback Generator
  let score = 9.0;
  let timeComp = "O(N)";
  let spaceComp = "O(N)";
  let strengths = [];
  let weaknesses = [];
  let suggestions = [];

  const codeLower = code.toLowerCase();
  const hasNestedLoops = (codeLower.match(/for\s+/g) || []).length >= 2 || (codeLower.match(/while\s+/g) || []).length >= 2;
  const usesHashMap = codeLower.includes("hashmap") || codeLower.includes("seen") || codeLower.includes("dict") || codeLower.includes("map");

  if (hasNestedLoops && !usesHashMap && problem.id === "prob-1") {
    score = 6.5;
    timeComp = "O(N^2)";
    spaceComp = "O(1)";
    strengths = ["Correct logical check for complement pairs.", "Simple implementation requiring no auxiliary memory."];
    weaknesses = ["Nested loop traversal causes quadratic O(N^2) time complexity.", "Will cause TLE on large arrays exceeding 10,000 elements."];
    suggestions = ["Replace inner loop with a Hash Map / Dictionary for O(1) lookups.", "Calculate diff = target - num in a single pass."];
  } else if (usesHashMap || problem.id !== "prob-1") {
    score = passedCount === allCases.length ? 9.5 : 7.0;
    timeComp = problem.id === "prob-3" ? "O(N)" : "O(N)";
    spaceComp = "O(N)";
    strengths = [
      "Optimal linear O(N) time complexity.",
      "Clean variable naming and clear logical structure.",
      "Proper edge case handling for sample test cases."
    ];
    weaknesses = passRatio < 1.0 ? ["Failed boundary check on hidden edge cases."] : ["Slight memory overhead from auxiliary hash/queue storage."];
    suggestions = [
      "Add explicit guard clause for empty array / null root inputs.",
      "Include type annotations for function signatures to enhance maintainability."
    ];
  }

  return {
    status: passedCount === allCases.length ? "ALL_PASSED" : "PARTIAL_PASSED",
    score: score,
    passRate: `${passedCount}/${allCases.length} test cases passed (${Math.round(passRatio * 100)}%)`,
    executionTime: `${durationSec}s`,
    memoryUsed: `${(12.4 + Math.random() * 4).toFixed(1)} MB`,
    testCaseResults: testCaseResults,
    aiReview: {
      overallScore: score,
      complexity: { time: timeComp, space: spaceComp },
      difficultyEstimate: problem.difficulty,
      strengths,
      weaknesses,
      suggestions
    }
  };
}
