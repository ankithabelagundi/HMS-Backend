import { ROLES } from "../constants/roles.js";

export const PERMISSIONS = {
  [ROLES.ADMIN]: ["create", "read", "update", "delete"],
  [ROLES.STAFF]: ["create", "update"],
  [ROLES.DOCTOR]: ["read"],
  [ROLES.PATIENT]: ["read_own"]
};
