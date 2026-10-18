import SchemaEditorClient from "./schema-client";

export async function generateStaticParams() {
  return [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }, { id: "5" }];
}

export default async function SchemaEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return <SchemaEditorClient templateId={resolvedParams.id} />;
}
