import { AutomationEditor } from "../automation-editor";

export default function NewAutomationPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-semibold mb-8">Tạo automation</h1>
      <AutomationEditor />
    </div>
  );
}
