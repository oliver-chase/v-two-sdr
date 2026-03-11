const handler = async (event: any) => {
  if (event.type === "agent" && event.action === "before_model_resolve") {
    const model = event.context?.model ?? "unknown";
    if (!model.includes("gemini") && !model.includes("haiku")) {
      event.messages?.push(`⚠️ WARNING: Expensive model selected: ${model}`);
    }
  }
};
export default handler;
