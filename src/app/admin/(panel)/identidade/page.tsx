import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/admin-shell";
import { SettingsForm } from "@/components/admin/settings-form";
import { adminPreviewMode, loadSettings } from "@/lib/admin/data";
import { SETTINGS_PAGES } from "@/lib/admin/settings-fields";

const page = SETTINGS_PAGES["identidade"];
export const metadata: Metadata = { title: page.title };

export default async function Page() {
  const settings = await loadSettings();
  return (
    <>
      <PageTitle title={page.title} intro={page.intro} />
      <SettingsForm page="identidade" settings={settings} readOnly={adminPreviewMode} />
    </>
  );
}
