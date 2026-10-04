type PrimaryEmail =
  | {
      emailAddress: string;
      verification?: { status: string } | null;
    }
  | null
  | undefined;

export function configuredAdminEmails(value: string | undefined): Set<string> {
  return new Set(
    (value ?? "")
      .split(/[,\s]+/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isVerifiedConfiguredAdmin(
  primaryEmail: PrimaryEmail,
  allowedEmails: ReadonlySet<string>,
): boolean {
  return (
    primaryEmail?.verification?.status === "verified" &&
    allowedEmails.has(primaryEmail.emailAddress.trim().toLowerCase())
  );
}

export function initialStoreRole(
  hasAdmins: boolean,
  verifiedConfiguredAdmin: boolean,
): "admin" | "customer" {
  return !hasAdmins || verifiedConfiguredAdmin ? "admin" : "customer";
}
