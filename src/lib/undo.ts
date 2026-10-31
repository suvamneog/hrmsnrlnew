import { useDesk } from "./desk";
import { useHrms } from "./store";
import { toast } from "sonner";

/* Act at once and offer Undo, instead of asking "are you sure" first. Both stores live in the
   browser, so a snapshot taken just before the action is a complete and exact way back. */
export function withUndo(message: string, run: () => void) {
  const hrms = useHrms.getState();
  const desk = useDesk.getState();
  run();
  toast(message, {
    duration: 8000,
    action: {
      label: "Undo",
      onClick: () => {
        // Keep who is signed in and the language as they are now; restore everything else.
        const now = useHrms.getState();
        useHrms.setState({ ...hrms, currentUserId: now.currentUserId, actingRole: now.actingRole, locale: now.locale });
        useDesk.setState(desk);
        toast.success("Undone");
      },
    },
  });
}
