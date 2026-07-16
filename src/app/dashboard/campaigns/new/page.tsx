import { CampaignEditor } from "../campaign-editor";

export default function NewCampaignPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-semibold mb-8">Tạo chiến dịch email</h1>
      <CampaignEditor />
    </div>
  );
}
