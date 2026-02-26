import { PERMISSIONS } from "../config/permissions.js";


export const checkPermission = (action) => {
  return (req, res, next) => {
    const user = req.user;
    const rolePermissions = PERMISSIONS[user.role];

    if (!rolePermissions.includes(action)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (action === "read_own") {
      if (user.id !== req.params.id) {
        return res.status(403).json({ message: "You can only view your own profile" });
      }
    }

    next();
  };
};

