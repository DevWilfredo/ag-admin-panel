export function getRoleLabel(role: string) {
  if (role === "PRODUCER") {
    return "Seller";
  }

  return role
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}
