export function createChecks(ctx) {
  function fail(location, message) {
    ctx.errors.push(`${location}: ${message}`);
  }

  function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function checkAllowedFields(value, allowed, location) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      fail(location, "must be an object");
      return;
    }
    for (const field of Object.keys(value)) {
      if (!allowed.includes(field)) fail(location, `unsupported field ${field}`);
    }
  }

  function checkStringArray(value, location, { allowEmpty = false } = {}) {
    if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
      fail(location, allowEmpty ? "must be an array" : "must be a non-empty array");
      return;
    }
    if (value.some((item) => !isNonEmptyString(item))) {
      fail(location, "must contain only non-empty strings");
    }
    if (new Set(value).size !== value.length) {
      fail(location, "must not contain duplicates");
    }
  }

  return { fail, isNonEmptyString, checkAllowedFields, checkStringArray };
}
