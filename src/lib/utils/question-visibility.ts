/**
 * Evaluates whether a question or module should be visible based on its dependency logic.
 * Supports complex logic with operators and nested conditions (AND/OR).
 */
export const isQuestionVisible = (
  item: { dependsOn?: any },
  answers: Record<string, any>
): boolean => {
  if (!item.dependsOn) return true;

  return evaluateCondition(item.dependsOn, answers);
};

const evaluateCondition = (
  condition: any,
  answers: Record<string, any>
): boolean => {
  // Handle logical operators
  if (condition.or) {
    return (condition.or as any[]).some((subCondition) =>
      evaluateCondition(subCondition, answers)
    );
  }
  if (condition.and) {
    return (condition.and as any[]).every((subCondition) =>
      evaluateCondition(subCondition, answers)
    );
  }

  // Handle direct question dependency
  const { questionId, operator, value } = condition;
  let answer;

  // Special Case: Virtual question 'derived.has_cervix'
  // Used for screening visibility.
  if (questionId === 'derived.has_cervix') {
      // Check prophylactic surgery
      const prophylaxis = answers['prophylactic_surgery.type'] || [];
      const hasHysterectomy = Array.isArray(prophylaxis) && prophylaxis.includes('Hysterectomy');
      
      // Note: We don't check therapeutic hysterectomy (from personal cancer history) here deeply 
      // because that structure is complex to parse in frontend visibility logic without duplicating the service.
      // However, if the user explicitly selected "Hysterectomy" in prophylaxis, we know they don't have a cervix.
      // We assume true (has cervix) by default unless evidence to contrary.
      const hasCervix = !hasHysterectomy;
      answer = hasCervix;
  } else {
      answer = answers[questionId];
  }

  // Special case: 'age' is a derived variable, calculate it from 'dob' if missing
  if (questionId === 'age' && answer === undefined && answers['dob']) {
    const dob = String(answers['dob']);
    if (/^\d{4}$/.test(dob)) {
      answer = new Date().getFullYear() - parseInt(dob);
    } else {
      const birthDate = new Date(dob);
      if (!isNaN(birthDate.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        answer = age;
      }
    }
  }

  // If we don't have a structured condition (legacy format: {questionId, value})
  if (operator === undefined) {
    // Handle array dependency (e.g. checkbox group answer checking against a required value)
    if (Array.isArray(value)) {
        // If answer is array string, check if it contains any of required values
        try {
            const parsedAnswer = JSON.parse(answer);
            if (Array.isArray(parsedAnswer)) {
                return parsedAnswer.some((val) => value.includes(val));
            }
        } catch {
            // Not a JSON array
        }
        return value.includes(answer);
    }
    
    if (typeof value === 'boolean') {
        if (value) {
             return !!answer && answer !== '[]' && answer !== 'false' && answer !== '["HP:0000000"]';
        } else {
             return !answer || answer === '[]' || answer === 'false' || answer === '["HP:0000000"]';
        }
    }

    // Default equality check for simple dependency
    return answer === value;
  }

  // Handle operators
  const numAnswer = Number(answer);
  const numValue = Number(value);

  switch (operator) {
    case "=":
    case "==":
    case "equals":
      return answer == value;
    case "!=":
    case "not_equals":
      return answer != value;
    case ">":
      return !isNaN(numAnswer) && numAnswer > numValue;
    case ">=":
      return !isNaN(numAnswer) && numAnswer >= numValue;
    case "<":
      return !isNaN(numAnswer) && numAnswer < numValue;
    case "<=":
      return !isNaN(numAnswer) && numAnswer <= numValue;
    case "array_contains":
      // Check if the answer (assumed JSON string array) contains the value
      try {
        const parsed = JSON.parse(answer);
        return Array.isArray(parsed) && parsed.includes(value);
      } catch {
        return false;
      }
    default:
      return false;
  }
};
