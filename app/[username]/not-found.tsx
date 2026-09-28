import { StatusScreen } from "@/components/StatusScreen";
import { UsernameForm } from "@/components/UsernameForm";

// Shown when the page calls notFound(): the user does not exist, the name is
// not a valid GitHub username, or it belongs to an organization.
export default function UserNotFound() {
  return (
    <StatusScreen
      emoji="🔍"
      title="We couldn't find that GitHub user"
      message="Check the spelling and try again. Organization accounts are not supported, only personal ones."
    >
      <UsernameForm />
    </StatusScreen>
  );
}
