// @ts-check

// UUID v4 regex pattern
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Checks if the req.params.id is a valid UUID (used by Supabase/PostgreSQL).
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @throws {Error} Throws an error if the UUID is invalid.
 */
function checkObjectId(req, res, next) {
  if (!UUID_REGEX.test(req.params.id)) {
    res.status(404);
    throw new Error(`Invalid ID: ${req.params.id}`);
  }
  next();
}

export default checkObjectId;
