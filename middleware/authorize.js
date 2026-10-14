export function authorizeModification(req, res, next) {
  const user = req.user;
  const targetUserId = req.params.userId;

  if (!user) {
    return res.status(403).json({ error: "Access denied" });
  }

  const isParent = user.role === "parent";
  const userIdMatches = user.id == targetUserId || user.userId == targetUserId;
  const isChild = user.role === "child";

  if (isParent || (isChild && userIdMatches)) {
    return next();
  }

  return res.status(403).json({ error: "Access denied" });
}

export default authorizeModification;